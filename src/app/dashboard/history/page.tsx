"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp, AlertCircle, Leaf, Dumbbell, AlertTriangle, ChevronDown, ChevronUp, Lock, Activity, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { UserSymptomData, DiagnosisResult, Condition } from "@/lib/diagnosis/types";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { UncertaintyEstimate, RuleResult } from "@/lib/diagnosis/advanced";
import { pdf } from '@react-pdf/renderer';
import { MedicalReportDocument } from '@/components/chat/MedicalReportPDF';


type SavedDiagnosis = {
    condition: string;
    description: string;
    severity?: string;
    remedies?: any[];
    indianHomeRemedies?: any[];
    exercises?: any[];
    warnings?: string[];
    seekHelp?: string;
};

type Consultation = {
    id: string;
    created_at: string;
    symptoms: UserSymptomData;
    diagnosis: SavedDiagnosis;
    confidence: number;
    uncertainty?: UncertaintyEstimate;
    clinicalRules?: RuleResult[];
};

export default function HistoryPage() {
    const { user } = useAuth();
    const [history, setHistory] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [reportData, setReportData] = useState<{ consultation: Consultation; condition: Condition } | null>(null);

    const handleShare = async (e: React.MouseEvent, consultation: Consultation) => {
        e.stopPropagation();
        setGeneratingId(consultation.id);

        try {
            const hydratedCondition: Condition = {
                id: 'history-condition-id',
                name: consultation.diagnosis.condition,
                description: consultation.diagnosis.description,
                matchCriteria: { locations: [] } as any,
                severity: (consultation.diagnosis.severity as any) || 'moderate',
                remedies: consultation.diagnosis.remedies || [],
                indianHomeRemedies: consultation.diagnosis.indianHomeRemedies || [],
                exercises: consultation.diagnosis.exercises || [],
                warnings: consultation.diagnosis.warnings || [],
                seekHelp: consultation.diagnosis.seekHelp || '',
            };

            // Generate PDF Blob using @react-pdf/renderer
            const blob = await pdf(
                <MedicalReportDocument
                    condition={hydratedCondition}
                    confidence={consultation.confidence}
                    uncertainty={consultation.uncertainty}
                    alerts={consultation.diagnosis.warnings || []}
                    symptoms={Object.values(consultation.symptoms?.location || []).concat(consultation.symptoms?.painType ? [consultation.symptoms.painType] : [])}
                    userName={user?.user_metadata?.full_name || "Patient"}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Healio-Report-${consultation.diagnosis.condition.replace(/\s+/g, '-')}-${new Date(consultation.created_at).toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Report generation failed:", error);
            alert("Failed to generate report. Please try again.");
        } finally {
            setGeneratingId(null);
            setReportData(null); // Actually this state might be redundant now if only used for the portal
        }
    };

    useEffect(() => {
        const fetchHistory = async () => {
            let consultations: Consultation[] = [];

            // Try to fetch from Supabase if user is authenticated
            if (user) {
                try {
                    const { data, error } = await supabase
                        .from('consultations')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false });

                    if (!error && data) {
                        consultations = data;
                    }
                } catch (error) {
                    console.error('Failed to fetch from Supabase:', error);
                }
            }

            // Also check localStorage for local history
            try {
                const localHistory = JSON.parse(localStorage.getItem('healio_consultation_history') || '[]');
                // Merge and deduplicate by id
                const existingIds = new Set(consultations.map(c => c.id));
                const uniqueLocalHistory = localHistory.filter((c: Consultation) => !existingIds.has(c.id));
                consultations = [...consultations, ...uniqueLocalHistory];
                // Sort by date
                consultations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            } catch (e) {
                console.error('Failed to load local history:', e);
            }

            setHistory(consultations);
            setLoading(false);
        };

        fetchHistory();
    }, [user]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSeverityColor = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case 'mild':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'mild-moderate':
                return 'bg-lime-100 text-lime-800 border-lime-200';
            case 'moderate':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'moderate-severe':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'severe':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-500">Loading consultation history...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Consultation History</h1>
                <p className="text-slate-500">View your past assessments and recommendations.</p>
            </div>

            {history.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200 shadow-none bg-slate-50">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <div className="bg-white p-4 rounded-full shadow-sm">
                            <Clock className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-slate-900">No history yet</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                You haven&apos;t completed any consultations yet. Start a new assessment to track your health.
                            </p>
                        </div>
                        <Link href="/dashboard/consult">
                            <Button>Start New Consultation</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {history.map((consultation) => {
                        const isExpanded = expandedId === consultation.id;
                        return (
                            <Card key={consultation.id} className="hover:shadow-md transition-shadow overflow-hidden">
                                <CardHeader
                                    className="cursor-pointer"
                                    onClick={() => toggleExpand(consultation.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-xl flex items-center gap-2">
                                                    {consultation.diagnosis?.condition || 'Unknown Condition'}
                                                </CardTitle>
                                                {consultation.symptoms?.location && consultation.symptoms.location.length > 0 && (
                                                    <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                        {consultation.symptoms.location.join(', ')}
                                                    </span>
                                                )}
                                                <Lock className="h-3 w-3 text-emerald-500" />
                                                <span className="sr-only">Encrypted</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {formatDate(consultation.created_at)}
                                                </span>
                                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 text-slate-400 hover:text-teal-600"
                                                    onClick={(e) => handleShare(e, consultation)}
                                                    disabled={generatingId === consultation.id}
                                                    title="Share Report"
                                                >
                                                    {generatingId === consultation.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Share2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Badge
                                                    variant="outline"
                                                    className={getSeverityColor(consultation.diagnosis?.severity || '')}
                                                >
                                                    {consultation.diagnosis?.severity || 'Unknown'}
                                                </Badge>
                                            </div>

                                            {/* Enhanced Confidence Display */}
                                            {consultation.uncertainty ? (
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-teal-700">
                                                        <Activity className="h-3.5 w-3.5" />
                                                        <span>{consultation.uncertainty.pointEstimate.toFixed(0)}%</span>
                                                    </div>
                                                    <span className="text-[10px] text-teal-600 font-medium">
                                                        Range: {consultation.uncertainty.confidenceInterval.lower.toFixed(0)}-{consultation.uncertainty.confidenceInterval.upper.toFixed(0)}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <TrendingUp className="h-4 w-4 text-teal-600" />
                                                    <span className="font-medium text-teal-700">
                                                        {consultation.confidence?.toFixed(0) || 0}% match
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                {isExpanded && (
                                    <CardContent className="space-y-5 border-t border-slate-100 bg-slate-50/50">
                                        {/* Symptoms Reported */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-slate-500" />
                                                Symptoms Reported
                                            </h4>
                                            <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-600 space-y-1">
                                                <p><span className="font-medium">Location:</span> {consultation.symptoms?.location?.join(', ') || 'Not specified'}</p>
                                                <p><span className="font-medium">Pain Type:</span> {consultation.symptoms?.painType || 'Not specified'}</p>
                                                <p><span className="font-medium">Intensity:</span> {consultation.symptoms?.intensity || 'N/A'}/10</p>
                                                <p><span className="font-medium">Duration:</span> {consultation.symptoms?.duration || 'Not specified'}</p>
                                                {consultation.symptoms?.additionalNotes && (
                                                    <p><span className="font-medium">Notes:</span> {consultation.symptoms.additionalNotes}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Diagnosis Summary */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Diagnosis Summary</h4>
                                            <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                                                {consultation.diagnosis?.description || 'No description available.'}
                                            </p>
                                        </div>

                                        {/* Standard Remedies */}
                                        {consultation.diagnosis?.remedies && consultation.diagnosis.remedies.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                                    <Dumbbell className="h-4 w-4 text-blue-500" />
                                                    Recommended Remedies
                                                </h4>
                                                <div className="space-y-2">
                                                    {consultation.diagnosis.remedies.map((remedy: any, idx: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                                        <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200">
                                                            <p className="font-medium text-slate-800">{remedy.name}</p>
                                                            <p className="text-xs text-slate-500">{remedy.description}</p>
                                                            {remedy.method && <p className="text-xs text-slate-600 mt-1"><span className="font-medium">Method:</span> {remedy.method}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Indian Home Remedies */}
                                        {consultation.diagnosis?.indianHomeRemedies && consultation.diagnosis.indianHomeRemedies.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                                    <Leaf className="h-4 w-4 text-green-600" />
                                                    Indian Home Remedies / Ayurvedic
                                                </h4>
                                                <div className="space-y-2">
                                                    {consultation.diagnosis.indianHomeRemedies.slice(0, 5).map((remedy: any, idx: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                                        <div key={idx} className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                            <p className="font-medium text-green-800">{remedy.name}</p>
                                                            <p className="text-xs text-green-600">{remedy.description}</p>
                                                            {remedy.ingredients && remedy.ingredients.length > 0 && (
                                                                <p className="text-xs text-green-700 mt-1">
                                                                    <span className="font-medium">Ingredients:</span> {remedy.ingredients.join(', ')}
                                                                </p>
                                                            )}
                                                            {remedy.method && <p className="text-xs text-green-700"><span className="font-medium">Method:</span> {remedy.method}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Exercises */}
                                        {consultation.diagnosis?.exercises && consultation.diagnosis.exercises.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                                    <Dumbbell className="h-4 w-4 text-purple-500" />
                                                    Recommended Exercises
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {consultation.diagnosis.exercises.map((exercise: any, idx: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                                        <Badge key={idx} variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                                                            {exercise.name} ({exercise.duration})
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Warnings */}
                                        {consultation.diagnosis?.warnings && consultation.diagnosis.warnings.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    Warnings
                                                </h4>
                                                <ul className="text-sm text-amber-700 list-disc list-inside bg-amber-50 p-3 rounded-lg border border-amber-200">
                                                    {consultation.diagnosis.warnings.map((warning: string, idx: number) => (
                                                        <li key={idx}>{warning}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* When to Seek Help */}
                                        {consultation.diagnosis?.seekHelp && (
                                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                                <h4 className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4" />
                                                    When to Seek Medical Help
                                                </h4>
                                                <p className="text-sm text-red-600">{consultation.diagnosis.seekHelp}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
