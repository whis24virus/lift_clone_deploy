use axum::{
    extract::{State, Path},
    Json,
};
use crate::{AppState, models::User};
use serde::Serialize;
use uuid::Uuid;
use sqlx::{FromRow, Row};
use chrono::{DateTime, Utc, NaiveDate};

#[derive(Serialize)]
pub struct DailyActivity {
    pub date: String,
    pub volume_kg: f64,
}

#[derive(Serialize)]
pub struct WorkoutHistoryEntry {
    pub id: Uuid,
    pub name: Option<String>,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub total_volume_kg: f64,
    pub exercise_count: i64,
}

#[derive(Serialize)]
pub struct UserProfile {
    pub username: String,
    pub total_workouts: i64,
    pub total_volume_kg: f64,
    pub join_date: DateTime<Utc>,
    pub activity_log: Vec<DailyActivity>,
    pub current_streak: i64,
    pub max_streak: i64,
}

#[derive(Serialize, FromRow)]
pub struct LeaderboardEntry {
    pub username: String,
    pub total_volume_kg: Option<f64>,
    pub rank: Option<i64>,
}

pub async fn get_profile(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Json<UserProfile> {
    // Fetch user - return defaults if not found
    let user = match sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(&state.db)
        .await
    {
        Ok(Some(u)) => u,
        _ => {
            return Json(UserProfile {
                username: "Titan".to_string(),
                total_workouts: 0,
                total_volume_kg: 0.0,
                join_date: Utc::now(),
                activity_log: vec![],
                current_streak: 0,
                max_streak: 0,
            });
        }
    };

    // Fetch basic stats (cast to FLOAT8 for f64)
    let stats = match sqlx::query(
        r#"SELECT
            COUNT(DISTINCT w.id) as workout_count,
            COALESCE(SUM(s.weight_kg * s.reps), 0)::FLOAT8 as total_volume
        FROM workouts w
        LEFT JOIN sets s ON w.id = s.workout_id
        WHERE w.user_id = $1"#
    )
    .bind(user_id)
    .fetch_one(&state.db)
    .await
    {
        Ok(s) => s,
        Err(_) => {
            return Json(UserProfile {
                username: user.username,
                total_workouts: 0,
                total_volume_kg: 0.0,
                join_date: user.created_at,
                activity_log: vec![],
                current_streak: 0,
                max_streak: 0,
            });
        }
    };

    let workout_count: i64 = stats.get("workout_count");
    let total_volume: f64 = stats.try_get::<Option<f64>, _>("total_volume").unwrap_or(None).unwrap_or(0.0);

    // Fetch daily activity for the last 365 days (cast to FLOAT8)
    let activity = sqlx::query(
        r#"SELECT
            DATE(w.start_time) as work_date,
            COALESCE(SUM(s.weight_kg * s.reps), 0)::FLOAT8 as daily_volume
        FROM workouts w
        LEFT JOIN sets s ON w.id = s.workout_id
        WHERE w.user_id = $1 AND w.start_time > NOW() - INTERVAL '1 year'
        GROUP BY work_date
        ORDER BY work_date ASC"#
    )
    .bind(user_id)
    .fetch_all(&state.db)
    .await
    .unwrap_or(vec![]);

    let activity_log: Vec<DailyActivity> = activity.iter().map(|rec| {
        let date: Option<NaiveDate> = rec.get("work_date");
        let volume: f64 = rec.try_get::<Option<f64>, _>("daily_volume").unwrap_or(None).unwrap_or(0.0);
        DailyActivity {
            date: date.map(|d| d.to_string()).unwrap_or_default(),
            volume_kg: volume,
        }
    }).collect();

    // Calculate streaks
    let mut current_streak = 0;
    let mut max_streak = 0;
    let mut temp_streak = 0;
    let mut last_date: Option<NaiveDate> = None;
    
    let mut sorted_dates: Vec<NaiveDate> = activity.iter()
        .filter_map(|r| r.get::<Option<NaiveDate>, _>("work_date"))
        .collect();
    sorted_dates.sort();
    sorted_dates.dedup();

    for date in sorted_dates.iter() {
        if let Some(prev) = last_date {
            let diff = date.signed_duration_since(prev).num_days();
            if diff == 1 {
                temp_streak += 1;
            } else {
                temp_streak = 1;
            }
        } else {
            temp_streak = 1;
        }
        
        if temp_streak > max_streak {
            max_streak = temp_streak;
        }
        last_date = Some(*date);
    }
    
    let today = Utc::now().date_naive();
    if let Some(last) = last_date {
        let diff = today.signed_duration_since(last).num_days();
        if diff <= 1 {
            current_streak = temp_streak;
        } else {
            current_streak = 0;
        }
    }

    Json(UserProfile {
        username: user.username,
        total_workouts: workout_count,
        total_volume_kg: total_volume,
        join_date: user.created_at,
        activity_log,
        current_streak,
        max_streak,
    })
}

pub async fn get_leaderboard(
    State(state): State<AppState>,
) -> Json<Vec<LeaderboardEntry>> {
    let leaderboard = sqlx::query_as::<_, LeaderboardEntry>(
        r#"SELECT 
            u.username,
            COALESCE(SUM(s.weight_kg * s.reps), 0)::FLOAT8 as total_volume_kg,
            RANK() OVER (ORDER BY SUM(s.weight_kg * s.reps) DESC)::BIGINT as rank
        FROM users u
        LEFT JOIN workouts w ON u.id = w.user_id
        LEFT JOIN sets s ON w.id = s.workout_id
        GROUP BY u.id, u.username
        ORDER BY total_volume_kg DESC
        LIMIT 10"#
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or(vec![]);

    Json(leaderboard)
}

pub async fn get_workout_history(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Json<Vec<WorkoutHistoryEntry>> {
    let history = sqlx::query(
        r#"SELECT 
            w.id,
            w.name,
            w.start_time,
            w.end_time,
            COALESCE(SUM(s.weight_kg * s.reps), 0)::FLOAT8 as total_volume,
            COUNT(DISTINCT s.exercise_id) as exercise_count
        FROM workouts w
        LEFT JOIN sets s ON w.id = s.workout_id
        WHERE w.user_id = $1 AND w.end_time IS NOT NULL
        GROUP BY w.id
        ORDER BY w.start_time DESC
        LIMIT 20"#
    )
    .bind(user_id)
    .fetch_all(&state.db)
    .await
    .unwrap_or(vec![]);

    let response = history.iter().map(|rec| {
        let volume: f64 = rec.try_get::<Option<f64>, _>("total_volume").unwrap_or(None).unwrap_or(0.0);
        WorkoutHistoryEntry {
            id: rec.get("id"),
            name: rec.get("name"),
            start_time: rec.get::<Option<DateTime<Utc>>, _>("start_time").unwrap_or(Utc::now()),
            end_time: rec.get("end_time"),
            total_volume_kg: volume,
            exercise_count: rec.get("exercise_count"),
        }
    }).collect();

    Json(response)
}
