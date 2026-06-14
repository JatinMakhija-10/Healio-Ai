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
    Activity,
    User,
    Mic,
    Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

function getLocalHealioKeys(userId: string) {
    const suffix = `_${userId}`;
    const explicitKeys = [
        `healio_history${suffix}`,
        `healio_consultation_history${suffix}`,
        `healio_user_profile${suffix}`,
        `healio_pending_profile${suffix}`,
        `healio_pref_ayurvedic${suffix}`,
        `healio_pref_uncertainty${suffix}`,
        `healio_pref_detailed${suffix}`,
        `healio_emergency_contact${suffix}`,
        `settings_email_notif${suffix}`,
        `settings_push_notif${suffix}`,
        `healio_speech_lang${suffix}`,
    ];

    const discoveredKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (
            key.includes(userId) ||
            key.startsWith("healio_consultation_history") ||
            key.startsWith("healio_chat_session") ||
            key.startsWith("healio_history")
        ) {
            discoveredKeys.push(key);
        }
    }

    return Array.from(new Set([...explicitKeys, ...discoveredKeys]));
}

function collectLocalData(userId: string) {
    const data: Record<string, unknown> = {};
    for (const key of getLocalHealioKeys(userId)) {
        const value = localStorage.getItem(key);
        if (value === null) continue;
        try {
            data[key] = JSON.parse(value);
        } catch {
            data[key] = value;
        }
    }

    const sessionData: Record<string, unknown> = {};
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (!key) continue;
        if (!key.includes(userId) && !key.startsWith("healio_chat_session")) continue;
        const value = sessionStorage.getItem(key);
        if (value === null) continue;
        try {
            sessionData[key] = JSON.parse(value);
        } catch {
            sessionData[key] = value;
        }
    }

    return { localStorage: data, sessionStorage: sessionData };
}

