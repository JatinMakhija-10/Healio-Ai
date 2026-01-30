"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Activity,
    Users,
    DollarSign,
    TrendingUp,
    Star,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Filter,
    Download
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function DoctorAnalyticsPage() {
    // Mock Data
    const metrics = {
        totalRevenue: 12450,
        revenueGrowth: 12.5,
        totalPatients: 148,
        patientGrowth: 8.2,
        consultations: 312,
        consultationGrowth: 15.3,
        rating: 4.8,
        ratingCount: 96
    };

    const recentPayouts = [
        { id: "TX-9823", date: "Jan 24, 2026", amount: 1250, status: "processed" },
        { id: "TX-9755", date: "Jan 17, 2026", amount: 3400, status: "processed" },
        { id: "TX-9612", date: "Jan 10, 2026", amount: 2800, status: "processed" },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Practice Analytics</h1>
                    <p className="text-slate-500">Insights into your patients, earnings, and performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select defaultValue="30d">
                        <SelectTrigger className="w-[140px] bg-white">
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 3 months</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="gap-2 bg-white">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-teal-100 rounded-xl">
                                <DollarSign className="h-6 w-6 text-teal-600" />
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                {metrics.revenueGrowth}%
                            </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{metrics.totalRevenue.toLocaleString()}</h3>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                {metrics.patientGrowth}%
                            </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Active Patients</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalPatients}</h3>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <VideoIcon className="h-6 w-6 text-purple-600" />
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                {metrics.consultationGrowth}%
                            </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Consultations</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.consultations}</h3>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <Star className="h-6 w-6 text-amber-600" />
                            </div>
                            <span className="text-xs text-slate-500">{metrics.ratingCount} reviews</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Patient Rating</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.rating} <span className="text-sm text-slate-400 font-normal">/ 5.0</span></h3>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Graphs Section - Mocked with CSS only for now */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Revenue Trend (2/3 width) */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>Monthly earnings over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full flex items-end justify-between gap-4 px-2 pt-8 pb-2">
                            {[45, 60, 52, 75, 68, 85, 80, 95, 88, 92, 100, 90].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                    <div
                                        className="w-full bg-teal-100 rounded-t-sm transition-all duration-300 group-hover:bg-teal-500 relative"
                                        style={{ height: `${h}%` }}
                                    >
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                                            ₹{(h * 150).toLocaleString()}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Patient Demographics (1/3 width) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Specialties</CardTitle>
                        <CardDescription>Appointments by category</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-slate-700">General Consultation</span>
                                <span className="text-slate-500">45%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 rounded-full" style={{ width: '45%' }} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-slate-700">Ayurveda</span>
                                <span className="text-slate-500">30%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: '30%' }} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-slate-700">Follow-up</span>
                                <span className="text-slate-500">15%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '15%' }} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-slate-700">Other</span>
                                <span className="text-slate-500">10%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-300 rounded-full" style={{ width: '10%' }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Payouts Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Payouts</CardTitle>
                            <CardDescription>Latest transfers to your account</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-teal-600">View All</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Transaction ID</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3 rounded-r-lg">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentPayouts.map((payout) => (
                                    <tr key={payout.id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{payout.id}</td>
                                        <td className="px-4 py-3 text-slate-500">{payout.date}</td>
                                        <td className="px-4 py-3 font-medium text-slate-900">₹{payout.amount.toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 capitalize">
                                                {payout.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function VideoIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m22 8-6 4 6 4V8Z" />
            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
        </svg>
    )
}
