import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Activity, Calendar, Flame, Zap, Scale, Utensils, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { fetchWorkoutHistory, fetchPhysicalStats, updatePhysicalStats, fetchWeightHistory, fetchNutritionLog, logNutrition } from '../api/client';
import { useState } from 'react';

// Hardcoded user ID for demo
const USER_ID = "763b9c95-4bae-4044-9d30-7ae513286b37";

interface UserProfile {
    username: string;
    total_workouts: number;
    total_volume_kg: number;
    join_date: string;
    activity_log: { date: string, volume_kg: number }[];
    current_streak: number;
    max_streak: number;
}

async function fetchProfile(userId: string): Promise<UserProfile> {
    const res = await fetch(`/api/profile/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
}

export function Profile() {
    const queryClient = useQueryClient();
    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile', USER_ID],
        queryFn: () => fetchProfile(USER_ID)
    });

    const { data: history } = useQuery({
        queryKey: ['history', USER_ID],
        queryFn: () => fetchWorkoutHistory(USER_ID)
    });

    const { data: stats } = useQuery({
        queryKey: ['stats', USER_ID],
        queryFn: () => fetchPhysicalStats(USER_ID)
    });

    const { data: nutrition } = useQuery({
        queryKey: ['nutrition', USER_ID],
        queryFn: () => fetchNutritionLog(USER_ID)
    });

    const { data: weightHistory } = useQuery({
        queryKey: ['weight', USER_ID],
        queryFn: () => fetchWeightHistory(USER_ID)
    });

    // Mutations
    const updateStatsMutation = useMutation({
        mutationFn: (data: any) => updatePhysicalStats(USER_ID, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stats', USER_ID] })
    });

    const logNutritionMutation = useMutation({
        mutationFn: (data: any) => logNutrition(USER_ID, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nutrition', USER_ID] })
    });

    const [isEditingStats, setIsEditingStats] = useState(false);
    const [editForm, setEditForm] = useState({ height_cm: 0, weight_kg: 0, gender: 'male', activity_level: 'moderate' });
    const [calorieInput, setCalorieInput] = useState("");

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    const tdee = stats?.tdee || 2000;
    const caloriesConsumed = nutrition?.calories_in || 0;
    const calorieProgress = Math.min((caloriesConsumed / tdee) * 100, 100);

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-24 relative">
            {/* Header with Liquid Glass Effect */}
            <header className="relative">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4"
                >
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-purple-500 p-0.5">
                            <div className="w-full h-full rounded-2xl bg-[#0a0b10] flex items-center justify-center">
                                <span className="text-2xl font-bold bg-gradient-to-br from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                    {profile?.username?.charAt(0) || 'T'}
                                </span>
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-black" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {profile?.username || 'Titan'}
                        </h1>
                        <p className="text-sm text-white/50">
                            Member since {profile?.join_date ? new Date(profile.join_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Today'}
                        </p>
                    </div>
                </motion.div>
            </header>

            {/* Stats Grid - Glassmorphic Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
                <GlassStatCard
                    icon={<Activity className="w-5 h-5" />}
                    iconColor="text-blue-400"
                    iconBg="from-blue-500/20 to-cyan-500/20"
                    label="Total Volume"
                    value={`${((profile?.total_volume_kg || 0) / 1000).toFixed(1)}t`}
                />
                <Link to="/awards" className="block">
                    <GlassStatCard
                        icon={<Trophy className="w-5 h-5" />}
                        iconColor="text-yellow-400"
                        iconBg="from-yellow-500/20 to-orange-500/20"
                        label="Workouts"
                        value={profile?.total_workouts?.toString() || "0"}
                        interactive
                    />
                </Link>
                <GlassStatCard
                    icon={<Flame className="w-5 h-5" />}
                    iconColor="text-orange-400"
                    iconBg="from-orange-500/20 to-red-500/20"
                    label="Current Streak"
                    value={`${profile?.current_streak || 0}d`}
                    highlight={profile?.current_streak && profile.current_streak > 0}
                />
                <GlassStatCard
                    icon={<Zap className="w-5 h-5" />}
                    iconColor="text-purple-400"
                    iconBg="from-purple-500/20 to-pink-500/20"
                    label="Best Streak"
                    value={`${profile?.max_streak || 0}d`}
                />
            </motion.div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                    {/* Physical Stats Card - Liquid Glass */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-xl opacity-50" />
                        <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                        <Scale className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <h3 className="font-semibold text-white">Physique</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditForm({
                                            height_cm: stats?.height_cm || 175,
                                            weight_kg: stats?.current_weight_kg || 75,
                                            gender: stats?.gender || 'male',
                                            activity_level: stats?.activity_level || 'moderate'
                                        });
                                        setIsEditingStats(!isEditingStats);
                                    }}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    {isEditingStats ? 'Cancel' : 'Edit'}
                                </button>
                            </div>

                            {isEditingStats ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-white/40 mb-1 block">Height (cm)</label>
                                            <input
                                                type="number"
                                                value={editForm.height_cm}
                                                onChange={(e) => setEditForm({ ...editForm, height_cm: Number(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/40 mb-1 block">Weight (kg)</label>
                                            <input
                                                type="number"
                                                value={editForm.weight_kg}
                                                onChange={(e) => setEditForm({ ...editForm, weight_kg: Number(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            updateStatsMutation.mutate(editForm);
                                            setIsEditingStats(false);
                                        }}
                                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                                            <p className="text-xs text-white/40">Height</p>
                                            <p className="text-xl font-bold text-white">{stats?.height_cm || "—"} <span className="text-xs text-white/40 font-normal">cm</span></p>
                                        </div>
                                        <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                                            <p className="text-xs text-white/40">Weight</p>
                                            <p className="text-xl font-bold text-white">{stats?.current_weight_kg || "—"} <span className="text-xs text-white/40 font-normal">kg</span></p>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-emerald-400/70">Daily Calories (TDEE)</p>
                                                <p className="text-2xl font-bold text-white">{stats?.tdee || "—"}</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                                                <Zap className="w-6 h-6 text-emerald-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Nutrition Card - Liquid Glass */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 blur-xl opacity-50" />
                        <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                    <Utensils className="w-4 h-4 text-green-400" />
                                </div>
                                <h3 className="font-semibold text-white">Today's Nutrition</h3>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className={`font-semibold ${caloriesConsumed > tdee ? "text-red-400" : "text-green-400"}`}>
                                        {caloriesConsumed} kcal
                                    </span>
                                    <span className="text-white/40">/ {tdee} goal</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${calorieProgress}%` }}
                                        className={`h-full rounded-full ${caloriesConsumed > tdee ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-green-500 to-emerald-400"}`}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Add calories..."
                                    value={calorieInput}
                                    onChange={(e) => setCalorieInput(e.target.value)}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50"
                                />
                                <button
                                    onClick={() => {
                                        if (calorieInput) {
                                            logNutritionMutation.mutate({ calories_in: Number(calorieInput) });
                                            setCalorieInput("");
                                        }
                                    }}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Activity Heatmap - Liquid Glass */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 blur-xl" />
                        <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-emerald-400" />
                                </div>
                                <h3 className="font-semibold text-white">Activity</h3>
                            </div>
                            {profile?.activity_log && profile.activity_log.length > 0 ? (
                                <ActivityHeatmap data={profile.activity_log} />
                            ) : (
                                <div className="h-24 flex items-center justify-center text-white/40 border border-dashed border-white/10 rounded-xl">
                                    Complete workouts to see your activity!
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Weight Trend - Liquid Glass */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 blur-xl" />
                        <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                                    <Scale className="w-4 h-4 text-cyan-400" />
                                </div>
                                <h3 className="font-semibold text-white">Weight Trend</h3>
                            </div>
                            {weightHistory && weightHistory.length > 1 ? (
                                <div className="h-32 flex items-end justify-between gap-1">
                                    {(() => {
                                        const weights = weightHistory.map(w => w.weight_kg);
                                        const min = Math.min(...weights) * 0.95;
                                        const max = Math.max(...weights) * 1.05;
                                        return weightHistory.slice(-12).map((entry, idx) => {
                                            const heightPct = ((entry.weight_kg - min) / (max - min)) * 100;
                                            return (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${heightPct}%` }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="flex-1 bg-gradient-to-t from-cyan-500/50 to-cyan-400/20 hover:from-cyan-400 hover:to-cyan-300/40 rounded-t transition-colors cursor-pointer group relative"
                                                >
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-10">
                                                        {entry.weight_kg}kg
                                                    </div>
                                                </motion.div>
                                            );
                                        });
                                    })()}
                                </div>
                            ) : (
                                <div className="h-32 flex items-center justify-center text-white/40 border border-dashed border-white/10 rounded-xl">
                                    Log your weight to see trends
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Recent Workouts - Liquid Glass */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="relative"
            >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 blur-xl" />
                <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-blue-400" />
                            </div>
                            <h3 className="font-semibold text-white">Recent Workouts</h3>
                        </div>
                        <Link to="/history" className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors">
                            View all <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {history?.length === 0 ? (
                            <p className="text-white/40 text-center py-8">No workouts completed yet.</p>
                        ) : (
                            history?.slice(0, 5).map((workout, idx) => (
                                <motion.div
                                    key={workout.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + idx * 0.1 }}
                                    className="bg-white/[0.02] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-medium text-white">{workout.name || "Workout"}</h4>
                                            <p className="text-xs text-white/40">
                                                {new Date(workout.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="flex gap-4 text-right">
                                            <div>
                                                <p className="text-sm font-semibold text-emerald-400">{workout.total_volume_kg.toLocaleString()}kg</p>
                                                <p className="text-xs text-white/40">volume</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{workout.exercise_count}</p>
                                                <p className="text-xs text-white/40">exercises</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function GlassStatCard({
    icon,
    iconColor,
    iconBg,
    label,
    value,
    interactive = false,
    highlight = false
}: {
    icon: React.ReactNode;
    iconColor: string;
    iconBg: string;
    label: string;
    value: string;
    interactive?: boolean;
    highlight?: boolean;
}) {
    return (
        <motion.div
            whileHover={interactive ? { scale: 1.02 } : undefined}
            whileTap={interactive ? { scale: 0.98 } : undefined}
            className={`relative overflow-hidden bg-white/[0.03] backdrop-blur-xl border rounded-2xl p-4 ${highlight
                    ? 'border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                    : 'border-white/10 hover:border-white/20'
                } transition-all`}
        >
            {highlight && (
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"
                />
            )}
            <div className="relative">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center mb-3`}>
                    <span className={iconColor}>{icon}</span>
                </div>
                <p className="text-xs text-white/50 mb-1">{label}</p>
                <p className="text-xl font-bold text-white">{value}</p>
            </div>
        </motion.div>
    );
}
