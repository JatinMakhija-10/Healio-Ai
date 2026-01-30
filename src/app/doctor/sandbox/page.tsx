"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Beaker,
    GitBranch,
    Brain,
    ArrowRight,
    Loader2,
    Microscope,
    AlertCircle,
    BookOpen
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ClinicalSandboxPage() {
    const [query, setQuery] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null); // Mock result
    const [confidenceThreshold, setConfidenceThreshold] = useState([50]);

    const handleSimulate = async () => {
        if (!query) return;
        setAnalyzing(true);

        // Mock API latency
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock response
        setResult({
            topMatch: "Hypothyroidism",
            confidence: 82,
            differentials: [
                { name: "Anemia", confidence: 45, reason: "Fatigue overlap, but lacks cold intolerance" },
                { name: "Depression", confidence: 30, reason: "Mood symptoms match, but physical signs differ" },
                { name: "Chronic Fatigue Syndrome", confidence: 15, reason: "Exclusionary diagnosis" }
            ],
            suggestedLabs: ["TSH", "Free T4", "CBC", "Ferritin"],
            ayurvedicPerspective: {
                dosha: "Kapha-Vata",
                explanation: "Slow metabolism (Kapha) combined with dry skin/fatigue (Vata)"
            }
        });
        setAnalyzing(false);
    };

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Beaker className="h-8 w-8 text-purple-600" />
                        Clinical Sandbox
                    </h1>
                    <p className="text-slate-500">
                        Test diagnostic hypotheses and explore differentials with AI assistance.
                    </p>
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1.5 px-3 py-1">
                    <Microscope className="h-3.5 w-3.5" />
                    Healio Pro Feature
                </Badge>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Input Panel */}
                <Card className="flex flex-col lg:col-span-1 border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b shrink-0">
                        <CardTitle className="text-lg">Case Parameters</CardTitle>
                        <CardDescription>Enter symptoms, vitals, or observation notes</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 flex flex-col gap-4">
                        <div className="flex-1 relative">
                            <textarea
                                className="w-full h-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 font-mono text-sm leading-relaxed"
                                placeholder="e.g. 35F presenting with fatigue, weight gain despite low appetite, and dry skin. Reports feeling cold often. BPM 62, BP 110/70..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <div className="absolute bottom-4 right-4 text-xs text-slate-400">
                                {query.length} chars
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 font-medium">Confidence Threshold</span>
                                <span className="text-purple-600 font-bold">{confidenceThreshold}%</span>
                            </div>
                            <Slider
                                defaultValue={[50]}
                                max={100}
                                step={5}
                                onValueChange={setConfidenceThreshold}
                                className="w-full"
                            />
                        </div>

                        <Button
                            size="lg"
                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
                            onClick={handleSimulate}
                            disabled={analyzing || !query}
                        >
                            {analyzing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing Pattern...
                                </>
                            ) : (
                                <>
                                    <Brain className="mr-2 h-4 w-4" />
                                    Run Differential Analysis
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Results Panel */}
                <Card className="lg:col-span-2 flex flex-col border-slate-200 shadow-sm overflow-hidden bg-slate-50/50">
                    {!result ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-50">
                            <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                                <GitBranch className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700">Ready to Simulate</h3>
                            <p className="text-slate-500 max-w-sm mt-2">
                                Enter clinical notes on the left to generate differential diagnoses and treatment paths.
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col h-full">
                            <div className="p-6 pb-2 shrink-0">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <ArrowRight className="h-5 w-5 text-green-700" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Primary Match</p>
                                        <div className="flex items-baseline gap-3">
                                            <h2 className="text-2xl font-bold text-slate-900">{result.topMatch}</h2>
                                            <Badge className="bg-green-600 hover:bg-green-700">{result.confidence}% Confidence</Badge>
                                        </div>
                                    </div>
                                </div>

                                <Tabs defaultValue="differentials" className="w-full">
                                    <TabsList className="bg-slate-200/50">
                                        <TabsTrigger value="differentials">Differentials</TabsTrigger>
                                        <TabsTrigger value="labs">Suggested Labs</TabsTrigger>
                                        <TabsTrigger value="ayurveda">Ayurvedic View</TabsTrigger>
                                    </TabsList>

                                    <div className="mt-4">
                                        <TabsContent value="differentials" className="mt-0">
                                            <div className="space-y-3">
                                                {result.differentials.map((diff: any, i: number) => (
                                                    <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-200 transition-colors">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="font-semibold text-slate-900">{diff.name}</h4>
                                                            <span className="text-sm font-medium text-slate-500">{diff.confidence}% Match</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                                                            <div className="bg-slate-400 h-1.5 rounded-full" style={{ width: `${diff.confidence}%` }} />
                                                        </div>
                                                        <p className="text-sm text-slate-600 flex gap-2">
                                                            <AlertCircle className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                                            {diff.reason}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="labs" className="mt-0">
                                            <Card>
                                                <CardContent className="p-4">
                                                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                                        <Beaker className="h-4 w-4 text-purple-600" />
                                                        Recommended Workup
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {result.suggestedLabs.map((lab: string) => (
                                                            <Badge key={lab} variant="secondary" className="px-3 py-1 text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100">
                                                                {lab}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="ayurveda" className="mt-0">
                                            <Card className="bg-amber-50/50 border-amber-100">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <BookOpen className="h-4 w-4 text-amber-600" />
                                                        <h4 className="font-semibold text-amber-900">Dosha Analysis</h4>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                                                            <span className="text-sm font-medium text-slate-600">Imbalance Pattern</span>
                                                            <span className="text-sm font-bold text-amber-700">{result.ayurvedicPerspective.dosha}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-700 leading-relaxed p-2">
                                                            {result.ayurvedicPerspective.explanation}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VideoIcon(props: any) {
    return null; // Used elsewhere, avoiding check errors
}
