"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, FileText, Send, Save } from "lucide-react";
import { Prescription, LabTest } from "@/lib/clinical-notes/clinicalNotesService";

interface PostConsultationFormProps {
    appointmentId: string;
    patientName: string;
    onSave: (data: ClinicalNoteFormData) => Promise<void>;
    onSaveAndInvoice: (data: ClinicalNoteFormData) => Promise<void>;
    loading?: boolean;
}

export interface ClinicalNoteFormData {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    prescriptions: Prescription[];
    labTests: LabTest[];
    followUpDate?: string;
    followUpNotes?: string;
}

export default function PostConsultationForm({
    appointmentId,
    patientName,
    onSave,
    onSaveAndInvoice,
    loading = false
}: PostConsultationFormProps) {
    const [formData, setFormData] = useState<ClinicalNoteFormData>({
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
        prescriptions: [],
        labTests: [],
        followUpDate: "",
        followUpNotes: ""
    });

    const [currentPrescription, setCurrentPrescription] = useState<Partial<Prescription>>({
        medicine: "",
        dosage: "",
        duration: "",
        frequency: "",
        instructions: ""
    });

    const [currentLabTest, setCurrentLabTest] = useState<Partial<LabTest>>({
        test_name: "",
        reason: "",
        urgent: false
    });

    const handleInputChange = (field: keyof ClinicalNoteFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addPrescription = () => {
        if (!currentPrescription.medicine || !currentPrescription.dosage) {
            alert("Please enter medicine name and dosage");
            return;
        }

        setFormData(prev => ({
            ...prev,
            prescriptions: [...prev.prescriptions, currentPrescription as Prescription]
        }));

        setCurrentPrescription({
            medicine: "",
            dosage: "",
            duration: "",
            frequency: "",
            instructions: ""
        });
    };

    const removePrescription = (index: number) => {
        setFormData(prev => ({
            ...prev,
            prescriptions: prev.prescriptions.filter((_, i) => i !== index)
        }));
    };

    const addLabTest = () => {
        if (!currentLabTest.test_name) {
            alert("Please enter test name");
            return;
        }

        setFormData(prev => ({
            ...prev,
            labTests: [...prev.labTests, currentLabTest as LabTest]
        }));

        setCurrentLabTest({
            test_name: "",
            reason: "",
            urgent: false
        });
    };

    const removeLabTest = (index: number) => {
        setFormData(prev => ({
            ...prev,
            labTests: prev.labTests.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        if (!formData.assessment || !formData.plan) {
            alert("Please fill in Assessment and Plan sections");
            return;
        }
        await onSave(formData);
    };

    const handleSaveAndInvoice = async () => {
        if (!formData.assessment || !formData.plan) {
            alert("Please fill in Assessment and Plan sections");
            return;
        }
        await onSaveAndInvoice(formData);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Post-Consultation Notes</h2>
                        <p className="text-slate-500">Patient: {patientName}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        SOAP Format
                    </Badge>
                </div>
            </div>

            {/* SOAP Notes */}
            <Card>
                <CardHeader>
                    <CardTitle>Clinical Notes (SOAP Format)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Subjective */}
                    <div>
                        <Label htmlFor="subjective" className="text-base font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-sm">S</span>
                            Subjective (Patient's Complaint)
                        </Label>
                        <Textarea
                            id="subjective"
                            placeholder="Enter patient's chief complaint, symptoms, and history..."
                            value={formData.subjective}
                            onChange={(e) => handleInputChange('subjective', e.target.value)}
                            rows={4}
                            className="mt-2"
                        />
                    </div>

                    {/* Objective */}
                    <div>
                        <Label htmlFor="objective" className="text-base font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">O</span>
                            Objective (Your Observations)
                        </Label>
                        <Textarea
                            id="objective"
                            placeholder="Enter your clinical findings, vital signs, examination results..."
                            value={formData.objective}
                            onChange={(e) => handleInputChange('objective', e.target.value)}
                            rows={4}
                            className="mt-2"
                        />
                    </div>

                    {/* Assessment */}
                    <div>
                        <Label htmlFor="assessment" className="text-base font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">A</span>
                            Assessment (Diagnosis) *
                        </Label>
                        <Textarea
                            id="assessment"
                            placeholder="Enter your diagnosis and assessment..."
                            value={formData.assessment}
                            onChange={(e) => handleInputChange('assessment', e.target.value)}
                            rows={3}
                            className="mt-2"
                            required
                        />
                    </div>

                    {/* Plan */}
                    <div>
                        <Label htmlFor="plan" className="text-base font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">P</span>
                            Plan (Treatment Plan) *
                        </Label>
                        <Textarea
                            id="plan"
                            placeholder="Enter treatment plan, recommendations, and instructions..."
                            value={formData.plan}
                            onChange={(e) => handleInputChange('plan', e.target.value)}
                            rows={3}
                            className="mt-2"
                            required
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Prescriptions */}
            <Card>
                <CardHeader>
                    <CardTitle>Prescriptions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Existing Prescriptions */}
                    {formData.prescriptions.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {formData.prescriptions.map((prescription, index) => (
                                <div key={index} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">{prescription.medicine}</p>
                                        <p className="text-sm text-slate-600">
                                            {prescription.dosage} • {prescription.frequency} • {prescription.duration}
                                        </p>
                                        {prescription.instructions && (
                                            <p className="text-sm text-slate-500 mt-1">{prescription.instructions}</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removePrescription(index)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New Prescription */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="medicine">Medicine Name</Label>
                            <Input
                                id="medicine"
                                placeholder="e.g., Paracetamol"
                                value={currentPrescription.medicine}
                                onChange={(e) => setCurrentPrescription(prev => ({ ...prev, medicine: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="dosage">Dosage</Label>
                            <Input
                                id="dosage"
                                placeholder="e.g., 500mg"
                                value={currentPrescription.dosage}
                                onChange={(e) => setCurrentPrescription(prev => ({ ...prev, dosage: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="frequency">Frequency</Label>
                            <Input
                                id="frequency"
                                placeholder="e.g., Twice daily"
                                value={currentPrescription.frequency}
                                onChange={(e) => setCurrentPrescription(prev => ({ ...prev, frequency: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="duration">Duration</Label>
                            <Input
                                id="duration"
                                placeholder="e.g., 7 days"
                                value={currentPrescription.duration}
                                onChange={(e) => setCurrentPrescription(prev => ({ ...prev, duration: e.target.value }))}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Label htmlFor="rx-instructions">Instructions</Label>
                            <Input
                                id="rx-instructions"
                                placeholder="e.g., Take after meals"
                                value={currentPrescription.instructions}
                                onChange={(e) => setCurrentPrescription(prev => ({ ...prev, instructions: e.target.value }))}
                            />
                        </div>
                    </div>

                    <Button type="button" onClick={addPrescription} variant="outline" className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Add Prescription
                    </Button>
                </CardContent>
            </Card>

            {/* Lab Tests */}
            <Card>
                <CardHeader>
                    <CardTitle>Lab Tests & Investigations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Existing Lab Tests */}
                    {formData.labTests.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {formData.labTests.map((test, index) => (
                                <div key={index} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-slate-900">{test.test_name}</p>
                                            {test.urgent && (
                                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                                    Urgent
                                                </Badge>
                                            )}
                                        </div>
                                        {test.reason && (
                                            <p className="text-sm text-slate-500 mt-1">{test.reason}</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeLabTest(index)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New Lab Test */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="test-name">Test Name</Label>
                            <Input
                                id="test-name"
                                placeholder="e.g., Complete Blood Count"
                                value={currentLabTest.test_name}
                                onChange={(e) => setCurrentLabTest(prev => ({ ...prev, test_name: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="test-reason">Reason</Label>
                            <Input
                                id="test-reason"
                                placeholder="e.g., To check for infection"
                                value={currentLabTest.reason}
                                onChange={(e) => setCurrentLabTest(prev => ({ ...prev, reason: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="urgent"
                                checked={currentLabTest.urgent}
                                onChange={(e) => setCurrentLabTest(prev => ({ ...prev, urgent: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <Label htmlFor="urgent" className="cursor-pointer">Mark as urgent</Label>
                        </div>
                    </div>

                    <Button type="button" onClick={addLabTest} variant="outline" className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Add Lab Test
                    </Button>
                </CardContent>
            </Card>

            {/* Follow-up */}
            <Card>
                <CardHeader>
                    <CardTitle>Follow-up</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="followUpDate">Follow-up Date</Label>
                            <Input
                                id="followUpDate"
                                type="date"
                                value={formData.followUpDate}
                                onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div>
                            <Label htmlFor="followUpNotes">Follow-up Notes</Label>
                            <Input
                                id="followUpNotes"
                                placeholder="e.g., Check progress, review lab results"
                                value={formData.followUpNotes}
                                onChange={(e) => handleInputChange('followUpNotes', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600">
                    * Assessment and Plan are required fields
                </p>
                <div className="flex gap-3">
                    <Button
                        onClick={handleSave}
                        variant="outline"
                        disabled={loading}
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {loading ? "Saving..." : "Save to Patient Profile"}
                    </Button>
                    <Button
                        onClick={handleSaveAndInvoice}
                        disabled={loading}
                        className="gap-2 bg-teal-600 hover:bg-teal-700"
                    >
                        <Send className="h-4 w-4" />
                        {loading ? "Processing..." : "Save & Send Invoice"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
