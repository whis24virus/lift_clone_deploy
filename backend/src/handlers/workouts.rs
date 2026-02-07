use axum::{
    extract::{State, Path},
    Json,
    http::StatusCode,
};
use crate::{AppState, models::{Workout, Set}};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use sqlx::Row;

#[derive(Deserialize)]
pub struct CreateWorkoutRequest {
    pub user_id: Uuid,
    pub name: Option<String>,
    pub start_time: Option<chrono::DateTime<chrono::Utc>>,
    pub template_id: Option<Uuid>,
}

pub async fn create_workout(
    State(state): State<AppState>,
    Json(payload): Json<CreateWorkoutRequest>,
) -> Json<Workout> {
    let workout = sqlx::query_as::<_, Workout>(
        "INSERT INTO workouts (user_id, name, start_time, template_id) VALUES ($1, $2, $3, $4) RETURNING *"
    )
    .bind(payload.user_id)
    .bind(&payload.name)
    .bind(payload.start_time)
    .bind(payload.template_id)
    .fetch_one(&state.db)
    .await
    .unwrap();

    Json(workout)
}

#[derive(Serialize)]
pub struct LogSetResponse {
    pub set: Set,
    pub is_new_1rm: bool,
    pub is_vol_pr: bool,
}

#[derive(Deserialize)]
pub struct LogSetRequest {
    pub workout_id: Uuid,
    pub exercise_id: Uuid,
    pub weight_kg: f32,
    pub reps: i32,
    pub rpe: Option<f32>,
}

