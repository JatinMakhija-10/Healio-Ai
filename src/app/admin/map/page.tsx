"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle, MapPin, RefreshCw, TrendingUp, TrendingDown,
    Minus, X, Activity, Shield, Radar, Eye, EyeOff, MessageSquare,
} from "lucide-react";

// India states GeoJSON — shows state boundaries
const INDIA_GEO =
    "https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DiseaseInfo {
    name: string;
    count: number;
    cases48h: number;
    trend: "up" | "down" | "stable";
}

interface OutbreakPoint {
    city: string;
    state: string;
    lat: number;
    lng: number;
    topDisease: string;
    diseases: DiseaseInfo[];
    totalCases: number;
    cases48h: number;
    cases7d: number;
    baseline28dAvg: number;
    outbreakScore: "HIGH" | "MODERATE" | "LOW";
    outbreakRatio: number;
    weekCount: number;
    trendDirection: "rising" | "falling" | "stable";
    latest: string;
}

interface OutbreakAlert {
    city: string;
    state: string;
    disease: string;
    score: string;
    ratio: number;
    cases48h: number;
    message: string;
}

interface MapData {
    points: OutbreakPoint[];
    totalClusters: number;
    highAlertZones: number;
    moderateAlertZones: number;
    totalCases48h: number;
    totalCases7d: number;
    topCondition: string;
    alerts: OutbreakAlert[];
    lastProcessed: string;
    privacyInfo: {
        kAnonymityThreshold: number;
        dpNoiseApplied: boolean;
        dpNoiseThreshold: number;
    };
}

// ── Visual constants ──────────────────────────────────────────────────────────
const SCORE_COLORS: Record<string, { bg: string; glow: string; ring: string }> = {
    HIGH:     { bg: "#ef4444", glow: "rgba(239,68,68,0.3)",  ring: "rgba(239,68,68,0.15)" },
    MODERATE: { bg: "#f59e0b", glow: "rgba(245,158,11,0.3)", ring: "rgba(245,158,11,0.15)" },
    LOW:      { bg: "#22c55e", glow: "rgba(34,197,94,0.3)",  ring: "rgba(34,197,94,0.15)" },
};

