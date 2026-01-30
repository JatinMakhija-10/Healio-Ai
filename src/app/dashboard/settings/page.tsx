"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Bell,
    Shield,
    Trash2,
    Download,
    HelpCircle,
    Mail,
    ChevronRight,
    LogOut,
    Phone,
    MapPin,
    Clock,
    ChevronUp,
    Activity
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Helper for Switch UI (Moved outside component to prevent re-creation on render)
const Switch = ({ checked, onToggle }: { checked: boolean, onToggle: () => void }) => (
    <div
        className={`h-6 w-11 rounded-full relative cursor-pointer transition-colors ${checked ? 'bg-teal-600' : 'bg-slate-200'}`}
        onClick={onToggle}
    >
        <div className={`absolute top-1 w-4 h-4 rounded-full shadow-sm transition-all bg-white ${checked ? 'right-1' : 'left-1'}`} />
    </div>
);

export default function SettingsPage() {
    const { logout } = useAuth();

    // Notification State
    const [emailNotif, setEmailNotif] = useState(true);
    const [pushNotif, setPushNotif] = useState(true);

    // Support toggle state
    const [showContact, setShowContact] = useState(false);
    const [showFaq, setShowFaq] = useState(false);

    // Diagnostic Preferences State
    const [ayurvedicMode, setAyurvedicMode] = useState(true);
    const [showUncertainty, setShowUncertainty] = useState(true);
    const [detailedExplanations, setDetailedExplanations] = useState(true);

    // Emergency Contact State
    const [emergencyContact, setEmergencyContact] = useState({ name: "", phone: "" });

    useEffect(() => {
        // Load preferences from local storage
        const savedEmail = localStorage.getItem("settings_email_notif");
        const savedPush = localStorage.getItem("settings_push_notif");

        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (savedEmail !== null) setEmailNotif(savedEmail === "true");
        if (savedPush !== null) setPushNotif(savedPush === "true");

        const savedAyurvedic = localStorage.getItem("healio_pref_ayurvedic");
        const savedUncertainty = localStorage.getItem("healio_pref_uncertainty");
        const savedDetailed = localStorage.getItem("healio_pref_detailed");

        if (savedAyurvedic !== null) setAyurvedicMode(savedAyurvedic === "true");
        if (savedUncertainty !== null) setShowUncertainty(savedUncertainty === "true");
        if (savedDetailed !== null) setDetailedExplanations(savedDetailed === "true");

        const savedEmergency = localStorage.getItem("healio_emergency_contact");
        if (savedEmergency) {
            setEmergencyContact(JSON.parse(savedEmergency));
        }
    }, []);

    const handleSaveEmergency = () => {
        localStorage.setItem("healio_emergency_contact", JSON.stringify(emergencyContact));
        alert("Emergency contact saved.");
    };

    const toggleEmail = () => {
        const newVal = !emailNotif;
        setEmailNotif(newVal);
        localStorage.setItem("settings_email_notif", String(newVal));
    };

    const togglePush = () => {
        const newVal = !pushNotif;
        setPushNotif(newVal);
        localStorage.setItem("settings_push_notif", String(newVal));
    };

    const toggleAyurvedic = () => {
        const newVal = !ayurvedicMode;
        setAyurvedicMode(newVal);
        localStorage.setItem("healio_pref_ayurvedic", String(newVal));
    };

    const toggleUncertainty = () => {
        const newVal = !showUncertainty;
        setShowUncertainty(newVal);
        localStorage.setItem("healio_pref_uncertainty", String(newVal));
    };

    const toggleDetailed = () => {
        const newVal = !detailedExplanations;
        setDetailedExplanations(newVal);
        localStorage.setItem("healio_pref_detailed", String(newVal));
    };

    const handleClearData = () => {
        if (confirm("⚠️ Are you sure you want to clear all local history?\n\nThis will permanently delete:\n• All consultation records\n• Diagnosis history\n• Profile data\n\nThis action CANNOT be undone!")) {
            try {
                // Clear all Healio.AI data from localStorage
                const keysToRemove = [
                    "healio_history",
                    "healio_user_profile",
                    "healio_pending_profile",
                    "healio_pref_ayurvedic",
                    "healio_pref_uncertainty",
                    "healio_pref_detailed",
                    "healio_emergency_contact"
                ];

                keysToRemove.forEach(key => localStorage.removeItem(key));

                alert("✅ All local history and data have been cleared successfully.\n\nYour health data has been permanently removed from this device.");

                // Optionally reload the page to reflect changes
                if (confirm("Would you like to reload the page to see the changes?")) {
                    window.location.reload();
                }
            } catch (error) {
                console.error('Error clearing data:', error);
                alert("❌ Failed to clear data. Please try again.");
            }
        }
    };

    const handleExportData = async () => {
        try {
            const historyData = localStorage.getItem("healio_history");
            const profileData = localStorage.getItem("healio_user_profile");
            const pendingProfile = localStorage.getItem("healio_pending_profile");

            if (!historyData && !profileData && !pendingProfile) {
                alert("No health data found to export.\n\nPlease complete a consultation first.");
                return;
            }

            // Dynamically import jsPDF
            const jsPDF = (await import('jspdf')).default;
            const doc = new jsPDF();

            // Parse data
            const profile = profileData ? JSON.parse(profileData) : null;
            const parsedPendingProfile = pendingProfile ? JSON.parse(pendingProfile) : null;
            const consultations = historyData ? JSON.parse(historyData) : [];

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            let y = margin;

            // Helper to add new  page if needed
            const checkPageBreak = (neededHeight: number) => {
                if (y + neededHeight > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                    return true;
                }
                return false;
            };

            // Title Page
            doc.setFontSize(24);
            doc.setTextColor(13, 148, 136); // Teal color
            doc.text('Healio.AI', pageWidth / 2, y, { align: 'center' });
            y += 10;

            doc.setFontSize(16);
            doc.setTextColor(71, 85, 105); // Slate color
            doc.text('Personal Health Data Export', pageWidth / 2, y, { align: 'center' });
            y += 15;

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`Exported: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
            y += 20;

            // Profile Section
            if (profile || parsedPendingProfile) {
                checkPageBreak(40);
                doc.setFontSize(14);
                doc.setTextColor(13, 148, 136);
                doc.text('Personal Profile', margin, y);
                y += 8;

                doc.setFontSize(10);
                doc.setTextColor(51, 65, 85);

                if (profile?.name) {
                    doc.text(`Name: ${profile.name}`, margin, y);
                    y += 6;
                }
                if (profile?.age) {
                    doc.text(`Age: ${profile.age} years`, margin, y);
                    y += 6;
                }
                if (parsedPendingProfile?.ayurvedic_profile?.prakriti) {
                    doc.text(`Ayurvedic Constitution (Prakriti): ${parsedPendingProfile.ayurvedic_profile.prakriti}`, margin, y);
                    y += 6;
                }
                y += 5;
            }

            // Consultation History
            if (consultations && consultations.length > 0) {
                checkPageBreak(30);
                doc.setFontSize(14);
                doc.setTextColor(13, 148, 136);
                doc.text('Consultation History', margin, y);
                y += 10;

                consultations.slice(0, 10).forEach((consultation: any, index: number) => {
                    checkPageBreak(50);

                    doc.setFontSize(11);
                    doc.setTextColor(51, 65, 85);
                    doc.text(`Consultation #${index + 1}`, margin, y);
                    y += 6;

                    doc.setFontSize(9);
                    doc.setTextColor(100, 116, 139);

                    if (consultation.timestamp) {
                        doc.text(`Date: ${new Date(consultation.timestamp).toLocaleDateString()}`, margin + 5, y);
                        y += 5;
                    }

                    if (consultation.symptoms) {
                        doc.text(`Symptoms: ${consultation.symptoms}`, margin + 5, y);
                        y += 5;
                    }

                    if (consultation.topCondition) {
                        doc.setTextColor(51, 65, 85);
                        doc.text(`Diagnosis: ${consultation.topCondition}`, margin + 5, y);
                        y += 5;
                    }

                    if (consultation.confidence) {
                        doc.setTextColor(100, 116, 139);
                        doc.text(`Confidence: ${consultation.confidence}%`, margin + 5, y);
                        y += 5;
                    }

                    y += 3;
                });

                if (consultations.length > 10) {
                    doc.setFontSize(9);
                    doc.setTextColor(139, 162, 189);
                    doc.text(`... and ${consultations.length - 10} more consultations`, margin, y);
                    y += 8;
                }
            }

            // Ayurvedic Profile
            if (parsedPendingProfile?.ayurvedic_profile) {
                checkPageBreak(40);
                const ayurvedic = parsedPendingProfile.ayurvedic_profile;

                doc.setFontSize(14);
                doc.setTextColor(13, 148, 136);
                doc.text('Ayurvedic Analysis', margin, y);
                y += 10;

                doc.setFontSize(10);
                doc.setTextColor(51, 65, 85);

                if (ayurvedic.prakriti) {
                    doc.text(`Constitution (Prakriti): ${ayurvedic.prakriti}`, margin, y);
                    y += 6;
                }

                if (ayurvedic.characteristics && ayurvedic.characteristics.length > 0) {
                    doc.text('Key Characteristics:', margin, y);
                    y += 6;
                    ayurvedic.characteristics.slice(0, 5).forEach((char: string) => {
                        doc.text(`• ${char}`, margin + 5, y);
                        y += 5;
                    });
                    y += 3;
                }
            }

            // Footer on each page
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(139, 162, 189);
                doc.text(
                    `Page ${i} of ${totalPages} | Healio.AI - Personal Health Assistant`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
                doc.text(
                    'CONFIDENTIAL - For personal use only',
                    pageWidth / 2,
                    pageHeight - 6,
                    { align: 'center' }
                );
            }

            // Save PDF
            const filename = `Healio_Health_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);

            alert(`✅ Your health data has been exported successfully!\n\nFile: ${filename}`);

        } catch (error) {
            console.error('Export error:', error);
            alert(`❌ Failed to export data.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again.`);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl pb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500">Manage your application preferences and account.</p>
            </div>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-teal-600" />
                        <CardTitle>Notifications</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base cursor-pointer" onClick={toggleEmail}>Email Notifications</Label>
                            <p className="text-sm text-slate-500">Receive summaries of your consultations.</p>
                        </div>
                        <Switch checked={emailNotif} onToggle={toggleEmail} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base cursor-pointer" onClick={togglePush}>Push Notifications</Label>
                            <p className="text-sm text-slate-500">Get alerts about your health reminders.</p>
                        </div>
                        <Switch checked={pushNotif} onToggle={togglePush} />
                    </div>
                </CardContent>
            </Card>

            {/* Diagnostic Preferences */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-teal-600" />
                        <CardTitle>Diagnostic Preferences</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base cursor-pointer" onClick={toggleAyurvedic}>Ayurvedic Mode</Label>
                            <p className="text-sm text-slate-500">Enable Indian home remedies and Dosha analysis.</p>
                        </div>
                        <Switch checked={ayurvedicMode} onToggle={toggleAyurvedic} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base cursor-pointer" onClick={toggleUncertainty}>Clinical Uncertainty</Label>
                            <p className="text-sm text-slate-500">Show confidence intervals and evidence quality.</p>
                        </div>
                        <Switch checked={showUncertainty} onToggle={toggleUncertainty} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base cursor-pointer" onClick={toggleDetailed}>Detailed Explanations</Label>
                            <p className="text-sm text-slate-500">Show reasoning behind the diagnosis.</p>
                        </div>
                        <Switch checked={detailedExplanations} onToggle={toggleDetailed} />
                    </div>
                </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-teal-600" />
                        <CardTitle>Emergency Contact</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="contactName">Contact Name</Label>
                            <Input
                                id="contactName"
                                placeholder="e.g. Jane Doe"
                                value={emergencyContact.name}
                                onChange={(e) => setEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">Phone Number</Label>
                            <Input
                                id="contactPhone"
                                placeholder="e.g. +1 (555) 000-0000"
                                value={emergencyContact.phone}
                                onChange={(e) => setEmergencyContact(prev => ({ ...prev, phone: e.target.value }))}
                            />
                        </div>
                    </div>
                    <Button onClick={handleSaveEmergency} className="w-full md:w-auto bg-slate-900 text-white hover:bg-slate-800">
                        Save Contact
                    </Button>
                </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-teal-600" />
                        <CardTitle>Data & Privacy</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Export Data</Label>
                            <p className="text-sm text-slate-500">Download a copy of your health data (JSON).</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleExportData}>
                            <Download className="mr-2 h-4 w-4" /> Export
                        </Button>
                    </div>
                    <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base text-red-600">Clear Local History</Label>
                            <p className="text-sm text-slate-500">Remove all consultation history from this device.</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={handleClearData}>
                            <Trash2 className="mr-2 h-4 w-4" /> Clear
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Support */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-teal-600" />
                        <CardTitle>Support</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Contact Support Section */}
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-between h-auto py-3 px-0 hover:bg-transparent hover:text-teal-600 group"
                            onClick={() => setShowContact(!showContact)}
                        >
                            <span className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-slate-500 group-hover:text-teal-600" />
                                <span className="text-base font-normal">Contact Support</span>
                            </span>
                            {showContact ? <ChevronUp className="h-4 w-4 text-teal-600" /> : <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600" />}
                        </Button>

                        {showContact && (
                            <div className="pl-7 pb-4 space-y-3 text-sm text-slate-600 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-teal-600" />
                                    <span>support@healio.ai</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 text-teal-600" />
                                    <span>+1 (888) 555-0123</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                                    <span>Mon-Fri, 9:00 AM - 6:00 PM EST</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-teal-600 mt-0.5" />
                                    <span>100 Innovation Dr, San Francisco, CA 94105</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* FAQs Section */}
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-between h-auto py-3 px-0 hover:bg-transparent hover:text-teal-600 group"
                            onClick={() => setShowFaq(!showFaq)}
                        >
                            <span className="flex items-center gap-3">
                                <HelpCircle className="h-4 w-4 text-slate-500 group-hover:text-teal-600" />
                                <span className="text-base font-normal">FAQs</span>
                            </span>
                            {showFaq ? <ChevronUp className="h-4 w-4 text-teal-600" /> : <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600" />}
                        </Button>

                        {showFaq && (
                            <div className="pl-2 pb-2 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-1">
                                    <h4 className="font-medium text-slate-900 text-sm">How accurate is the AI diagnosis?</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Healio.AI uses advanced algorithms to analyze your symptoms against a vast medical database. However, it is an informational tool and <span className="font-semibold">not</span> a substitute for professional medical advice. Always consult a doctor for a definitive diagnosis.
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-medium text-slate-900 text-sm">Is my data secure?</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Yes. We prioritize your privacy. All data is encrypted locally on your device. We do not store personal identifiers on external servers without your explicit consent.
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-medium text-slate-900 text-sm">What is the Ayurvedic Constitution analysis?</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        This feature analyzes your physical and emotional traits to determine your unique Dosha balance (Vata, Pitta, Kapha), offering personalized holistic wellness recommendations.
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-medium text-slate-900 text-sm">Can I use Healio.AI in emergencies?</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        <span className="font-semibold text-red-600">No.</span> If you are experiencing a medical emergency (e.g., chest pain, severe bleeding, difficulty breathing), please call emergency services immediately.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="pt-4 flex justify-center">
                <Button variant="ghost" onClick={logout} className="text-slate-500 hover:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
            </div>
        </div>
    );
}
