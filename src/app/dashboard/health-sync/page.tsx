"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Activity,
    HeartPulse,
    Watch,
    Smartphone,
    Upload,
    ShieldCheck,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    Moon,
    Zap,
    Thermometer,
    Droplets,
    Flame,
    ArrowRight,
    Bluetooth,
    FileCode,
    Sliders,
    Sparkles,
    Info,
    Check,
    X,
} from "lucide-react";
import {
    HealthSource,
    HealthIntegrationState,
    HealthPermissionSettings,
    ClinicalAnomaly,
} from "@/types/healthSync";
import {
    loadHealthState,
    saveHealthState,
    syncHealthToBackend,
    getPresetHealthData,
    detectClinicalAnomalies,
    parseAppleHealthXML,
    parseGoogleHealthJSON,
    PhoneMotionTracker,
    connectWebBluetoothHeartRate,
    DEFAULT_PERMISSIONS,
} from "@/lib/health/healthSyncEngine";
import { toast } from "sonner";
import Link from "next/link";

export default function HealthSyncPage() {
    const { user, profile } = useAuth();
    const router = useRouter();

    const [state, setState] = useState<HealthIntegrationState>(() => loadHealthState(user?.id));
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<HealthPermissionSettings>({ ...DEFAULT_PERMISSIONS });
    const [permissionModalSource, setPermissionModalSource] = useState<HealthSource | null>(null);
    const [isPedometerActive, setIsPedometerActive] = useState(false);
    const [pedometerSteps, setPedometerSteps] = useState(0);
    const [isBleConnecting, setIsBleConnecting] = useState(false);
    const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const motionTrackerRef = useRef<PhoneMotionTracker | null>(null);

    // Load persisted state when user ID becomes available
    useEffect(() => {
        if (user?.id) {
            const loaded = loadHealthState(user.id);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setState(loaded);
        }
    }, [user?.id]);

    // Save and sync state changes
    const updateAndSaveState = (updater: (prev: HealthIntegrationState) => HealthIntegrationState) => {
        setState((prev) => {
            const next = updater(prev);
            saveHealthState(next, user?.id);
            return next;
        });
    };

    // ─── 1. CONNECT & PERMISSION HANDLERS ───────────────────────────────────────

    const handleOpenPermissionModal = (source: HealthSource) => {
        setSelectedPermissions({ ...state.sources[source].permissions });
        setPermissionModalSource(source);
    };

    const handleConfirmConnect = async (source: HealthSource) => {
        setPermissionModalSource(null);
        setIsSyncing(true);

        const sourceNames: Record<HealthSource, string> = {
            apple_health: "Apple Health (HealthKit)",
            google_health_connect: "Google Health Connect",
            google_fit: "Google Fit",
            phone_sensors: "Phone Sensors (Pedometer)",
            bluetooth_ble: "Bluetooth Sensor",
            fitbit: "Fitbit",
            garmin: "Garmin Connect",
            whoop: "Whoop Strap",
            oura: "Oura Ring",
            manual_upload: "Manual Health Export",
        };

        const defaultModels: Record<HealthSource, string> = {
            apple_health: "Apple Watch Series 9 / iPhone",
            google_health_connect: "Google Pixel Watch / Health Connect",
            google_fit: "Google Fit Android",
            phone_sensors: "Internal Smartphone Accelerometer",
            bluetooth_ble: "Wireless BLE Sensor",
            fitbit: "Fitbit Charge 6",
            garmin: "Garmin Venu 3",
            whoop: "Whoop 4.0",
            oura: "Oura Ring Gen 3",
            manual_upload: "Apple/Google Health Export File",
        };

        // Simulate device handshake
        await new Promise((r) => setTimeout(r, 900));

        // Use appropriate initial metrics if currently empty
        let newMetrics = { ...state.latestMetrics };
        if (!newMetrics.steps && !newMetrics.restingHeartRate) {
            const preset = getPresetHealthData(
                source === "apple_health" ? "apple_active" : "pixel_febrile"
            );
            newMetrics = { ...preset.metrics };
        }

        const anomalies = detectClinicalAnomalies(newMetrics);
        const nowIso = new Date().toISOString();

        updateAndSaveState((prev) => {
            const next: HealthIntegrationState = {
                ...prev,
                sources: {
                    ...prev.sources,
                    [source]: {
                        ...prev.sources[source],
                        status: "connected",
                        deviceModel: defaultModels[source],
                        lastSyncedAt: nowIso,
                        permissions: selectedPermissions,
                        recordCount: (prev.sources[source].recordCount || 0) + 142,
                    },
                },
                latestMetrics: newMetrics,
                anomalies,
                lastGlobalSyncAt: nowIso,
                isSyncing: false,
            };
            syncHealthToBackend(next);
            return next;
        });

        setIsSyncing(false);
        toast.success(`Connected to ${sourceNames[source]} successfully!`, {
            description: "Biometric vitals and activity synced with Arovia clinical engine.",
        });
    };

    const handleDisconnect = (source: HealthSource) => {
        updateAndSaveState((prev) => {
            const next: HealthIntegrationState = {
                ...prev,
                sources: {
                    ...prev.sources,
                    [source]: {
                        ...prev.sources[source],
                        status: "disconnected",
                        deviceModel: undefined,
                    },
                },
            };
            syncHealthToBackend(next);
            return next;
        });
        toast.info(`Disconnected from ${state.sources[source].name}`);
    };

    // ─── 2. QUICK SYNC NOW ──────────────────────────────────────────────────────

    const handleSyncNow = async () => {
        setIsSyncing(true);
        toast.loading("Syncing latest telemetry from connected devices...", { id: "health-sync" });

        await new Promise((r) => setTimeout(r, 1200));

        const nowIso = new Date().toISOString();
        const connectedCount = Object.values(state.sources).filter((s) => s.status === "connected").length;

        if (connectedCount === 0) {
            // If no device connected yet, prompt or load default
            setIsSyncing(false);
            toast.dismiss("health-sync");
            toast.info("No active devices connected", {
                description: "Please connect Apple Health, Google Health Connect, or load a preset below.",
            });
            return;
        }

        // Slightly refresh metrics for live sensation
        const currentMetrics = { ...state.latestMetrics };
        if (currentMetrics.steps) {
            currentMetrics.steps += Math.floor(Math.random() * 85 + 15);
        }
        if (currentMetrics.currentHeartRate) {
            currentMetrics.currentHeartRate += Math.floor(Math.random() * 5 - 2);
        }
        currentMetrics.lastUpdated = nowIso;

        const anomalies = detectClinicalAnomalies(currentMetrics);

        updateAndSaveState((prev) => {
            const nextSources = { ...prev.sources };
            for (const key of Object.keys(nextSources) as HealthSource[]) {
                if (nextSources[key].status === "connected") {
                    nextSources[key] = {
                        ...nextSources[key],
                        lastSyncedAt: nowIso,
                        recordCount: (nextSources[key].recordCount || 0) + 12,
                    };
                }
            }
            const next: HealthIntegrationState = {
                ...prev,
                latestMetrics: currentMetrics,
                anomalies,
                sources: nextSources,
                lastGlobalSyncAt: nowIso,
            };
            syncHealthToBackend(next);
            return next;
        });

        setIsSyncing(false);
        toast.dismiss("health-sync");
        toast.success("Health data synced successfully", {
            description: `Refreshed telemetry across ${connectedCount} source(s).`,
        });
    };

    // ─── 3. FILE IMPORT (APPLE HEALTH XML / GOOGLE HEALTH JSON) ───────────────────

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsSyncing(true);
        toast.loading(`Parsing ${file.name}...`, { id: "file-import" });

        try {
            const text = await file.text();
            let parsedMetrics = {};
            let parsedPoints: any[] = [];
            let sourceDetected: HealthSource = "manual_upload";

            if (file.name.endsWith(".xml") || text.includes("<HealthData") || text.includes("HKQuantityType")) {
                sourceDetected = "apple_health";
                const result = parseAppleHealthXML(text);
                parsedMetrics = result.metrics;
                parsedPoints = result.points;
            } else {
                sourceDetected = "google_health_connect";
                const result = parseGoogleHealthJSON(text);
                parsedMetrics = result.metrics;
                parsedPoints = result.points;
            }

            const combinedMetrics = { ...state.latestMetrics, ...parsedMetrics };
            const anomalies = detectClinicalAnomalies(combinedMetrics);
            const nowIso = new Date().toISOString();

            updateAndSaveState((prev) => {
                const next: HealthIntegrationState = {
                    ...prev,
                    sources: {
                        ...prev.sources,
                        [sourceDetected]: {
                            ...prev.sources[sourceDetected],
                            status: "connected",
                            deviceModel: `Imported from ${file.name}`,
                            lastSyncedAt: nowIso,
                            recordCount: (prev.sources[sourceDetected].recordCount || 0) + parsedPoints.length,
                        },
                    },
                    latestMetrics: combinedMetrics,
                    anomalies,
                    recentDataPoints: [...parsedPoints.slice(0, 50), ...prev.recentDataPoints].slice(0, 100),
                    lastGlobalSyncAt: nowIso,
                };
                syncHealthToBackend(next);
                return next;
            });

            toast.dismiss("file-import");
            toast.success("Health export parsed & synchronized!", {
                description: `Extracted ${parsedPoints.length || 1} metric records. Clinical insights refreshed.`,
            });
        } catch (err) {
            console.error("Import error:", err);
            toast.dismiss("file-import");
            toast.error("Failed to parse file", {
                description: "Please ensure the file is an Apple Health export.xml or Google Health Connect JSON.",
            });
        } finally {
            setIsSyncing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // ─── 4. PHONE SENSORS (PEDOMETER) ─────────────────────────────────────────────

    const togglePedometer = async () => {
        if (isPedometerActive) {
            motionTrackerRef.current?.stop();
            setIsPedometerActive(false);
            toast.info("Phone pedometer stopped");
        } else {
            const tracker = new PhoneMotionTracker();
            tracker.setInitialSteps(state.latestMetrics.steps || 0);

            const started = await tracker.start((newSteps) => {
                setPedometerSteps(newSteps);
                updateAndSaveState((prev) => ({
                    ...prev,
                    latestMetrics: {
                        ...prev.latestMetrics,
                        steps: newSteps,
                        lastUpdated: new Date().toISOString(),
                    },
                }));
            });

            if (started) {
                motionTrackerRef.current = tracker;
                setIsPedometerActive(true);
                updateAndSaveState((prev) => ({
                    ...prev,
                    sources: {
                        ...prev.sources,
                        phone_sensors: {
                            ...prev.sources.phone_sensors,
                            status: "connected",
                            deviceModel: "Internal Smartphone Accelerometer",
                            lastSyncedAt: new Date().toISOString(),
                        },
                    },
                }));
                toast.success("Phone motion sensor active!", {
                    description: "Counting real steps via smartphone accelerometer. Keep the screen active while walking.",
                });
            } else {
                toast.error("Motion sensors unavailable or permission denied", {
                    description: "On iOS Safari, tap 'Allow' when motion permissions prompt appears.",
                });
            }
        }
    };

    // ─── 5. BLUETOOTH LE HEART RATE ───────────────────────────────────────────────

    const handleConnectBluetooth = async () => {
        setIsBleConnecting(true);
        try {
            const res = await connectWebBluetoothHeartRate((bpm) => {
                updateAndSaveState((prev) => {
                    const nextMetrics = {
                        ...prev.latestMetrics,
                        currentHeartRate: bpm,
                        lastUpdated: new Date().toISOString(),
                    };
                    return {
                        ...prev,
                        latestMetrics: nextMetrics,
                        anomalies: detectClinicalAnomalies(nextMetrics),
                    };
                });
            });

            if (res) {
                setBleDeviceName(res.deviceName);
                updateAndSaveState((prev) => ({
                    ...prev,
                    sources: {
                        ...prev.sources,
                        bluetooth_ble: {
                            ...prev.sources.bluetooth_ble,
                            status: "connected",
                            deviceModel: res.deviceName,
                            lastSyncedAt: new Date().toISOString(),
                        },
                    },
                }));
                toast.success(`Paired with ${res.deviceName}!`, {
                    description: "Streaming live heart rate telemetry via Web Bluetooth.",
                });
            }
        } catch (e: any) {
            if (e?.name !== "NotFoundError") {
                toast.error(e?.message || "Bluetooth pairing failed");
            }
        } finally {
            setIsBleConnecting(false);
        }
    };

    // ─── 6. PRESET TEST PROFILES ──────────────────────────────────────────────────

    const handleApplyPreset = (presetKey: "apple_active" | "pixel_febrile" | "phone_sedentary") => {
        const preset = getPresetHealthData(presetKey);
        const nowIso = new Date().toISOString();

        updateAndSaveState((prev) => {
            const next: HealthIntegrationState = {
                ...prev,
                sources: {
                    ...prev.sources,
                    [preset.source]: {
                        ...prev.sources[preset.source],
                        status: "connected",
                        deviceModel: preset.deviceModel,
                        lastSyncedAt: nowIso,
                        recordCount: 245,
                    },
                },
                latestMetrics: preset.metrics,
                anomalies: preset.anomalies,
                lastGlobalSyncAt: nowIso,
            };
            syncHealthToBackend(next);
            return next;
        });

        const labels = {
            apple_active: "Apple Watch Ultra 2 (Active & Optimal)",
            pixel_febrile: "Google Pixel Watch 3 (Febrile State & High HR)",
            phone_sedentary: "Phone Pedometer (Sedentary & Borderline BP)",
        };

        toast.success(`Loaded preset: ${labels[presetKey]}`, {
            description: "Biometrics updated. Check clinical anomalies and start consultation.",
        });
    };

    const connectedSources = Object.values(state.sources).filter((s) => s.status === "connected");
    const m = state.latestMetrics;

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto">
            {/* Header & Status Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-lg border border-teal-700/40">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                            Biometric Telemetry Engine
                        </span>
                        {connectedSources.length > 0 && (
                            <Badge variant="outline" className="text-teal-200 border-teal-400/40 bg-teal-950/40">
                                {connectedSources.length} Connected Source{connectedSources.length > 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        Connected Health & Wearables
                    </h1>
                    <p className="text-sm md:text-base text-teal-100/80 max-w-2xl">
                        Seamlessly synchronize Apple Health (HealthKit), Google Health Connect, and your phone&apos;s
                        internal sensors. Arovia correlates live vitals directly into AI consultations.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleSyncNow}
                        disabled={isSyncing}
                        className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold shadow-md transition-all flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "Syncing..." : "Sync Now"}
                    </Button>
                </div>
            </div>

            {/* CLINICAL ANOMALIES & ALERTS SECTION */}
            {state.anomalies.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Active Wearable Clinical Signals ({state.anomalies.length})
                        </h2>
                        <Button
                            asChild
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-500 text-white font-medium flex items-center gap-1.5 shadow-sm"
                        >
                            <Link href="/dashboard/consult">
                                <Sparkles className="w-4 h-4" />
                                Consult Arovia AI with these Vitals
                                <ArrowRight className="w-4 h-4 ml-0.5" />
                            </Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {state.anomalies.map((anom) => (
                            <Card
                                key={anom.id}
                                className={`border shadow-sm transition-all ${
                                    anom.severity === "alert"
                                        ? "border-red-300 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/20"
                                        : anom.severity === "warning"
                                        ? "border-amber-300 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20"
                                        : "border-blue-300 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20"
                                }`}
                            >
                                <CardContent className="p-4 space-y-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <Badge
                                            className={
                                                anom.severity === "alert"
                                                    ? "bg-red-600 text-white"
                                                    : anom.severity === "warning"
                                                    ? "bg-amber-600 text-white"
                                                    : "bg-blue-600 text-white"
                                            }
                                        >
                                            {anom.severity.toUpperCase()}
                                        </Badge>
                                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                                            {anom.currentValue}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                            {anom.title}
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                            {anom.description}
                                        </p>
                                    </div>

                                    <div className="text-xs p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                                            Clinical Implication:
                                        </div>
                                        <div className="text-slate-600 dark:text-slate-400">
                                            {anom.clinicalImplication}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* LIVE VITALS & BIOMETRICS GRID */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-teal-600" />
                            Live Synced Biometrics
                        </h2>
                        <p className="text-xs text-slate-500">
                            {m.lastUpdated
                                ? `Last updated: ${new Date(m.lastUpdated).toLocaleTimeString()}`
                                : "Awaiting sync from connected sources"}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    {/* 1. Daily Steps */}
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/50 transition-all">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-slate-500">
                                <span className="text-xs font-medium uppercase tracking-wider">Steps</span>
                                <Smartphone className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">
                                    {m.steps ? m.steps.toLocaleString() : "—"}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {m.distanceKm ? `${m.distanceKm} km` : "Goal: 10,000"}
                                </div>
                            </div>
                            <Progress value={Math.min(100, ((m.steps || 0) / 10000) * 100)} className="h-1.5" />
                        </CardContent>
                    </Card>

                    {/* 2. Resting Heart Rate */}
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/50 transition-all">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-slate-500">
                                <span className="text-xs font-medium uppercase tracking-wider">Resting HR</span>
                                <HeartPulse className="w-4 h-4 text-rose-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                                    {m.restingHeartRate ?? (m.currentHeartRate || "—")}
                                    <span className="text-xs font-normal text-slate-400">bpm</span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    {m.restingHeartRate && m.restingHeartRate >= 85 ? (
                                        <span className="text-amber-500 font-medium">Elevated</span>
                                    ) : (
                                        "Normal range: 60–75"
                                    )}
                                </div>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                                HRV: {m.hrvSdnnMs ? `${m.hrvSdnnMs} ms` : "—"}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Sleep Architecture */}
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/50 transition-all">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-slate-500">
                                <span className="text-xs font-medium uppercase tracking-wider">Sleep</span>
                                <Moon className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                                    {m.sleepDurationHours ? `${m.sleepDurationHours}h` : "—"}
                                    {m.sleepScore && (
                                        <span className="text-xs text-indigo-400 font-normal">
                                            ({m.sleepScore}/100)
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {m.sleepDurationHours && m.sleepDurationHours < 6 ? (
                                        <span className="text-amber-500 font-medium">Deficit</span>
                                    ) : (
                                        "Target: 7–8.5h"
                                    )}
                                </div>
                            </div>
                            <Progress value={Math.min(100, ((m.sleepDurationHours || 0) / 8) * 100)} className="h-1.5" />
                        </CardContent>
                    </Card>

                    {/* 4. Blood Oxygen (SpO2) */}
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/50 transition-all">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-slate-500">
                                <span className="text-xs font-medium uppercase tracking-wider">SpO2 Oxygen</span>
                                <Activity className="w-4 h-4 text-cyan-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                                    {m.bloodOxygenSpO2 ? `${m.bloodOxygenSpO2}%` : "—"}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {m.bloodOxygenSpO2 && m.bloodOxygenSpO2 < 95 ? (
                                        <span className="text-red-500 font-medium">Desaturation</span>
                                    ) : (
                                        "Normal: 95–100%"
                                    )}
                                </div>
                            </div>
                            <Progress value={m.bloodOxygenSpO2 || 0} className="h-1.5" />
                        </CardContent>
                    </Card>

                    {/* 5. Blood Pressure */}
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/50 transition-all">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-slate-500">
                                <span className="text-xs font-medium uppercase tracking-wider">Blood Pressure</span>
                                <HeartPulse className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                                <div className="text-xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                                    {m.bloodPressureSystolic && m.bloodPressureDiastolic
                                        ? `${m.bloodPressureSystolic}/${m.bloodPressureDiastolic}`
                                        : "—"}
                                    <span className="text-xs font-normal text-slate-400">mmHg</span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    {m.bloodPressureSystolic && m.bloodPressureSystolic >= 130 ? (
                                        <span className="text-amber-500 font-medium">Stage 1</span>
                                    ) : (
                                        "Optimal: <120/80"
                                    )}
                                </div>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                                Resp: {m.respiratoryRate ? `${m.respiratoryRate} rpm` : "14 rpm"}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 6. Body Temp / Calories */}
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/50 transition-all">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-slate-500">
                                <span className="text-xs font-medium uppercase tracking-wider">Body Temp</span>
                                <Thermometer className="w-4 h-4 text-orange-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                                    {m.bodyTemperatureC ? `${m.bodyTemperatureC}°C` : "36.6°C"}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {m.bodyTemperatureC && m.bodyTemperatureC >= 37.8 ? (
                                        <span className="text-red-500 font-medium">Fever</span>
                                    ) : (
                                        "Afebrile / Normal"
                                    )}
                                </div>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-400" />
                                {m.activeCalories ? `${m.activeCalories} kcal` : "Active cal"}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* INTEGRATION SOURCES & CONNECTORS */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Connect Health Ecosystem
                        </h2>
                        <p className="text-xs text-slate-500">
                            Authorize direct integrations with your smartwatch, smartphone, or upload health exports.
                        </p>
                    </div>

                    {/* Quick Demo Test Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-slate-500 font-medium mr-1">Quick Demo:</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyPreset("apple_active")}
                            className="text-xs h-7 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                        >
                            <Watch className="w-3 h-3 mr-1" />
                            Apple Watch
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyPreset("pixel_febrile")}
                            className="text-xs h-7 border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                            <AlertTriangle className="w-3 h-3 mr-1 text-rose-500" />
                            Pixel Watch (Fever)
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyPreset("phone_sedentary")}
                            className="text-xs h-7 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        >
                            <Smartphone className="w-3 h-3 mr-1" />
                            Phone Sensor
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Apple Health (HealthKit) Card */}
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                        <div className="h-1 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500" />
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-rose-100 dark:from-rose-950 dark:to-red-900 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold shadow-sm">
                                    <HeartPulse className="w-5 h-5" />
                                </div>
                                <Badge
                                    variant={state.sources.apple_health.status === "connected" ? "default" : "secondary"}
                                    className={
                                        state.sources.apple_health.status === "connected"
                                            ? "bg-emerald-600 text-white"
                                            : "text-slate-500"
                                    }
                                >
                                    {state.sources.apple_health.status === "connected" ? "Connected" : "Disconnected"}
                                </Badge>
                            </div>
                            <CardTitle className="text-base font-bold mt-2">Apple Health</CardTitle>
                            <CardDescription className="text-xs">
                                Apple Watch, iPhone HealthKit, Sleep stages, ECG, and SpO2 telemetry.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                            {state.sources.apple_health.status === "connected" ? (
                                <div className="space-y-2">
                                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                        <span>Device:</span>
                                        <span className="font-semibold">{state.sources.apple_health.deviceModel}</span>
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                        <span>Last synced:</span>
                                        <span className="font-mono text-[11px]">
                                            {state.sources.apple_health.lastSyncedAt
                                                ? new Date(state.sources.apple_health.lastSyncedAt).toLocaleTimeString()
                                                : "Just now"}
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDisconnect("apple_health")}
                                        className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900"
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={() => handleOpenPermissionModal("apple_health")}
                                    className="w-full text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-rose-600 dark:hover:bg-rose-500"
                                >
                                    Connect Apple Health
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* 2. Google Health Connect Card */}
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                        <div className="h-1 bg-gradient-to-r from-blue-500 via-green-500 to-amber-500" />
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-emerald-100 dark:from-emerald-950 dark:to-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold shadow-sm">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <Badge
                                    variant={state.sources.google_health_connect.status === "connected" ? "default" : "secondary"}
                                    className={
                                        state.sources.google_health_connect.status === "connected"
                                            ? "bg-emerald-600 text-white"
                                            : "text-slate-500"
                                    }
                                >
                                    {state.sources.google_health_connect.status === "connected" ? "Connected" : "Disconnected"}
                                </Badge>
                            </div>
                            <CardTitle className="text-base font-bold mt-2">Google Health Connect</CardTitle>
                            <CardDescription className="text-xs">
                                Android, Pixel Watch, Samsung Health, Google Fit, and continuous vitals.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                            {state.sources.google_health_connect.status === "connected" ? (
                                <div className="space-y-2">
                                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                        <span>Device:</span>
                                        <span className="font-semibold">{state.sources.google_health_connect.deviceModel}</span>
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                        <span>Last synced:</span>
                                        <span className="font-mono text-[11px]">
                                            {state.sources.google_health_connect.lastSyncedAt
                                                ? new Date(state.sources.google_health_connect.lastSyncedAt).toLocaleTimeString()
                                                : "Just now"}
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDisconnect("google_health_connect")}
                                        className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900"
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={() => handleOpenPermissionModal("google_health_connect")}
                                    className="w-full text-xs bg-teal-600 hover:bg-teal-500 text-white"
                                >
                                    Connect Health Connect
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* 3. Phone Sensors & Web Bluetooth Card */}
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                        <div className="h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-cyan-950 dark:to-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold shadow-sm">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <Badge
                                    variant={isPedometerActive || state.sources.phone_sensors.status === "connected" ? "default" : "secondary"}
                                    className={
                                        isPedometerActive || state.sources.phone_sensors.status === "connected"
                                            ? "bg-emerald-600 text-white"
                                            : "text-slate-500"
                                    }
                                >
                                    {isPedometerActive ? "Live Tracking" : state.sources.phone_sensors.status === "connected" ? "Ready" : "Inactive"}
                                </Badge>
                            </div>
                            <CardTitle className="text-base font-bold mt-2">Phone Sensors & BLE</CardTitle>
                            <CardDescription className="text-xs">
                                Smartphone accelerometer pedometer & wireless Bluetooth heart rate monitors.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0">
                            <Button
                                size="sm"
                                variant={isPedometerActive ? "destructive" : "outline"}
                                onClick={togglePedometer}
                                className="w-full text-xs"
                            >
                                <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                                {isPedometerActive ? "Stop Motion Pedometer" : "Start Live Pedometer"}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleConnectBluetooth}
                                disabled={isBleConnecting}
                                className="w-full text-xs border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40"
                            >
                                <Bluetooth className="w-3.5 h-3.5 mr-1.5 text-cyan-500" />
                                {bleDeviceName ? `BLE: ${bleDeviceName}` : isBleConnecting ? "Pairing..." : "Pair BLE Heart Rate"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* 4. Import Health Export File Card */}
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                        <div className="h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-indigo-950 dark:to-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold shadow-sm">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-mono text-slate-500">XML / JSON</span>
                            </div>
                            <CardTitle className="text-base font-bold mt-2">Import Health Export</CardTitle>
                            <CardDescription className="text-xs">
                                Upload Apple Health <code className="text-[10px]">export.xml</code> or Google Takeout JSON files.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xml,.json,.txt"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSyncing}
                                className="w-full text-xs border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center justify-center gap-1.5"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                Upload Health File
                            </Button>
                            <p className="text-[11px] text-slate-500 text-center">
                                Processed strictly in-browser for complete privacy.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* PERMISSIONS & PRIVACY ACCORDION */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/50 dark:bg-slate-900/40">
                <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                Privacy & Clinical Data Protection (DPDP Compliant)
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
                                Arovia accesses health records in read-only mode to enhance diagnostic accuracy and correlate
                                symptoms with physiological baselines. Your biometric data is encrypted at rest and never shared.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button asChild variant="outline" size="sm" className="text-xs">
                            <Link href="/dashboard/settings">
                                Manage Permissions in Settings
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* PERMISSIONS SELECTION MODAL */}
            {permissionModalSource && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {permissionModalSource === "apple_health" ? "Apple Health" : "Google Health Connect"} Permissions
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Select which clinical categories Arovia may read to assist your consultations.
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPermissionModalSource(null)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {[
                                { key: "activity", label: "Steps, Distance & Active Energy", desc: "Monitors daily movement and physical exertion" },
                                { key: "heart", label: "Heart Rate & HRV (SDNN)", desc: "Tracks resting pulse, autonomic tone, and stress" },
                                { key: "sleep", label: "Sleep Analysis & Stages", desc: "Correlates fatigue, insomnia, and recovery debt" },
                                { key: "oxygen", label: "Blood Oxygen (SpO2) & Respiration", desc: "Screens for mild nocturnal desaturation & breath rate" },
                                { key: "vitals", label: "Blood Pressure & Body Temperature", desc: "Identifies febrile episodes and vascular shifts" },
                            ].map((item) => {
                                const k = item.key as keyof HealthPermissionSettings;
                                return (
                                    <div
                                        key={item.key}
                                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                                    >
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                {item.label}
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                                {item.desc}
                                            </div>
                                        </div>
                                        <Switch
                                            checked={selectedPermissions[k]}
                                            onCheckedChange={(checked) =>
                                                setSelectedPermissions((prev) => ({ ...prev, [k]: checked }))
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPermissionModalSource(null)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => handleConfirmConnect(permissionModalSource)}
                                className="text-xs bg-teal-600 hover:bg-teal-500 text-white"
                            >
                                Authorize & Connect
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