const TREND_ICON: Record<string, typeof Minus> = {
    rising: TrendingUp, falling: TrendingDown, stable: Minus,
    up: TrendingUp, down: TrendingDown,
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function OutbreakMapPage() {
    const [data, setData] = useState<MapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [selected, setSelected] = useState<OutbreakPoint | null>(null);
    const [severityFilter, setSeverityFilter] = useState<Set<string>>(
        new Set(["HIGH", "MODERATE", "LOW"]),
    );
    const [showPrivacy, setShowPrivacy] = useState(false);

    // ── Data fetching ─────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/outbreak-map");
            const json = await res.json();
            if (json.success) {
                setData(json.data);
                setLastUpdated(new Date());
            }
        } catch (e) {
            console.error("Outbreak map fetch failed", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60_000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const filteredPoints = useMemo(() => {
        if (!data) return [];
        return data.points.filter(p => severityFilter.has(p.outbreakScore));
    }, [data, severityFilter]);

    const toggleFilter = (level: string) => {
        setSeverityFilter(prev => {
            const next = new Set(prev);
            if (next.has(level)) next.delete(level);
            else next.add(level);
            return next;
        });
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* ── Alert Banner ──────────────────────────────────────────────── */}
            {data && data.alerts.length > 0 && (
                <div className="bg-red-600 text-white rounded-xl px-4 py-3 flex items-center gap-3 overflow-hidden">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="font-bold text-sm uppercase tracking-wide">
                            Active Alerts
                        </span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex gap-8 animate-marquee whitespace-nowrap text-sm">
                            {data.alerts.map((alert, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    {alert.message}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-red-600 font-medium mb-1">
                        <Radar className="h-4 w-4" />
                        <span>Epidemiological Surveillance</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 ml-1">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs font-medium text-red-700">Live</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Outbreak Radar Map
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Real-time disease cluster detection with outbreak scoring — auto-refreshes every 60 s
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPrivacy(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm transition"
                    >
                        <Shield className="h-3.5 w-3.5" />
                        Privacy
                    </button>
                    <span className="text-xs text-slate-400">
                        {lastUpdated.toLocaleTimeString()}
                    </span>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── Privacy Notice ─────────────────────────────────────────────── */}
            {showPrivacy && data?.privacyInfo && (
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                            <div className="text-sm text-blue-800 space-y-1">
                                <p className="font-semibold">Privacy &amp; Ethical Guardrails</p>
                                <ul className="list-disc list-inside text-blue-700 space-y-0.5 text-xs">
                                    <li>k-anonymity: clusters with &lt;{data.privacyInfo.kAnonymityThreshold} cases are hidden</li>
                                    <li>Differential privacy noise (±2) applied to counts under {data.privacyInfo.dpNoiseThreshold}</li>
                                    <li>Only geo-hashed locations stored — no GPS or addresses</li>
                                    <li>No individual session data linked to outbreak clusters</li>
                                    <li>DPDPA 2023 compliant data handling</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Stat Cards ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={MapPin} label="Active Clusters" value={data?.totalClusters} color="slate" />
                <StatCard
                    icon={AlertTriangle}
                    label="High Alert Zones"
                    value={data?.highAlertZones}
                    sub={data?.moderateAlertZones ? `+${data.moderateAlertZones} moderate` : undefined}
                    color="red"
                />
                <StatCard
                    icon={Activity}
                    label="Cases (48 h)"
                    value={data?.totalCases48h}
                    sub={data ? `7 d: ${data.totalCases7d}` : undefined}
                    color="blue"
                />
                <StatCard icon={TrendingUp} label="Top Condition" value={data?.topCondition} color="purple" />
            </div>

            {/* ── Map + Detail Panel ────────────────────────────────────────── */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Map */}
                <div className={selected ? "lg:col-span-2" : "lg:col-span-3"}>
                    <Card className="overflow-hidden">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <CardTitle className="flex items-center gap-2">
                                    <Radar className="h-5 w-5 text-red-500" />
                                    Disease Cluster Map — India
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    {(["HIGH", "MODERATE", "LOW"] as const).map(level => (
                                        <button
                                            key={level}
                                            onClick={() => toggleFilter(level)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition border ${
                                                severityFilter.has(level)
                                                    ? "border-transparent text-white"
                                                    : "border-slate-200 text-slate-400 bg-white"
                                            }`}
                                            style={
                                                severityFilter.has(level)
                                                    ? { background: SCORE_COLORS[level].bg }
                                                    : {}
                                            }
                                        >
                                            {severityFilter.has(level) ? (
                                                <Eye className="h-3 w-3" />
                                            ) : (
                                                <EyeOff className="h-3 w-3" />
                                            )}
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="relative p-0 overflow-hidden rounded-b-xl bg-slate-900">
                            {loading ? (
                                <div className="h-[520px] flex items-center justify-center text-slate-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <Radar className="h-8 w-8 animate-spin" />
                                        <p>Scanning for outbreak clusters…</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative h-[520px]">
                                    <ComposableMap
                                        projection="geoMercator"
                                        projectionConfig={{ center: [82, 22], scale: 1000 }}
                                        style={{ width: "100%", height: "100%" }}
                                    >
                                        {/* India state boundaries */}
                                        <Geographies geography={INDIA_GEO}>
                                            {({ geographies }) =>
                                                geographies.map(geo => (
                                                    <Geography
                                                        key={geo.rsmKey}
                                                        geography={geo}
                                                        fill="#1e293b"
                                                        stroke="#334155"
                                                        strokeWidth={0.5}
                                                        style={{
                                                            default: { outline: "none" },
                                                            hover:   { fill: "#273548", outline: "none", cursor: "default" },
                                                            pressed: { outline: "none" },
                                                        }}
                                                    />
                                                ))
                                            }
                                        </Geographies>

                                        {/* Outbreak markers */}
                                        {filteredPoints.map(point => {
                                            const colors = SCORE_COLORS[point.outbreakScore];
                                            const isSelected = selected?.city === point.city;
                                            const baseR = Math.min(4 + point.totalCases * 0.6, 14);

                                            return (
                                                <Marker key={point.city} coordinates={[point.lng, point.lat]}>
                                                    {/* Outer glow — pulsing for non-LOW */}
                                                    <circle
                                                        r={baseR * 2.2}
                                                        fill={colors.ring}
                                                        className={point.outbreakScore !== "LOW" ? "animate-pulse" : ""}
                                                    />
                                                    {/* Mid ring */}
                                                    <circle r={baseR * 1.5} fill={colors.glow} />
                                                    {/* Core dot */}
                                                    <circle
                                                        r={baseR}
                                                        fill={colors.bg}
                                                        fillOpacity={0.9}
                                                        stroke={isSelected ? "#fff" : "rgba(255,255,255,0.4)"}
                                                        strokeWidth={isSelected ? 2 : 0.8}
                                                    />
                                                    {/* Invisible hit area */}
                                                    <circle
                                                        r={baseR * 2.5}
                                                        fill="transparent"
                                                        style={{ cursor: "pointer" }}
                                                        onClick={() =>
                                                            setSelected(selected?.city === point.city ? null : point)
                                                        }
                                                    />
                                                    {/* City label for HIGH alerts */}
                                                    {point.outbreakScore === "HIGH" && (
                                                        <text
                                                            textAnchor="middle"
                                                            y={-baseR * 2.5 - 4}
                                                            fill="#fff"
                                                            fontSize={8}
                                                            fontWeight={600}
                                                            style={{
                                                                pointerEvents: "none",
                                                                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                                                            }}
                                                        >
                                                            {point.city}
                                                        </text>
                                                    )}
                                                </Marker>
                                            );
                                        })}
                                    </ComposableMap>

                                    {/* Map legend */}
                                    <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur rounded-lg p-3 text-xs text-slate-300 space-y-1.5">
                                        <p className="font-semibold text-white text-[11px]">Outbreak Score</p>
                                        {(["HIGH", "MODERATE", "LOW"] as const).map(level => (
                                            <div key={level} className="flex items-center gap-2">
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ background: SCORE_COLORS[level].bg }}
                                                />
                                                <span>
                                                    {level} (
                                                    {level === "HIGH"
                                                        ? ">2.5×"
                                                        : level === "MODERATE"
                                                          ? "1.5–2.5×"
                                                          : "<1.5×"}{" "}
                                                    baseline)
                                                </span>
                                            </div>
                                        ))}
                                        <p className="text-slate-500 text-[10px] pt-1">
                                            Click a cluster for details
                                        </p>
                                    </div>

                                    {/* Empty state */}
                                    {filteredPoints.length === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                                            <div className="text-center text-slate-400">
                                                <Shield className="h-10 w-10 mx-auto mb-2" />
                                                <p className="font-medium">No outbreak clusters detected</p>
                                                <p className="text-sm text-slate-500">
                                                    Check filter settings or wait for data
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Detail Panel ──────────────────────────────────────────── */}
                {selected && (
                    <div className="lg:col-span-1">
                        <Card
                            className="sticky top-6 border-l-4"
                            style={{ borderLeftColor: SCORE_COLORS[selected.outbreakScore].bg }}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <Badge
                                            className="text-[10px] mb-2 text-white border-0"
                                            style={{ background: SCORE_COLORS[selected.outbreakScore].bg }}
                                        >
                                            {selected.outbreakScore} ALERT
                                        </Badge>
                                        <CardTitle className="text-xl">{selected.city}</CardTitle>
                                        <p className="text-sm text-slate-500">{selected.state}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelected(null)}
                                        className="p-1 rounded hover:bg-slate-100 transition"
                                    >
                                        <X className="h-4 w-4 text-slate-400" />
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Key metrics grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <MiniMetric
                                        label="Outbreak Ratio"
                                        value={`${selected.outbreakRatio}×`}
                                        sub="vs 28 d baseline"
                                        valueColor={SCORE_COLORS[selected.outbreakScore].bg}
                                    />
                                    <MiniMetric
                                        label="48 h Cases"
                                        value={String(selected.cases48h)}
                                        sub={`baseline avg: ${selected.baseline28dAvg}`}
                                    />
                                    <MiniMetric label="7-Day Total" value={String(selected.cases7d)} />
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                                            Trend
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {(() => {
                                                const Icon = TREND_ICON[selected.trendDirection] || Minus;
                                                const c =
                                                    selected.trendDirection === "rising"
                                                        ? "text-red-600"
                                                        : selected.trendDirection === "falling"
                                                          ? "text-green-600"
                                                          : "text-slate-500";
                                                return (
                                                    <>
                                                        <Icon className={`h-5 w-5 ${c}`} />
                                                        <span className={`text-sm font-semibold capitalize ${c}`}>
                                                            {selected.trendDirection}
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* Disease breakdown */}
                                <div>
                                    <p className="text-xs font-semibold text-slate-700 mb-2">
                                        Disease Breakdown
                                    </p>
                                    <div className="space-y-2">
                                        {selected.diseases.map((d, i) => {
                                            const Icon = TREND_ICON[d.trend] || Minus;
                                            const max = selected.diseases[0]?.count || 1;
                                            const pct = Math.round((d.count / max) * 100);
                                            return (
                                                <div key={i} className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-medium text-slate-800 truncate max-w-[140px]">
                                                            {d.name}
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-slate-600">{d.count}</span>
                                                            <Icon
                                                                className={`h-3 w-3 ${
                                                                    d.trend === "up"
                                                                        ? "text-red-500"
                                                                        : d.trend === "down"
                                                                          ? "text-green-500"
                                                                          : "text-slate-400"
                                                                }`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all"
                                                            style={{
                                                                width: `${pct}%`,
                                                                background:
                                                                    SCORE_COLORS[selected.outbreakScore].bg,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Ask about this outbreak */}
                                <Button
                                    className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                                    onClick={() => {
                                        const q = encodeURIComponent(
                                            `What remedies work for ${selected.topDisease} in ${selected.city}?`,
                                        );
                                        window.open(`/chat?q=${q}`, "_blank");
                                    }}
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    Ask About This Outbreak
                                </Button>
                                <p className="text-[10px] text-slate-400 text-center">
                                    Opens chatbot with pre-loaded context
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* ── Hot Zones Table ────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            🔥 Hot Zones — Ranked by Outbreak Score
                        </CardTitle>
                        <p className="text-xs text-slate-400">
                            Ratio = 48 h cases ÷ 28-day baseline avg
                        </p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-slate-500 text-xs uppercase tracking-wide">
                                    <th className="pb-3 pr-4">#</th>
                                    <th className="pb-3 pr-4">City</th>
                                    <th className="pb-3 pr-4">Top Disease</th>
                                    <th className="pb-3 pr-4">48 h</th>
                                    <th className="pb-3 pr-4">Baseline</th>
                                    <th className="pb-3 pr-4">Ratio</th>
                                    <th className="pb-3 pr-4">7 d</th>
                                    <th className="pb-3 pr-4">Trend</th>
                                    <th className="pb-3">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.points || []).slice(0, 15).map((point, i) => {
                                    const TIcon = TREND_ICON[point.trendDirection] || Minus;
                                    return (
                                        <tr
                                            key={point.city}
                                            className="border-b last:border-0 hover:bg-slate-50 cursor-pointer transition"
                                            onClick={() => setSelected(point)}
                                        >
                                            <td className="py-3 pr-4 font-bold text-slate-400">
                                                #{i + 1}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            {point.city}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {point.state}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 pr-4 text-slate-600">
                                                {point.topDisease}
                                            </td>
                                            <td className="py-3 pr-4 font-semibold">{point.cases48h}</td>
                                            <td className="py-3 pr-4 text-slate-500">
                                                {point.baseline28dAvg}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span
                                                    className="font-bold"
                                                    style={{
                                                        color: SCORE_COLORS[point.outbreakScore].bg,
                                                    }}
                                                >
                                                    {point.outbreakRatio}×
                                                </span>
                                            </td>
                                            <td className="py-3 pr-4 text-blue-600 font-medium">
                                                {point.weekCount}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <TIcon
                                                    className={`h-4 w-4 ${
                                                        point.trendDirection === "rising"
                                                            ? "text-red-500"
                                                            : point.trendDirection === "falling"
                                                              ? "text-green-500"
                                                              : "text-slate-400"
                                                    }`}
                                                />
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                                                    style={{
                                                        background: SCORE_COLORS[point.outbreakScore].bg,
                                                    }}
                                                >
                                                    {point.outbreakScore}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {(!data || data.points.length === 0) && (
                            <div className="flex flex-col items-center text-slate-400 py-8">
                                <Shield className="h-10 w-10 mb-2 text-green-400" />
                                <p className="font-medium text-green-600">All Clear</p>
                                <p className="text-sm">
                                    No outbreak clusters detected (k≥5 threshold applied)
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ── Helper components ─────────────────────────────────────────────────────────
function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    color,
}: {
    icon: typeof MapPin;
    label: string;
    value: string | number | undefined | null;
    sub?: string;
    color: "slate" | "red" | "blue" | "purple";
}) {
    const palette: Record<string, string> = {
        slate:  "border-slate-200 bg-white",
        red:    "border-red-200 bg-red-50/50",
        blue:   "border-blue-200 bg-blue-50/50",
        purple: "border-purple-200 bg-purple-50/50",
    };
    const iconPalette: Record<string, string> = {
        slate:  "bg-slate-100 text-slate-600",
        red:    "bg-red-100 text-red-600",
        blue:   "bg-blue-100 text-blue-600",
        purple: "bg-purple-100 text-purple-600",
    };
    const textPalette: Record<string, string> = {
        slate: "text-slate-900", red: "text-red-800", blue: "text-blue-800", purple: "text-purple-800",
    };

    return (
        <Card className={palette[color]}>
            <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconPalette[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className={`text-xl font-bold truncate ${textPalette[color]}`}>
                        {value ?? "—"}
                    </p>
                    {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function MiniMetric({
    label,
    value,
    sub,
    valueColor,
}: {
    label: string;
    value: string;
    sub?: string;
    valueColor?: string;
}) {
    return (
        <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold" style={valueColor ? { color: valueColor } : undefined}>
                {value}
            </p>
            {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
        </div>
    );
}
