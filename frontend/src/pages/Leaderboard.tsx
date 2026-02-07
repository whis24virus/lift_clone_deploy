import { useQuery } from '@tanstack/react-query';
import { Medal, Crown, TrendingUp, Trophy, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
    username: string;
    total_volume_kg: number;
    rank: number;
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    const res = await fetch(`/api/leaderboard`);
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return res.json();
}

export function Leaderboard() {
    const { data: leaderboard, isLoading } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: fetchLeaderboard
    });

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    const top3 = leaderboard?.slice(0, 3) || [];
    const rest = leaderboard?.slice(3) || [];

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-24 relative">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                <motion.div
                    animate={{
                        rotate: [0, 360],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-transparent blur-3xl"
                />
                <motion.div
                    animate={{
                        rotate: [360, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-purple-500/15 via-pink-500/10 to-transparent blur-3xl"
                />
            </div>

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
            >
                <motion.div
                    animate={{
                        rotateY: [0, 10, -10, 0],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="inline-block"
                >
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 p-0.5 shadow-[0_0_40px_rgba(234,179,8,0.4)]">
                        <div className="w-full h-full rounded-2xl bg-[#0a0b10] flex items-center justify-center">
                            <Crown className="w-10 h-10 text-yellow-400" />
                        </div>
                    </div>
                </motion.div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                    Global Rankings
                </h1>
                <p className="text-white/50">Who lifts the heaviest?</p>
            </motion.header>

            {/* Top 3 Podium */}
            {top3.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-end justify-center gap-3 h-64"
                >
                    {/* 2nd Place */}
                    {top3[1] && (
                        <PodiumCard entry={top3[1]} position={2} delay={0.4} />
                    )}

                    {/* 1st Place */}
                    {top3[0] && (
                        <PodiumCard entry={top3[0]} position={1} delay={0.3} />
                    )}

                    {/* 3rd Place */}
                    {top3[2] && (
                        <PodiumCard entry={top3[2]} position={3} delay={0.5} />
                    )}
                </motion.div>
            )}

            {/* Rest of Leaderboard */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="relative"
            >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent blur-xl" />
                <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                    {rest.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {rest.map((entry, idx) => (
                                <motion.div
                                    key={entry.username}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + idx * 0.05 }}
                                    className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="w-8 text-center font-mono text-white/40">#{entry.rank}</span>
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                                            <span className="text-sm font-bold text-white/70">
                                                {entry.username.substring(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="font-medium text-white">{entry.username}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-emerald-400 font-semibold">
                                            {(entry.total_volume_kg / 1000).toFixed(1)}t
                                        </span>
                                        <TrendingUp className="w-4 h-4 text-emerald-400/50" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : top3.length === 0 ? (
                        <div className="py-16 text-center text-white/40">
                            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>No rankings yet. Start lifting to be first!</p>
                        </div>
                    ) : null}
                </div>
            </motion.div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center"
            >
                <p className="text-xs text-white/30 flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Rankings update in real-time based on logged sets
                    <Sparkles className="w-3 h-3" />
                </p>
            </motion.div>
        </div>
    );
}

function PodiumCard({ entry, position, delay }: { entry: LeaderboardEntry; position: 1 | 2 | 3; delay: number }) {
    const heights = { 1: 'h-40', 2: 'h-32', 3: 'h-28' };
    const widths = { 1: 'w-28', 2: 'w-24', 3: 'w-24' };
    const gradients = {
        1: 'from-yellow-500 via-orange-500 to-yellow-600',
        2: 'from-gray-300 via-gray-400 to-gray-300',
        3: 'from-amber-600 via-amber-700 to-amber-600'
    };
    const glows = {
        1: 'shadow-[0_0_40px_rgba(234,179,8,0.4)]',
        2: 'shadow-[0_0_20px_rgba(156,163,175,0.2)]',
        3: 'shadow-[0_0_20px_rgba(217,119,6,0.2)]'
    };
    const badges = { 1: '🥇', 2: '🥈', 3: '🥉' };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', damping: 12 }}
            className={`${widths[position]} flex flex-col items-center`}
        >
            {/* Avatar */}
            <motion.div
                animate={position === 1 ? {
                    boxShadow: ['0 0 20px rgba(234,179,8,0.4)', '0 0 40px rgba(234,179,8,0.6)', '0 0 20px rgba(234,179,8,0.4)']
                } : undefined}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradients[position]} p-0.5 mb-2 ${glows[position]}`}
            >
                <div className="w-full h-full rounded-2xl bg-[#0a0b10] flex items-center justify-center">
                    <span className="font-bold text-white">
                        {entry.username.substring(0, 2).toUpperCase()}
                    </span>
                </div>
            </motion.div>

            {/* Name & Volume */}
            <p className="text-sm font-medium text-white truncate w-full text-center mb-1">
                {entry.username}
            </p>
            <p className="text-xs font-mono text-emerald-400 mb-3">
                {(entry.total_volume_kg / 1000).toFixed(1)}t
            </p>

            {/* Podium */}
            <motion.div
                initial={{ height: 0 }}
                animate={{ height: position === 1 ? 160 : position === 2 ? 128 : 112 }}
                transition={{ delay: delay + 0.2, type: 'spring', damping: 15 }}
                className={`w-full bg-gradient-to-t from-white/[0.02] to-white/[0.08] backdrop-blur-sm border border-white/10 rounded-t-xl flex items-start justify-center pt-3`}
            >
                <span className="text-2xl">{badges[position]}</span>
            </motion.div>
        </motion.div>
    );
}
