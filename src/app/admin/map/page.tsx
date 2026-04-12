"use client";

import { useEffect, useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, RefreshCw, TrendingUp } from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface OutbreakPoint {
    city: string;
    lat: number;
    lng: number;
    disease: string;
    count: number;
    alertLevel: "low" | "medium" | "high";
    latest: string;
    weekCount: number;
}

interface MapData {
    points: OutbreakPoint[];
    totalClusters: number;
    highAlertZones: number;
}

const ALERT_COLORS = {
    low:    "#22c55e",
    medium: "#f59e0b",
    high:   "#ef4444",
};

export default function OutbreakMapPage() {
    const [data, setData] = useState<MapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [tooltip, setTooltip] = useState<OutbreakPoint | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-red-600 font-medium mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Epidemiological Surveillance</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Pandemic Outbreak Radar</h1>
                    <p className="text-slate-500 mt-1">
                        Real-time disease cluster detection across India — auto-refreshes every 60s
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-400">Last updated: {lastUpdated.toLocaleTimeString()}</div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm transition"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Alert Summary */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-green-600 font-medium">Active Clusters</p>
                            <p className="text-2xl font-bold text-green-800">{data?.totalClusters ?? "—"}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-amber-600 font-medium">High Alert Zones</p>
                            <p className="text-2xl font-bold text-amber-800">{data?.highAlertZones ?? "—"}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Cases This Week</p>
                            <p className="text-2xl font-bold text-blue-800">
                                {data ? data.points.reduce((s, p) => s + p.weekCount, 0) : "—"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Map */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Disease Cluster Map — India</CardTitle>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-green-500" /> Low (&lt;5 cases)
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-amber-500" /> Medium (5–9)
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500" /> High (10+)
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="relative p-0 overflow-hidden rounded-b-xl bg-slate-900">
                    {loading ? (
                        <div className="h-96 flex items-center justify-center text-slate-400">
                            Loading map data...
                        </div>
                    ) : (
                        <div className="relative">
                            <ComposableMap
                                projection="geoMercator"
                                style={{ width: "100%", height: "500px" }}
                            >
                                <ZoomableGroup center={[82, 22]} zoom={4.2}>
                                    <Geographies geography={GEO_URL}>
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
                                                        hover:   { fill: "#334155", outline: "none" },
                                                    }}
                                                />
                                            ))
                                        }
                                    </Geographies>
                                    {(data?.points || []).map(point => (
                                        <Marker
                                            key={point.city}
                                            coordinates={[point.lng, point.lat]}
                                        >
                                            {/* Glow ring */}
                                            <circle
                                                r={Math.min(6 + point.count * 1.5, 22)}
                                                fill={ALERT_COLORS[point.alertLevel]}
                                                fillOpacity={0.15}
                                                className="animate-pulse"
                                            />
                                            {/* Core dot */}
                                            <circle
                                                r={Math.min(3 + point.count * 0.8, 12)}
                                                fill={ALERT_COLORS[point.alertLevel]}
                                                fillOpacity={0.9}
                                                stroke="#fff"
                                                strokeWidth={0.8}
                                                style={{ cursor: "pointer" }}
                                            />
                                            {/* Invisible hit area for tooltip */}
                                            <circle
                                                r={Math.min(6 + point.count * 1.5, 22)}
                                                fill="transparent"
                                                style={{ cursor: "pointer" }}
                                                onMouseEnter={(e: React.MouseEvent<SVGCircleElement>) => {
                                                    setTooltip(point);
                                                    setTooltipPos({ x: e.clientX, y: e.clientY });
                                                }}
                                                onMouseLeave={() => setTooltip(null)}
                                            />
                                        </Marker>
                                    ))}
                                </ZoomableGroup>
                            </ComposableMap>

                            {/* Tooltip */}
                            {tooltip && (
                                <div
                                    className="fixed z-50 pointer-events-none bg-slate-800 text-white text-xs rounded-lg shadow-xl p-3 min-w-[160px]"
                                    style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 60 }}
                                >
                                    <p className="font-bold text-sm">{tooltip.city}</p>
                                    <p className="text-slate-300 mt-0.5">{tooltip.disease}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span>{tooltip.count} total cases</span>
                                        <Badge
                                            className="text-[10px] h-4"
                                            style={{ background: ALERT_COLORS[tooltip.alertLevel] }}
                                        >
                                            {tooltip.alertLevel.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <p className="text-slate-400 mt-1">7-day: {tooltip.weekCount} cases</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Hot Zones Table */}
            <Card>
                <CardHeader>
                    <CardTitle>🔥 Hot Zones Ranked</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-slate-500">
                                    <th className="pb-3 pr-4">Rank</th>
                                    <th className="pb-3 pr-4">City</th>
                                    <th className="pb-3 pr-4">Top Disease</th>
                                    <th className="pb-3 pr-4">Total Cases</th>
                                    <th className="pb-3 pr-4">7-Day Cases</th>
                                    <th className="pb-3">Alert Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.points || []).slice(0, 10).map((point, i) => (
                                    <tr key={point.city} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="py-3 pr-4 font-bold text-slate-400">#{i + 1}</td>
                                        <td className="py-3 pr-4 font-medium text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                {point.city}
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4 text-slate-600">{point.disease}</td>
                                        <td className="py-3 pr-4 font-semibold">{point.count}</td>
                                        <td className="py-3 pr-4 text-blue-600">{point.weekCount}</td>
                                        <td className="py-3">
                                            <span
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                                                style={{ background: ALERT_COLORS[point.alertLevel] }}
                                            >
                                                {point.alertLevel.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(!data || data.points.length === 0) && (
                            <div className="text-center text-slate-400 py-8">No outbreak clusters detected yet.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
