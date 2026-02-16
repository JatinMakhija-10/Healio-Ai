"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    ArrowLeft,
    Calendar,
    Clock,
    FileText,
    AlertTriangle,
    CheckCircle2,
    Stethoscope
} from 'lucide-react';
import Link from 'next/link';
import { VideoRoom } from '@/components/features/video/VideoRoom';
import { PreCallCheck } from '@/components/features/video/PreCallCheck';
import { motion, AnimatePresence } from 'framer-motion';
import { saveClinicalNotes } from '@/lib/appointments/contextClient';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useVideoStore, selectFormattedDuration } from '@/stores/videoStore';



type ConsultationPhase = 'pre_check' | 'in_call' | 'post_call';

export default function ConsultationPage() {
    const params = useParams();
    const router = useRouter();
    const appointmentId = params.id as string;

    const [phase, setPhase] = useState<ConsultationPhase>('pre_check');
    const [consultationNotes, setConsultationNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const callDuration = useVideoStore(selectFormattedDuration);

    // Real Data State
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
                    setConsultationNotes(data.notes || '');
                }
            } catch (error) {
                console.error("Failed to fetch appointment", error);
                toast.error("Failed to load appointment details");
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
        return <div className="min-h-screen flex items-center justify-center bg-slate-100">Loading...</div>;
    }

    if (!appointment) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-100">Appointment not found</div>;
    }

    const patient = appointment.patient || {};

    const handleSaveNotes = async () => {
        setIsSaving(true);
        try {
            // Using existing logic, though ideally we update the appointment record directly or fetch clinical notes table
            await saveClinicalNotes(appointmentId, {
                subjective: consultationNotes
            });
            toast.success("Consultation notes saved");
            router.push('/doctor/schedule');
        } catch (error) {
            console.error("Save notes error", error);
            toast.error("Failed to save notes");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/doctor/schedule">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="font-semibold text-slate-900">Video Consultation</h1>
                            <p className="text-sm text-slate-500">Appointment #{appointmentId.slice(0, 8)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date().toLocaleDateString()}
                        </Badge>
                        <Badge variant="outline" className="gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">
                <AnimatePresence mode="wait">
                    {/* Pre-Call Check Phase */}
                    {phase === 'pre_check' && (
                        <motion.div
                            key="pre_check"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <PreCallCheck
                                remoteParticipantName={patient.full_name || 'Patient'}
                                userName={appointment.doctor?.specialization ? `Dr. ${appointment.doctor.full_name || 'Doctor'}` : 'Doctor'}
                                onComplete={handlePreCheckComplete}
                                onCancel={() => router.push('/doctor/schedule')}
                            />

                        </motion.div>
                    )}

                    {/* In-Call Phase */}
                    {phase === 'in_call' && (
                        <motion.div
                            key="in_call"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid lg:grid-cols-12 gap-6"
                        >
                            {/* Video Area */}
                            <div className="lg:col-span-8">
                                <VideoRoom
                                    appointmentId={appointmentId}
                                    patientName={patient.full_name}
                                    patientAvatar={patient.avatar_url}
                                    onCallEnd={handleCallEnd}
                                    role="caller"
                                />
                            </div>

                            {/* Patient Info Sidebar */}
                            {/* Patient Info Sidebar */}
                            <div className="lg:col-span-4 space-y-4">
                                {/* Patient Card */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={patient.avatar_url} />
                                                <AvatarFallback className="bg-teal-100 text-teal-700">
                                                    {patient.full_name?.charAt(0) || 'P'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-lg">{patient.full_name || 'Unknown Patient'}</CardTitle>
                                                <p className="text-sm text-slate-500">
                                                    {patient.age ? `${patient.age} yrs` : ''}
                                                    {patient.gender ? ` • ${patient.gender}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                                                Chief Complaint
                                            </p>
                                            <p className="text-sm text-slate-700">{appointment.notes || 'No notes provided'}</p>
                                        </div>

                                        {/* AI Analysis - Only show if data is available (mocking this part for now or hiding) */}
                                        {/* In a real app, we would fetch this from the linked consultation/diagnosis */}
                                        {/* 
                                        <div className="p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Stethoscope className="h-4 w-4 text-teal-600" />
                                                <span className="text-xs font-medium text-slate-500">AI Analysis</span>
                                            </div>
                                            <p className="font-medium text-slate-900">{mockPatient.aiDiagnosis}</p>
                                        </div>
                                        */}
                                    </CardContent>
                                </Card>

                                {/* Quick Notes */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Quick Notes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Textarea
                                            placeholder="Jot down notes during the consultation..."
                                            rows={6}
                                            value={consultationNotes}
                                            onChange={(e) => setConsultationNotes(e.target.value)}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {/* Post-Call Phase */}
                    {phase === 'post_call' && (
                        <motion.div
                            key="post_call"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-2xl mx-auto"
                        >
                            <Card>
                                <CardHeader className="text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    </div>
                                    <CardTitle className="text-2xl">Consultation Complete</CardTitle>
                                    <p className="text-slate-500">
                                        Your call with {patient.full_name} has ended
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Summary Section */}
                                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                        <h3 className="font-medium text-slate-900">Session Summary</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-slate-500">Duration</span>
                                                <p className="font-medium">{callDuration}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Patient</span>
                                                <p className="font-medium">{patient.full_name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Consultation Notes */}
                                    <div className="space-y-2">
                                        <h3 className="font-medium text-slate-900">Consultation Notes</h3>
                                        <Textarea
                                            placeholder="Add your clinical notes, diagnosis, and treatment plan..."
                                            rows={8}
                                            value={consultationNotes}
                                            onChange={(e) => setConsultationNotes(e.target.value)}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push('/doctor/schedule')}
                                        >
                                            Skip for Now
                                        </Button>
                                        <Button
                                            onClick={handleSaveNotes}
                                            disabled={isSaving}
                                            className="bg-teal-600 hover:bg-teal-700"
                                        >
                                            {isSaving ? 'Saving...' : 'Save & Complete'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
