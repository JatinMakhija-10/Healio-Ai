"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VideoRoom } from '@/components/features/video/VideoRoom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    ArrowLeft,
    CheckCircle2,
    Star,
    Loader2,
    AlertCircle,
    Clock,
    Download,
    RefreshCw,
    Stethoscope,
    MessageSquare,
} from 'lucide-react';
import { PreCallCheck } from '@/components/features/video/PreCallCheck';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useVideoStore, selectFormattedDuration } from '@/stores/videoStore';
import { cn } from '@/lib/utils';

type ConsultationPhase = 'pre_check' | 'in_call' | 'post_call';

export default function PatientMeetPage() {
    const params = useParams();
    const router = useRouter();
    const appointmentId = params.id as string;

    const [phase, setPhase] = useState<ConsultationPhase>('pre_check');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const callDuration = useVideoStore(selectFormattedDuration);

    // Post-call feedback
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (!appointmentId) return;
            try {
                const data = await api.getAppointmentById(appointmentId);
                if (data) {
                    setAppointment(data);
                }
            } catch (error) {
                console.error("Failed to fetch appointment", error);
                toast.error("Failed to load consultation details");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [appointmentId]);

    const handlePreCheckComplete = () => {
        setPhase('in_call');
    };

    const handleCallEnd = () => {
        setPhase('post_call');
    };

    const handleSubmitFeedback = async () => {
        setIsSubmitting(true);
        try {
            // In a real app, this would POST to an API
            await new Promise(resolve => setTimeout(resolve, 800));
            toast.success('Thank you for your feedback!');
            setFeedbackSubmitted(true);
        } catch {
            toast.error('Failed to submit feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col">
                <header className="px-6 py-4 flex items-center gap-4 bg-slate-900 border-b border-slate-800">
                    <Skeleton className="h-10 w-10 rounded-md bg-slate-800" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-5 w-40 bg-slate-800" />
                        <Skeleton className="h-3 w-28 bg-slate-800" />
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center p-6">
                    <Skeleton className="w-full max-w-lg aspect-video rounded-2xl bg-slate-800" />
                </main>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
                <AlertCircle className="h-12 w-12 text-slate-600" />
                <p className="text-lg font-medium">Consultation not found</p>
                <Button variant="outline" onClick={() => router.push('/dashboard')} className="border-slate-700 text-slate-300">
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    const doctor = appointment.doctor || {};
    const doctorName = doctor.full_name || 'Doctor';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            {/* Minimal Header */}
            <header className="px-6 py-4 flex items-center justify-between bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-white">
                        <Link href="/dashboard">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-semibold flex items-center gap-2">
                            Consultation Room
                            <Badge variant="outline" className={cn(
                                "text-[10px]",
                                phase === 'pre_check' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                                    phase === 'in_call' ? "bg-green-500/10 text-green-400 border-green-500/30" :
                                        "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            )}>
                                {phase === 'pre_check' ? 'Setting Up' : phase === 'in_call' ? 'Live' : 'Ended'}
                            </Badge>
                        </h1>
                        <p className="text-xs text-slate-400">ID: {appointmentId.slice(0, 8)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-slate-200">{doctorName}</p>
                        <p className="text-xs text-slate-500">{doctor.specialization?.[0] || 'Specialist'}</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {/* Phase 1: Pre-Call Check */}
                    {phase === 'pre_check' && (
                        <motion.div
                            key="pre_check"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg"
                        >
                            <div className="bg-white rounded-xl shadow-xl overflow-hidden p-1">
                                <PreCallCheck
                                    remoteParticipantName={doctorName}
                                    userName={appointment?.patient?.full_name || 'Patient'}
                                    onComplete={handlePreCheckComplete}
                                    onCancel={() => router.push('/dashboard')}
                                />
                            </div>
                            <p className="text-center text-sm text-slate-500 mt-4">
                                Checking your devices ensures a smooth consultation with {doctorName}.
                            </p>
                        </motion.div>
                    )}

                    {/* Phase 2: In-Call */}
                    {phase === 'in_call' && (
                        <motion.div
                            key="in_call"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full max-w-6xl"
                        >
                            <VideoRoom
                                appointmentId={appointmentId}
                                patientName={doctorName}
                                patientAvatar={doctor.avatar_url}
                                onCallEnd={handleCallEnd}
                                role="answerer"
                            />
                        </motion.div>
                    )}

                    {/* Phase 3: Post-Call */}
                    {phase === 'post_call' && (
                        <motion.div
                            key="post_call"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-lg space-y-6"
                        >
                            {/* Completion Card */}
                            <Card className="border-slate-800 bg-slate-900/50 overflow-hidden">
                                <CardHeader className="text-center pb-2">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', delay: 0.2 }}
                                        className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400"
                                    >
                                        <CheckCircle2 className="h-10 w-10" />
                                    </motion.div>
                                    <CardTitle className="text-2xl font-bold">Consultation Ended</CardTitle>
                                    <p className="text-slate-400">Thank you for consulting with {doctorName}</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Session Details */}
                                    <div className="bg-slate-800/50 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
                                        <div>
                                            <Clock className="h-4 w-4 text-teal-400 mx-auto mb-1" />
                                            <p className="text-xs text-slate-500">Duration</p>
                                            <p className="font-semibold text-sm">{callDuration}</p>
                                        </div>
                                        <div>
                                            <Stethoscope className="h-4 w-4 text-teal-400 mx-auto mb-1" />
                                            <p className="text-xs text-slate-500">Doctor</p>
                                            <p className="font-semibold text-sm truncate">{doctorName}</p>
                                        </div>
                                        <div>
                                            <MessageSquare className="h-4 w-4 text-teal-400 mx-auto mb-1" />
                                            <p className="text-xs text-slate-500">Type</p>
                                            <p className="font-semibold text-sm">Video</p>
                                        </div>
                                    </div>

                                    {/* Doctor Info */}
                                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={doctor.avatar_url} />
                                            <AvatarFallback className="bg-teal-900 text-teal-400">
                                                {doctorName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm">{doctorName}</p>
                                            <p className="text-xs text-slate-500">{doctor.specialization?.[0] || 'Specialist'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Feedback Card */}
                            <Card className="border-slate-800 bg-slate-900/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Star className="h-4 w-4 text-yellow-400" />
                                        How was your consultation?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {feedbackSubmitted ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-4"
                                        >
                                            <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                                            <p className="text-sm text-slate-300">Thank you for your feedback!</p>
                                        </motion.div>
                                    ) : (
                                        <>
                                            {/* Star Rating */}
                                            <div className="flex justify-center gap-2">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        onClick={() => setRating(star)}
                                                        onMouseEnter={() => setHoverRating(star)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        className="transition-transform hover:scale-110"
                                                    >
                                                        <Star
                                                            className={cn(
                                                                "h-8 w-8 transition-colors",
                                                                (hoverRating || rating) >= star
                                                                    ? "fill-yellow-400 text-yellow-400"
                                                                    : "text-slate-700"
                                                            )}
                                                        />
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Rating Label */}
                                            {(hoverRating || rating) > 0 && (
                                                <p className="text-center text-xs text-slate-500">
                                                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating || rating]}
                                                </p>
                                            )}

                                            {/* Feedback Text */}
                                            <Textarea
                                                placeholder="Share your experience (optional)..."
                                                rows={3}
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600 resize-none"
                                            />

                                            <Button
                                                onClick={handleSubmitFeedback}
                                                disabled={rating === 0 || isSubmitting}
                                                className="w-full bg-teal-600 hover:bg-teal-700"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    'Submit Feedback'
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-center">
                                <Button asChild className="bg-teal-600 hover:bg-teal-700 gap-2">
                                    <Link href="/dashboard">
                                        Return to Dashboard
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-2">
                                    <Link href="/dashboard/history">
                                        <Download className="h-4 w-4" />
                                        View Summary
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
