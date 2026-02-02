"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostConsultationForm, { ClinicalNoteFormData } from "@/components/doctor/PostConsultationForm";
import { appointmentService } from "@/lib/appointments/appointmentService";
import { clinicalNotesService } from "@/lib/clinical-notes/clinicalNotesService";
import { invoiceService } from "@/lib/invoices/invoiceService";
import { supabase } from "@/lib/supabase";

export default function CompleteConsultationPage() {
    const params = useParams();
    const router = useRouter();
    const appointmentId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [appointment, setAppointment] = useState<any>(null);
    const [doctorId, setDoctorId] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadAppointmentData();
    }, [appointmentId]);

    async function loadAppointmentData() {
        try {
            setLoading(true);


            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                console.error('Error getting user:', userError);
                router.push('/doctor');
                return;
            }

            // Get doctor ID
            const { data: doctorData, error: doctorError } = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (doctorError || !doctorData) {
                console.error('Error getting doctor:', doctorError);
                router.push('/doctor');
                return;
            }

            setDoctorId(doctorData.id);

            // Get appointment details
            const appointmentData = await appointmentService.getAppointmentById(appointmentId);

            if (!appointmentData || appointmentData.doctor_id !== doctorData.id) {
                console.error('Appointment not found or unauthorized');
                router.push('/doctor');
                return;
            }

            // Get patient details
            const { data: patientData, error: patientError } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', appointmentData.patient_id)
                .single();

            setAppointment({
                ...appointmentData,
                patient_name: patientData?.full_name || 'Unknown Patient',
                patient_email: patientData?.email
            });

        } catch (error) {
            console.error('Error loading appointment:', error);
            router.push('/doctor');
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveNotes(data: ClinicalNoteFormData) {
        if (!doctorId || !appointment) return;

        try {
            setSaving(true);

            // Create clinical notes
            await clinicalNotesService.createClinicalNote({
                appointment_id: appointmentId,
                doctor_id: doctorId,
                patient_id: appointment.patient_id,
                subjective: data.subjective,
                objective: data.objective,
                assessment: data.assessment,
                plan: data.plan,
                prescriptions: data.prescriptions,
                lab_tests: data.labTests,
                follow_up_date: data.followUpDate,
                follow_up_notes: data.followUpNotes
            });

            // Mark appointment as completed
            await appointmentService.completeAppointment(appointmentId);

            alert('Clinical notes saved successfully to patient profile!');
            setSuccess(true);

        } catch (error) {
            console.error('Error saving clinical notes:', error);
            alert('Failed to save clinical notes. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveAndInvoice(data: ClinicalNoteFormData) {
        if (!doctorId || !appointment) return;

        try {
            setSaving(true);

            // Create clinical notes
            const clinicalNote = await clinicalNotesService.createClinicalNote({
                appointment_id: appointmentId,
                doctor_id: doctorId,
                patient_id: appointment.patient_id,
                subjective: data.subjective,
                objective: data.objective,
                assessment: data.assessment,
                plan: data.plan,
                prescriptions: data.prescriptions,
                lab_tests: data.labTests,
                follow_up_date: data.followUpDate,
                follow_up_notes: data.followUpNotes
            });

            // Mark appointment as completed
            await appointmentService.completeAppointment(appointmentId);

            // Create invoice
            await invoiceService.createInvoice({
                appointment_id: appointmentId,
                doctor_id: doctorId,
                patient_id: appointment.patient_id,
                clinical_notes_id: clinicalNote.id,
                consultation_fee: appointment.consultation_fee
            });

            alert('Clinical notes saved and invoice sent to admin for approval!');
            setSuccess(true);

            // Redirect to revenue page after 2 seconds
            setTimeout(() => {
                router.push('/doctor/analytics');
            }, 2000);

        } catch (error) {
            console.error('Error saving notes and creating invoice:', error);
            alert('Failed to process. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
                    <p className="text-slate-600">Loading consultation details...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-2xl mx-auto mt-20 text-center">
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200">
                    <div className="mb-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Success!</h1>
                        <p className="text-lg text-slate-600">
                            Clinical notes saved to patient profile and invoice submitted for approval.
                        </p>
                    </div>
                    <div className="space-y-3 mt-8">
                        <Button
                            onClick={() => router.push('/doctor/analytics')}
                            className="w-full bg-teal-600 hover:bg-teal-700"
                        >
                            View Revenue Dashboard
                        </Button>
                        <Button
                            onClick={() => router.push('/doctor')}
                            variant="outline"
                            className="w-full"
                        >
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-6 gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </Button>

            <PostConsultationForm
                appointmentId={appointmentId}
                patientName={appointment?.patient_name || 'Patient'}
                onSave={handleSaveNotes}
                onSaveAndInvoice={handleSaveAndInvoice}
                loading={saving}
            />
        </div>
    );
}
