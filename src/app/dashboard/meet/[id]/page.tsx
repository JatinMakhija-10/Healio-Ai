"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VideoRoom } from '@/components/features/video/VideoRoom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PreCallCheck } from '@/components/features/video/PreCallCheck';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type ConsultationPhase = 'pre_check' | 'in_call' | 'post_call';

export default function PatientMeetPage() {
    const params = useParams();
    const router = useRouter();
    const appointmentId = params.id as string;

    const [phase, setPhase] = useState<ConsultationPhase>('pre_check');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading consultation...</div>;
    }

    if (!appointment) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
                <p>Consultation not found.</p>
                <Button variant="outline" onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
            </div>
        );
    }

    const doctor = appointment.doctor || {};
    const doctorName = doctor.full_name || 'Doctor';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            {/* Minimal Header for Focus */}
            <header className="px-6 py-4 flex items-center justify-between bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-white">
                        <Link href="/dashboard">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-semibold">Consultation Room</h1>
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
                                Checking your camera and microphone ensures a smooth consultation with {doctorName}.
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
                                patientName={doctorName} // Displaying the Doctor's name as the "remote" participant
                                patientAvatar={doctor.avatar_url} // Displaying the Doctor's avatar
                                onCallEnd={handleCallEnd}
                            />
                        </motion.div>
                    )}

                    {/* Phase 3: Post-Call */}
                    {phase === 'post_call' && (
                        <motion.div
                            key="post_call"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-6 max-w-md"
                        >
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400">
                                <Loader2 className="h-10 w-10 animate-spin" />
                                {/* Just using Loader as a placeholder icon, really should be Check */}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Consultation Ended</h2>
                                <p className="text-slate-400">Thank you for consulting with {doctorName}</p>
                            </div>
                            <div className="flex gap-3 justify-center">
                                <Button asChild className="bg-teal-600 hover:bg-teal-700">
                                    <Link href="/dashboard">Return to Dashboard</Link>
                                </Button>
                                <Button variant="outline" asChild className="border-slate-700 text-slate-300 hover:bg-slate-800">
                                    <Link href="/dashboard/history">View Summary</Link>
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

