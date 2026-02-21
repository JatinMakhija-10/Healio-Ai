"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowLeft,
    Calendar,
    Clock,
    FileText,
    CheckCircle2,
    Stethoscope,
    User,
    Activity,
    Pill,
    AlertCircle,
    CalendarPlus,
    Download,
    ClipboardList,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Loader2,
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

// SOAP Notes template
interface SOAPNotes {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
}

export default function ConsultationPage() {
    const params = useParams();
    const router = useRouter();
    const appointmentId = params.id as string;

    const [phase, setPhase] = useState<ConsultationPhase>('pre_check');
    const [soapNotes, setSoapNotes] = useState<SOAPNotes>({
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
    });
    const [quickNotes, setQuickNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showFollowUp, setShowFollowUp] = useState(false);
    const [soapExpanded, setSoapExpanded] = useState<Record<string, boolean>>({
        subjective: true,
        objective: false,
        assessment: false,
        plan: false,
    });
    const callDuration = useVideoStore(selectFormattedDuration);

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
                    setQuickNotes(data.notes || '');
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

    // Loading Skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100">
                <header className="bg-white border-b sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <div className="space-y-1">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                </header>
                <main className="max-w-7xl mx-auto p-6">
                    <div className="grid lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8">
                            <Skeleton className="aspect-video rounded-2xl" />
                        </div>
                        <div className="lg:col-span-4 space-y-4">
                            <Skeleton className="h-48 rounded-xl" />
                            <Skeleton className="h-32 rounded-xl" />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-slate-400" />
                <p className="text-slate-600 font-medium">Appointment not found</p>
                <Button onClick={() => router.push('/doctor/schedule')}>Back to Schedule</Button>
            </div>
        );
    }

    const patient = appointment.patient || {};

    const handleSaveNotes = async () => {
        setIsSaving(true);
        try {
            const combinedNotes = [
                soapNotes.subjective && `SUBJECTIVE:\n${soapNotes.subjective}`,
                soapNotes.objective && `OBJECTIVE:\n${soapNotes.objective}`,
                soapNotes.assessment && `ASSESSMENT:\n${soapNotes.assessment}`,
                soapNotes.plan && `PLAN:\n${soapNotes.plan}`,
                quickNotes && `QUICK NOTES:\n${quickNotes}`,
            ].filter(Boolean).join('\n\n');

            await saveClinicalNotes(appointmentId, {
                subjective: combinedNotes || quickNotes,
            });
            toast.success("Consultation notes saved successfully");
            router.push('/doctor/schedule');
        } catch (error) {
            console.error("Save notes error", error);
            toast.error("Failed to save notes");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSoapSection = (section: string) => {
        setSoapExpanded(prev => ({ ...prev, [section]: !prev[section] }));
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
                            <h1 className="font-semibold text-slate-900 flex items-center gap-2">
                                Video Consultation
                                <Badge variant="outline" className={cn(
                                    "text-[10px] font-medium",
                                    phase === 'pre_check' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                        phase === 'in_call' ? "bg-green-50 text-green-700 border-green-200" :
                                            "bg-blue-50 text-blue-700 border-blue-200"
                                )}>
                                    {phase === 'pre_check' ? 'Pre-Check' : phase === 'in_call' ? 'In Progress' : 'Completed'}
                                </Badge>
                            </h1>
                            <p className="text-sm text-slate-500">
                                {patient.full_name || 'Patient'} · #{appointmentId.slice(0, 8)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
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
                            <div className="lg:col-span-4 space-y-4">
                                {/* Patient Card */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12 ring-2 ring-teal-100">
                                                <AvatarImage src={patient.avatar_url} />
                                                <AvatarFallback className="bg-teal-100 text-teal-700">
                                                    {patient.full_name?.charAt(0) || 'P'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-lg">{patient.full_name || 'Unknown Patient'}</CardTitle>
                                                <p className="text-sm text-slate-500">
                                                    {patient.age ? `${patient.age} yrs` : ''}
                                                    {patient.gender ? ` · ${patient.gender}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {/* Chief Complaint */}
                                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                            <p className="text-xs font-medium text-amber-700 uppercase mb-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" /> Chief Complaint
                                            </p>
                                            <p className="text-sm text-slate-700">{appointment.notes || 'No notes provided'}</p>
                                        </div>

                                        {/* Vitals Placeholder */}
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-xs font-medium text-slate-500 uppercase mb-2 flex items-center gap-1">
                                                <Activity className="h-3 w-3" /> Last Vitals
                                            </p>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="text-slate-600"><span className="text-slate-400">BP:</span> --/-- mmHg</div>
                                                <div className="text-slate-600"><span className="text-slate-400">HR:</span> -- bpm</div>
                                                <div className="text-slate-600"><span className="text-slate-400">Temp:</span> --°F</div>
                                                <div className="text-slate-600"><span className="text-slate-400">SpO₂:</span> --%</div>
                                            </div>
                                        </div>

                                        {/* Allergies & Medications */}
                                        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                            <p className="text-xs font-medium text-red-600 uppercase mb-1 flex items-center gap-1">
                                                <Pill className="h-3 w-3" /> Allergies
                                            </p>
                                            <p className="text-xs text-slate-600">No known allergies</p>
                                        </div>
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
                                            rows={5}
                                            value={quickNotes}
                                            onChange={(e) => setQuickNotes(e.target.value)}
                                            className="resize-none"
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
                            className="max-w-3xl mx-auto space-y-6"
                        >
                            {/* Completion Banner */}
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="text-center pb-2">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', delay: 0.2 }}
                                        className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                                    >
                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    </motion.div>
                                    <CardTitle className="text-2xl">Consultation Complete</CardTitle>
                                    <p className="text-slate-500">
                                        Your call with {patient.full_name} has ended
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {/* Session Summary */}
                                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 space-y-3">
                                        <h3 className="font-medium text-slate-900 flex items-center gap-2">
                                            <ClipboardList className="h-4 w-4 text-teal-600" /> Session Summary
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-slate-500 text-xs">Duration</span>
                                                <p className="font-semibold text-slate-900">{callDuration}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-xs">Patient</span>
                                                <p className="font-semibold text-slate-900">{patient.full_name}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-xs">Type</span>
                                                <p className="font-semibold text-slate-900">Video</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* SOAP Notes Form */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Stethoscope className="h-5 w-5 text-teal-600" />
                                        Clinical Notes (SOAP)
                                    </CardTitle>
                                    <p className="text-xs text-slate-500">Click each section to expand and fill in your notes</p>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {[
                                        { key: 'subjective', label: 'Subjective', placeholder: "Patient's symptoms, history, chief complaint...", icon: '📝' },
                                        { key: 'objective', label: 'Objective', placeholder: 'Physical exam findings, test results, vitals...', icon: '🔬' },
                                        { key: 'assessment', label: 'Assessment', placeholder: 'Diagnosis, differential diagnosis...', icon: '🩺' },
                                        { key: 'plan', label: 'Plan', placeholder: 'Treatment plan, prescriptions, follow-up...', icon: '📋' },
                                    ].map(section => (
                                        <div key={section.key} className="border rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => toggleSoapSection(section.key)}
                                                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                                            >
                                                <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                    <span>{section.icon}</span>
                                                    {section.label}
                                                </span>
                                                {soapExpanded[section.key]
                                                    ? <ChevronUp className="h-4 w-4 text-slate-400" />
                                                    : <ChevronDown className="h-4 w-4 text-slate-400" />
                                                }
                                            </button>
                                            <AnimatePresence>
                                                {soapExpanded[section.key] && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <div className="p-3">
                                                            <Textarea
                                                                placeholder={section.placeholder}
                                                                rows={3}
                                                                value={soapNotes[section.key as keyof SOAPNotes]}
                                                                onChange={(e) => setSoapNotes(prev => ({ ...prev, [section.key]: e.target.value }))}
                                                                className="resize-none"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}

                                    {/* Quick notes from during the call */}
                                    {quickNotes && (
                                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                            <p className="text-xs font-medium text-yellow-700 mb-1">📌 Quick Notes (from call)</p>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{quickNotes}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowFollowUp(!showFollowUp)}
                                        className="gap-1.5"
                                    >
                                        <CalendarPlus className="h-4 w-4" />
                                        Schedule Follow-up
                                    </Button>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push('/doctor/schedule')}
                                    >
                                        Skip for Now
                                    </Button>
                                    <Button
                                        onClick={handleSaveNotes}
                                        disabled={isSaving}
                                        className="bg-teal-600 hover:bg-teal-700 gap-2 min-w-[140px]"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Save & Complete
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Follow-up Scheduler (expandable) */}
                            <AnimatePresence>
                                {showFollowUp && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                    >
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <CalendarPlus className="h-4 w-4 text-teal-600" />
                                                    Schedule Follow-up Appointment
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="grid sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-xs">Recommended Date</Label>
                                                        <Input type="date" className="h-9 mt-1" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Time</Label>
                                                        <Input type="time" className="h-9 mt-1" />
                                                    </div>
                                                </div>
                                                <Textarea placeholder="Notes for follow-up..." rows={2} className="resize-none" />
                                                <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                                                    Create Follow-up
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