pub async fn log_set(
    State(state): State<AppState>,
    Json(payload): Json<LogSetRequest>,
) -> Result<Json<LogSetResponse>, (StatusCode, String)> {
    // 1. Get User ID from workout
    let row = sqlx::query("SELECT user_id FROM workouts WHERE id = $1")
        .bind(payload.workout_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to fetch workout user: {}", e)))?;

    let user_id: Uuid = row.get("user_id");

    // 2. Check previous max WEIGHT for this exercise/user
    let max_row = sqlx::query(
        r#"SELECT MAX(s.weight_kg)::FLOAT4 as max_val 
        FROM sets s
        JOIN workouts w ON s.workout_id = w.id
        WHERE s.exercise_id = $1 AND w.user_id = $2"#
    )
    .bind(payload.exercise_id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to fetch max weight: {}", e)))?;

    let prev_max_weight: f32 = max_row.try_get::<Option<f32>, _>("max_val").unwrap_or(None).unwrap_or(0.0);

    // 3. Check previous max REPS at this weight (or higher)
    let reps_row = sqlx::query(
        r#"SELECT MAX(s.reps) as max_val 
        FROM sets s
        JOIN workouts w ON s.workout_id = w.id
        WHERE s.exercise_id = $1 
        AND w.user_id = $2
        AND s.weight_kg >= $3"#
    )
    .bind(payload.exercise_id)
    .bind(user_id)
    .bind(payload.weight_kg)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to fetch max reps: {}", e)))?;

    let prev_max_reps: i32 = reps_row.try_get::<Option<i32>, _>("max_val").unwrap_or(None).unwrap_or(0);

    // 4. Insert Set
    let set = sqlx::query_as::<_, Set>(
        "INSERT INTO sets (workout_id, exercise_id, weight_kg, reps, rpe) VALUES ($1, $2, $3, $4, $5) RETURNING *"
    )
    .bind(payload.workout_id)
    .bind(payload.exercise_id)
    .bind(payload.weight_kg)
    .bind(payload.reps)
    .bind(payload.rpe)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to insert set: {}", e)))?;

    // 5. Determine Rewards
    let is_new_1rm = set.weight_kg > prev_max_weight;
    let is_vol_pr = !is_new_1rm && set.reps > prev_max_reps && set.reps > 5;

    Ok(Json(LogSetResponse { set, is_new_1rm, is_vol_pr }))
}

pub async fn list_sets(
    State(state): State<AppState>,
) -> Json<Vec<Set>> {
    let sets = sqlx::query_as::<_, Set>(
        "SELECT * FROM sets ORDER BY created_at DESC LIMIT 1000"
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or(vec![]);

    Json(sets)
}

pub async fn delete_set(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> StatusCode {
    let result = sqlx::query("DELETE FROM sets WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await;

    match result {
        Ok(_) => StatusCode::NO_CONTENT,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

#[derive(Serialize)]
pub struct FinishWorkoutResponse {
    pub id: Uuid,
    pub end_time: chrono::DateTime<chrono::Utc>,
    pub badges: Vec<String>,
}

pub async fn finish_workout(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Json<FinishWorkoutResponse> {
    let now = chrono::Utc::now();
    
    // 1. Fetch workout details, volume, and user weight (cast to FLOAT8 to get f64)
    let workout_data = sqlx::query(
        r#"SELECT 
            w.start_time, 
            w.user_id,
            u.current_weight_kg,
            COALESCE(SUM(s.weight_kg * s.reps), 0)::FLOAT8 as volume,
            COUNT(s.id) as set_count
        FROM workouts w
        JOIN users u ON w.user_id = u.id
        LEFT JOIN sets s ON w.id = s.workout_id
        WHERE w.id = $1
        GROUP BY w.id, w.start_time, w.user_id, u.current_weight_kg"#
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .unwrap();

    let start_time: Option<chrono::DateTime<chrono::Utc>> = workout_data.get("start_time");
    let user_id: Uuid = workout_data.get("user_id");
    let current_weight: Option<f64> = workout_data.get("current_weight_kg");
    let volume: f64 = workout_data.try_get::<Option<f64>, _>("volume").unwrap_or(None).unwrap_or(0.0);
    let set_count: i64 = workout_data.get("set_count");

    // 2. Calculate Stats
    let duration_minutes = if let Some(start) = start_time {
        (now - start).num_minutes() as f64
    } else {
        60.0
    };

    let weight = current_weight.unwrap_or(75.0);
    
    let intensity_factor = if duration_minutes > 0.0 {
        (volume / duration_minutes) / 100.0
    } else {
        1.0
    };
    
    let met = (3.0_f64 + intensity_factor).min(8.0_f64);
    let duration_hours = duration_minutes / 60.0;
    let calories_burned = (met * weight * duration_hours) as i32;

    // 3. Determine Badges
    let mut badges = Vec::new();
    if volume >= 10000.0 {
        badges.push("Titan Volume".to_string());
    } else if volume >= 5000.0 {
        badges.push("Heavy Lifter".to_string());
    }

    if duration_minutes >= 90.0 {
        badges.push("Marathoner".to_string());
    } else if duration_minutes <= 30.0 && volume > 2000.0 {
        badges.push("Speed Demon".to_string());
    }
    
    if set_count >= 20 {
         badges.push("Volume Warrior".to_string());
    }

    // Insert badges
    for badge in &badges {
        let _ = sqlx::query(
            "INSERT INTO user_badges (user_id, workout_id, badge_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING"
        )
        .bind(user_id)
        .bind(id)
        .bind(badge)
        .execute(&state.db)
        .await;
    }

    // 4. Update Workout
    let _ = sqlx::query("UPDATE workouts SET end_time = $1, calories_burned = $2 WHERE id = $3")
        .bind(now)
        .bind(calories_burned)
        .bind(id)
        .execute(&state.db)
        .await
        .unwrap();

    Json(FinishWorkoutResponse {
        id,
        end_time: now,
        badges,
    })
}

pub async fn get_active_workout(
    State(state): State<AppState>,
) -> Result<Json<Workout>, StatusCode> {
    let user_id = Uuid::parse_str("763b9c95-4bae-4044-9d30-7ae513286b37").unwrap();

    let workout = sqlx::query_as::<_, Workout>(
        "SELECT * FROM workouts WHERE user_id = $1 AND end_time IS NULL ORDER BY start_time DESC LIMIT 1"
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match workout {
        Some(w) => Ok(Json(w)),
        None => Err(StatusCode::NOT_FOUND),
    }
}
