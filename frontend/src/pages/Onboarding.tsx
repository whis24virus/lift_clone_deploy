import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Ruler, Weight, Calendar, Activity, ChevronRight, Sparkles } from 'lucide-react';

const activityLevels = [
    { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
    { value: 'light', label: 'Light', desc: '1-3 days/week' },
    { value: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
    { value: 'active', label: 'Active', desc: '6-7 days/week' },
    { value: 'athlete', label: 'Athlete', desc: 'Pro-level training' },
];

const genderOptions = [
    { value: 'male', label: 'Male', emoji: '♂️' },
    { value: 'female', label: 'Female', emoji: '♀️' },
];

export function Onboarding() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        username: '',
        gender: '',
        height_cm: '',
        weight_kg: '',
        date_of_birth: '',
        activity_level: 'moderate',
    });

    const steps = [
        { title: 'Welcome', icon: Sparkles },
        { title: 'Profile', icon: User },
        { title: 'Body', icon: Ruler },
        { title: 'Activity', icon: Activity },
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        // Save to localStorage as default user
        localStorage.setItem('titanLiftUser', JSON.stringify({
            ...formData,
            id: '763b9c95-4bae-4044-9d30-7ae513286b37',
            created_at: new Date().toISOString(),
        }));
        navigate('/');
    };

    const isStepValid = () => {
        switch (step) {
            case 0: return true;
            case 1: return formData.username.length >= 2 && formData.gender;
            case 2: return formData.height_cm && formData.weight_kg && formData.date_of_birth;
            case 3: return formData.activity_level;
            default: return true;
        }
    };

    return (
        <div className="min-h-screen bg-[#030508] relative overflow-hidden flex flex-col">
            {/* iOS 26 Liquid Glass Background Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Animated gradient orbs */}
                <motion.div
                    animate={{
                        x: [0, 30, 0],
                        y: [0, -20, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-500/30 via-cyan-500/20 to-transparent blur-3xl"
                />
                <motion.div
                    animate={{
                        x: [0, -20, 0],
                        y: [0, 30, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-indigo-500/25 via-purple-500/15 to-transparent blur-3xl"
                />
                {/* Noise texture overlay */}
                <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjciLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjYSkiLz48L3N2Zz4=')]" />
            </div>

            {/* Progress Bar */}
            <div className="relative z-10 px-6 pt-12 pb-4">
                <div className="flex gap-2">
                    {steps.map((_, i) => (
                        <motion.div
                            key={i}
                            className="flex-1 h-1.5 rounded-full overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.1)' }}
                        >
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                                initial={{ width: 0 }}
                                animate={{ width: i <= step ? '100%' : '0%' }}
                                transition={{ duration: 0.5 }}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative z-10 px-6 flex flex-col">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col"
                >
                    {step === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center -mt-16">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 10 }}
                                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(16,185,129,0.4)]"
                            >
                                <Sparkles className="w-12 h-12 text-white" />
                            </motion.div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-4">
                                Welcome to TitanLift
                            </h1>
                            <p className="text-lg text-white/50 max-w-xs">
                                Your premium fitness companion. Let's set up your profile.
                            </p>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="flex-1 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Your Profile</h2>
                            <p className="text-white/50 mb-8">Tell us about yourself</p>

                            {/* Liquid Glass Input */}
                            <div className="space-y-6">
                                <div className="relative group">
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all group-focus-within:border-emerald-500/50 group-focus-within:bg-white/[0.05]">
                                        <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Username</label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="Your display name"
                                            className="w-full bg-transparent text-white text-lg placeholder:text-white/20 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">Gender</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {genderOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setFormData({ ...formData, gender: option.value })}
                                                className={`relative p-4 rounded-2xl border transition-all ${formData.gender === option.value
                                                        ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                                                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]'
                                                    }`}
                                            >
                                                <span className="text-2xl mb-1 block">{option.emoji}</span>
                                                <span className="text-white font-medium">{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex-1 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Body Metrics</h2>
                            <p className="text-white/50 mb-8">For accurate progress tracking</p>

                            <div className="space-y-5">
                                <div className="relative group">
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all group-focus-within:border-emerald-500/50">
                                        <div className="flex items-center gap-3">
                                            <Ruler className="w-5 h-5 text-emerald-400" />
                                            <div className="flex-1">
                                                <label className="text-xs text-white/40 uppercase tracking-wider mb-1 block">Height</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={formData.height_cm}
                                                        onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                                                        placeholder="175"
                                                        className="w-full bg-transparent text-white text-lg placeholder:text-white/20 focus:outline-none"
                                                    />
                                                    <span className="text-white/40">cm</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all group-focus-within:border-emerald-500/50">
                                        <div className="flex items-center gap-3">
                                            <Weight className="w-5 h-5 text-cyan-400" />
                                            <div className="flex-1">
                                                <label className="text-xs text-white/40 uppercase tracking-wider mb-1 block">Weight</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={formData.weight_kg}
                                                        onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                                                        placeholder="70"
                                                        className="w-full bg-transparent text-white text-lg placeholder:text-white/20 focus:outline-none"
                                                    />
                                                    <span className="text-white/40">kg</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all group-focus-within:border-emerald-500/50">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-purple-400" />
                                            <div className="flex-1">
                                                <label className="text-xs text-white/40 uppercase tracking-wider mb-1 block">Date of Birth</label>
                                                <input
                                                    type="date"
                                                    value={formData.date_of_birth}
                                                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                                    className="w-full bg-transparent text-white text-lg focus:outline-none [color-scheme:dark]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex-1 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Activity Level</h2>
                            <p className="text-white/50 mb-8">How often do you exercise?</p>

                            <div className="space-y-3">
                                {activityLevels.map((level) => (
                                    <button
                                        key={level.value}
                                        onClick={() => setFormData({ ...formData, activity_level: level.value })}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all ${formData.activity_level === level.value
                                                ? 'bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-transparent border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                                                : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-white font-medium">{level.label}</div>
                                                <div className="text-sm text-white/40">{level.desc}</div>
                                            </div>
                                            {formData.activity_level === level.value && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center justify-center"
                                                >
                                                    <ChevronRight className="w-4 h-4 text-black" />
                                                </motion.div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Continue Button - Liquid Glass Style */}
                <div className="py-8">
                    <motion.button
                        onClick={handleNext}
                        disabled={!isStepValid()}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all relative overflow-hidden ${isStepValid()
                                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.4)]'
                                : 'bg-white/5 text-white/30 cursor-not-allowed'
                            }`}
                    >
                        {step === steps.length - 1 ? 'Get Started' : 'Continue'}
                        {isStepValid() && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            />
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
