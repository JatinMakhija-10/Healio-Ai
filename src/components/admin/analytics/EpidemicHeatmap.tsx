"use client";

import React, { useEffect, useState } from "react";
import { Chart } from "react-google-charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Map as MapIcon, Info } from "lucide-react";

interface HeatmapData {
    id: string;
    state: string;
    cases: number;
    riskLevel: string;
}

export function EpidemicHeatmap() {
    const [data, setData] = useState<any[][]>([["State", "Users"]]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/analytics/epidemic');
                if (!response.ok) {
                    throw new Error('Failed to fetch epidemic data');
                }
                const realData: HeatmapData[] = await response.json();

                if (Array.isArray(realData) && realData.length > 0) {
                    // Google Charts expects [["State", "Value"], ["IN-MH", 500]] format
                    // But names also work well for India with resolution 'provinces'
                    const chartData: (string | number)[][] = [["State", "Users"]];
                    realData.forEach(item => {
                        // Google Charts works best with "IN-MH" codes or full names "Maharashtra"
                        // Since we have full names in DB, we'll try to use them directly or prefix if needed.
                        // For India GeoChart, full names usually work if they match ISO/standard names.
                        chartData.push([item.state, item.cases]);
                    });
                    setData(chartData);
                } else {
                    setData([["State", "Users"]]);
                }
            } catch (error) {
                console.error('Error loading heatmap data:', error);
                setData([["State", "Users"]]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const options = {
        region: "IN", // India
        domain: "IN",
        displayMode: "regions",
        resolution: "provinces",
        colorAxis: { colors: ["#ffedea", "#ff5533", "#782618"] }, // Gradient from light to dark red
        backgroundColor: "transparent",
        datalessRegionColor: "#EAEAEC",
        defaultColor: "#f5f5f5",
        legend: { textStyle: { color: 'blue', fontSize: 16 } },
        tooltip: { isHtml: true }, // Use standard tooltips
        keepAspectRatio: true,
    };

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
                            Real-time regional tracking of registered users and potential clusters.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">Critical: &gt;50</Badge>
                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">High: 20-50</Badge>
                        <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">Mod: 10-20</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 relative bg-slate-50/50 rounded-b-xl overflow-hidden p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                        <p>Loading geospatial data...</p>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center relative">
                        <Chart
                            chartType="GeoChart"
                            width="100%"
                            height="100%"
                            data={data.length > 1 ? data : [["State", "Users"], ["Empty", 0]]}
                            options={options}
                            chartEvents={[
                                {
                                    eventName: "select",
                                    callback: ({ chartWrapper }) => {
                                        const chart = chartWrapper?.getChart();
                                        const selection = chart?.getSelection();
                                        if (!selection || selection.length === 0) return;
                                        // Handle click if needed
                                    },
                                },
                            ]}
                        />

                        {data.length <= 1 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <p className="text-slate-400">No data available to display</p>
                            </div>
                        )}

                        <div className="absolute bottom-4 right-4 bg-white/90 p-4 rounded-lg shadow-lg backdrop-blur-sm border text-sm max-w-xs z-10 pointer-events-none">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Info className="h-4 w-4 text-purple-500" />
                                Insight
                            </h4>
                            <p className="text-slate-600">
                                Density mapping based on registered user locations.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
