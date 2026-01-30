"use client";

import React, { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleQuantile } from "d3-scale";
import { Tooltip } from "react-tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Map as MapIcon, Info } from "lucide-react";

// India TopoJSON URL - Highcharts CDN is reliable and supports CORS
const INDIA_TOPO_JSON = "https://code.highcharts.com/mapdata/countries/in/in-all.topo.json";

interface HeatmapData {
    id: string; // State code or name match
    state: string;
    cases: number;
    riskLevel: string; // 'Low', 'Moderate', 'High', 'Critical'
}

// Mock Data for demonstration
const MOCK_DATA: HeatmapData[] = [
    { id: "MH", state: "Maharashtra", cases: 2453, riskLevel: "Critical" },
    { id: "DL", state: "NCT of Delhi", cases: 1890, riskLevel: "High" }, // Updated name for Highcharts matching
    { id: "KL", state: "Kerala", cases: 1200, riskLevel: "Moderate" },
    { id: "KA", state: "Karnataka", cases: 1600, riskLevel: "High" },
    { id: "TN", state: "Tamil Nadu", cases: 900, riskLevel: "Moderate" },
    { id: "UP", state: "Uttar Pradesh", cases: 400, riskLevel: "Low" },
    { id: "GJ", state: "Gujarat", cases: 750, riskLevel: "Moderate" },
    { id: "WB", state: "West Bengal", cases: 1100, riskLevel: "High" },
];

export function EpidemicHeatmap() {
    const [data, setData] = useState<HeatmapData[]>([]);
    const [loading, setLoading] = useState(true);
    const [tooltipContent, setTooltipContent] = useState("");

    useEffect(() => {
        // Simulate API fetch delay
        setTimeout(() => {
            setData(MOCK_DATA);
            setLoading(false);
        }, 1000);
    }, []);

    const colorScale = scaleQuantile<string>()
        .domain(data.map(d => d.cases))
        .range([
            "#ffedea",
            "#ffcec5",
            "#ffad9f",
            "#ff8a75",
            "#ff5533",
            "#e2492d",
            "#be3d26",
            "#9a311f",
            "#782618"
        ]);

    return (
        <Card className="w-full h-full min-h-[600px] flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <MapIcon className="h-5 w-5 text-purple-500" />
                            Epidemic Intensity Map
                        </CardTitle>
                        <CardDescription>
                            Real-time regional tracking of disease outbreaks and symptom clusters.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">Critical: &gt;2000</Badge>
                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">High: 1000-2000</Badge>
                        <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">Mod: 500-1000</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 relative bg-slate-50/50 rounded-b-xl overflow-hidden p-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                        <p>Loading geospatial data...</p>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center relative">
                        <ComposableMap
                            projection="geoMercator"
                            projectionConfig={{
                                scale: 1000,
                                center: [80, 22] // Adjusted center for India
                            }}
                            className="w-full h-full max-w-4xl"
                            style={{ maxWidth: "100%", maxHeight: "100%" }}
                        >
                            <ZoomableGroup zoom={1} center={[80, 22]}>
                                <Geographies geography={INDIA_TOPO_JSON}>
                                    {({ geographies }) =>
                                        geographies.map((geo) => {
                                            // Handle Highcharts TopoJSON format
                                            const stateName = geo.properties.name || geo.properties['name'] || "Unknown";

                                            // Matching logic
                                            const cur = data.find(s =>
                                                stateName === s.state ||
                                                s.state.includes(stateName) ||
                                                stateName.includes(s.state)
                                            );

                                            return (
                                                <Geography
                                                    key={geo.rsmKey}
                                                    geography={geo}
                                                    fill={cur ? colorScale(cur.cases) : "#EAEAEC"}
                                                    stroke="#FFF"
                                                    strokeWidth={0.5}
                                                    style={{
                                                        default: { outline: "none" },
                                                        hover: { fill: "#db2777", outline: "none", cursor: "pointer" },
                                                        pressed: { outline: "none" }
                                                    }}
                                                    onMouseEnter={() => {
                                                        const count = cur ? cur.cases : 0;
                                                        const risk = cur ? cur.riskLevel : 'Low';
                                                        setTooltipContent(`${stateName}: ${count} Active Cases (${risk})`);
                                                    }}
                                                    onMouseLeave={() => {
                                                        setTooltipContent("");
                                                    }}
                                                    data-tooltip-id="map-tooltip"
                                                    data-tooltip-content={tooltipContent}
                                                />
                                            );
                                        })
                                    }
                                </Geographies>
                            </ZoomableGroup>
                        </ComposableMap>

                        <Tooltip id="map-tooltip" />

                        <div className="absolute bottom-4 right-4 bg-white/90 p-4 rounded-lg shadow-lg backdrop-blur-sm border text-sm max-w-xs z-10">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Info className="h-4 w-4 text-purple-500" />
                                Insight
                            </h4>
                            <p className="text-slate-600">
                                <span className="font-medium text-slate-900">Maharashtra</span> represents the highest concentration of reported symptoms this week. Recommend prioritizing resource allocation.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