function clearLocalHealioData(userId: string) {
    getLocalHealioKeys(userId).forEach((key) => localStorage.removeItem(key));

    const sessionKeys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (!key) continue;
        if (key.includes(userId) || key.startsWith("healio_chat_session")) {
            sessionKeys.push(key);
        }
    }
    sessionKeys.forEach((key) => sessionStorage.removeItem(key));
}

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
    const { logout, profile, updateProfile, user } = useAuth();

    // Profile Editing State
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileSaveMessage, setProfileSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

    // Voice Input Language State
    const [speechLang, setSpeechLang] = useState("en-IN");

    // Emergency Contact State
    const [emergencyContact, setEmergencyContact] = useState({ name: "", phone: "" });

    // DPDP Account Deletion State
    const [deletionConfirm, setDeletionConfirm] = useState("");
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [isExportingData, setIsExportingData] = useState(false);
    const [isClearingLocalData, setIsClearingLocalData] = useState(false);

    useEffect(() => {
        // Skip if no user
        if (!user) return;

        // Load profile data from context
        if (profile) {
            setFullName(profile.full_name || "");
            setPhone(profile.phone || "");
        }

        // User-specific key suffix
        const keySuffix = `_${user.id}`;

        // Load preferences from local storage (user-specific)
        const savedEmail = localStorage.getItem(`settings_email_notif${keySuffix}`);
        const savedPush = localStorage.getItem(`settings_push_notif${keySuffix}`);

         
        if (savedEmail !== null) setEmailNotif(savedEmail === "true");
        if (savedPush !== null) setPushNotif(savedPush === "true");

        const savedAyurvedic = localStorage.getItem(`healio_pref_ayurvedic${keySuffix}`);
        const savedUncertainty = localStorage.getItem(`healio_pref_uncertainty${keySuffix}`);
        const savedDetailed = localStorage.getItem(`healio_pref_detailed${keySuffix}`);

        if (savedAyurvedic !== null) setAyurvedicMode(savedAyurvedic === "true");
        if (savedUncertainty !== null) setShowUncertainty(savedUncertainty === "true");
        if (savedDetailed !== null) setDetailedExplanations(savedDetailed === "true");

        const savedEmergency = localStorage.getItem(`healio_emergency_contact${keySuffix}`);
        if (savedEmergency) {
            setEmergencyContact(JSON.parse(savedEmergency));
        }

        const savedSpeechLang = localStorage.getItem(`healio_speech_lang${keySuffix}`);
        if (savedSpeechLang) setSpeechLang(savedSpeechLang);
    }, [profile, user]);

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        setProfileSaveMessage(null);

        try {
            await updateProfile({
                full_name: fullName,
                phone: phone
            });

            setProfileSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setProfileSaveMessage(null), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setProfileSaveMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to update profile'
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSaveEmergency = () => {
        if (!user) return;
        localStorage.setItem(`healio_emergency_contact_${user.id}`, JSON.stringify(emergencyContact));
        alert("Emergency contact saved.");
    };

    const toggleEmail = () => {
        if (!user) return;
        const newVal = !emailNotif;
        setEmailNotif(newVal);
        localStorage.setItem(`settings_email_notif_${user.id}`, String(newVal));
    };

    const togglePush = () => {
        if (!user) return;
        const newVal = !pushNotif;
        setPushNotif(newVal);
        localStorage.setItem(`settings_push_notif_${user.id}`, String(newVal));
    };

    const toggleAyurvedic = () => {
        if (!user) return;
        const newVal = !ayurvedicMode;
        setAyurvedicMode(newVal);
        localStorage.setItem(`healio_pref_ayurvedic_${user.id}`, String(newVal));
    };

    const toggleUncertainty = () => {
        if (!user) return;
        const newVal = !showUncertainty;
        setShowUncertainty(newVal);
        localStorage.setItem(`healio_pref_uncertainty_${user.id}`, String(newVal));
    };

    const toggleDetailed = () => {
        if (!user) return;
        const newVal = !detailedExplanations;
        setDetailedExplanations(newVal);
        localStorage.setItem(`healio_pref_detailed_${user.id}`, String(newVal));
    };

    const handleClearLocalHistory = () => {
        if (!user) return;
        const confirmed = confirm(
            "Clear all Healio consultation history, chat sessions, preferences, and saved profile data from this device?\n\nYour cloud account is not deleted."
        );
        if (!confirmed) return;

        setIsClearingLocalData(true);
        try {
            clearLocalHealioData(user.id);
            window.dispatchEvent(new Event("storage"));
            alert("Local Healio history has been cleared from this device.");
        } catch (error) {
            console.error("Error clearing data:", error);
            alert("Failed to clear local data. Please try again.");
        } finally {
            setIsClearingLocalData(false);
        }
    };

    const handleExportJsonData = async () => {
        if (!user) return;
        setIsExportingData(true);
        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            if (sessionError || !token) {
                throw new Error("Please sign in again before exporting your data.");
            }

            const response = await fetch("/api/account/export", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const serverData = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(serverData.error || "Failed to export server data.");
            }

            const payload = {
                ...serverData,
                account: {
                    id: user.id,
                    email: user.email ?? null,
                },
                device_data: collectLocalData(user.id),
                export_note: "This JSON includes cloud records plus Healio data stored on this device.",
            };
            const filename = `healio-data-export-${new Date().toISOString().slice(0, 10)}.json`;
            const blob = new Blob([JSON.stringify(payload, null, 2)], {
                type: "application/json;charset=utf-8",
            });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);

            alert(`Your Healio data export is ready.\n\nFile: ${filename}`);
        } catch (error) {
            console.error("Export error:", error);
            alert(`Failed to export data.\n\n${error instanceof Error ? error.message : "Please try again."}`);
        } finally {
            setIsExportingData(false);
        }
    };

    const handlePermanentAccountDelete = async () => {
        if (deletionConfirm !== "DELETE" || !user) return;
        const confirmed = confirm(
            "This will permanently delete your Healio account, health history, family profiles, and local device history. This cannot be undone.\n\nContinue?"
        );
        if (!confirmed) return;

        setIsDeletingAccount(true);
        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            if (sessionError || !token) {
                throw new Error("Please sign in again before deleting your account.");
            }

            const response = await fetch("/api/account/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ confirmation: "DELETE" }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result.error || result.message || "Failed to delete account data.");
            }

            clearLocalHealioData(user.id);
            alert(
                result.auth_deleted
                    ? "Your Healio account and health data have been deleted."
                    : `Your health data was deleted, but login deletion needs support follow-up. ${result.warning || ""}`.trim()
            );
            await logout();
        } catch (err) {
            console.error("Deletion error:", err);
            alert(err instanceof Error ? err.message : "Failed to delete account. Please try again.");
        } finally {
            setIsDeletingAccount(false);
            setDeletionConfirm("");
        }
    };

    return (
        <div className="space-y-6 max-w-3xl pb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500">Manage your application preferences and account.</p>
            </div>

            {/* Profile Information */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-teal-600" />
                        <CardTitle>Profile Information</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            placeholder="Your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            placeholder="+91-XXXXXXXXXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            value={profile?.email || ""}
                            disabled
                            className="bg-slate-50 text-slate-500"
                        />
                        <p className="text-xs text-slate-500">Email cannot be changed</p>
                    </div>

                    {profileSaveMessage && (
                        <div className={`p-3 rounded-md text-sm ${profileSaveMessage.type === 'success'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                            {profileSaveMessage.text}
                        </div>
                    )}

                    <Button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="w-full md:w-auto bg-slate-900 text-white hover:bg-slate-800"
                    >
                        {isSavingProfile ? 'Saving...' : 'Save Profile'}
                    </Button>
                </CardContent>
            </Card>

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
                            <p className="text-sm text-slate-500">Show match score, confidence range, and evidence quality in the result.</p>
                        </div>
                        <Switch checked={showUncertainty} onToggle={toggleUncertainty} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base cursor-pointer" onClick={toggleDetailed}>Detailed Explanations</Label>
                            <p className="text-sm text-slate-500">Add an expandable explanation panel with rules, factors, and alternatives considered.</p>
                        </div>
                        <Switch checked={detailedExplanations} onToggle={toggleDetailed} />
                    </div>
                </CardContent>
            </Card>

            {/* Voice Input */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Mic className="h-5 w-5 text-teal-600" />
                        <CardTitle>Voice Input</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="speechLang">Speech Recognition Language</Label>
                        <p className="text-sm text-slate-500">Choose the language used when you tap the mic button during consultations.</p>
                        <select
                            id="speechLang"
                            value={speechLang}
                            onChange={(e) => {
                                if (!user) return;
                                const val = e.target.value;
                                setSpeechLang(val);
                                localStorage.setItem(`healio_speech_lang_${user.id}`, val);
                            }}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="en-IN">English (India)</option>
                            <option value="hi-IN">Hindi (हिन्दी)</option>
                            <option value="ta-IN">Tamil (தமிழ்)</option>
                            <option value="te-IN">Telugu (తెలుగు)</option>
                        </select>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
                        💡 Tip: Tap the microphone icon in the chat to speak your symptoms instead of typing. Works best in Chrome.
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
                        <Button variant="outline" size="sm" onClick={handleExportJsonData} disabled={isExportingData}>
                            {isExportingData
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exporting</>
                                : <><Download className="mr-2 h-4 w-4" />Export</>}
                        </Button>
                    </div>
                    <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base text-red-600">Clear Local History</Label>
                            <p className="text-sm text-slate-500">Remove all consultation history from this device.</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={handleClearLocalHistory}
                            disabled={isClearingLocalData}
                        >
                            {isClearingLocalData
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Clearing</>
                                : <><Trash2 className="mr-2 h-4 w-4" />Clear</>}
                        </Button>
                    </div>

                    {/* DPDP §11 Right to Erasure */}
                    <div className="border-t border-red-100 pt-4 space-y-3">
                        <div className="space-y-0.5">
                            <Label className="text-base text-red-700">Delete My Account &amp; Data</Label>
                            <p className="text-sm text-slate-500">
                                Permanently delete your account and all health data. Under the DPDP Act 2023, your data will be fully erased within 30 days. This cannot be undone.
                            </p>
                        </div>
                        <div className="rounded-lg border border-red-100 bg-red-50 p-3 space-y-1.5">
                            <p className="text-xs text-red-700 font-medium">This will delete:</p>
                            <ul className="text-xs text-red-600 space-y-0.5 list-disc list-inside">
                                <li>Your profile and all medical history</li>
                                <li>All family profiles</li>
                                <li>Consultation history and diagnosis records</li>
                                <li>Your account login</li>
                            </ul>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Input
                                placeholder="Type DELETE to confirm"
                                value={deletionConfirm}
                                onChange={e => setDeletionConfirm(e.target.value)}
                                className="text-sm border-red-200 focus-visible:ring-red-400 max-w-[220px]"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-700 border-red-300 hover:bg-red-100 whitespace-nowrap"
                                disabled={deletionConfirm !== "DELETE" || isDeletingAccount}
                                onClick={handlePermanentAccountDelete}
                            >
                                {isDeletingAccount
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting&hellip;</>
                                    : <><Trash2 className="mr-2 h-4 w-4" />Delete Account</>}
                            </Button>
                        </div>
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
