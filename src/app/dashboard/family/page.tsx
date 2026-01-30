"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSubscriptionStatus } from "@/lib/stripe/mockClient";
import { PlanSelectionModal } from "@/components/subscription/PlanSelectionModal";
import {
    Users,
    Plus,
    Lock,
    User,
    ChevronRight,
    Baby,
    Heart,
    Shield
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FamilyMember {
    id: string;
    name: string;
    relation: string;
    age: number;
    avatar?: string;
    lastCheckup?: string;
}

export default function FamilyPage() {
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [members, setMembers] = useState<FamilyMember[]>([
        { id: "1", name: "Priya Sharma", relation: "Self", age: 32, lastCheckup: "2 days ago" }
    ]);
    const [showAddMember, setShowAddMember] = useState(false);

    useEffect(() => {
        getSubscriptionStatus().then((status) => {
            setIsPremium(status === 'plus' || status === 'pro');
            setLoading(false);
        });
    }, []);

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock add
        setMembers([...members, {
            id: Date.now().toString(),
            name: "New Member",
            relation: "Child",
            age: 5
        }]);
        setShowAddMember(false);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 w-full rounded-xl" />
                <div className="grid md:grid-cols-3 gap-6">
                    <Skeleton className="h-48 rounded-xl" />
                    <Skeleton className="h-48 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Family Profiles</h1>
                    <p className="text-slate-500">Manage health records for your loved ones in one place.</p>
                </div>
                {!isPremium && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5">
                        <Lock className="h-3 w-3" />
                        Premium Feature
                    </Badge>
                )}
            </div>

            {/* Main Content */}
            <div className="relative">
                {!isPremium && (
                    <div className="absolute inset-0 z-10 backdrop-blur-sm bg-white/50 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200">
                        <div className="text-center p-8 max-w-md space-y-4 bg-white/90 shadow-xl rounded-2xl border border-white/50">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
                                <Users className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Protect Your Whole Family</h3>
                                <p className="text-slate-500 text-sm mt-2">
                                    Create up to 5 profiles for parents, children, or partners. Keep their diagnosis history and prescriptions organized.
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowUpgradeModal(true)}
                                className="w-full bg-slate-900 text-white hover:bg-slate-800"
                            >
                                Unlock Family Profiles
                            </Button>
                        </div>
                    </div>
                )}

                <div className={`transition-all duration-500 ${!isPremium ? "opacity-20 pointer-events-none select-none grayscale-[0.5]" : ""}`}>

                    {/* Add Member Button */}
                    <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                        <DialogTrigger asChild>
                            <Button className="mb-6 bg-teal-600 hover:bg-teal-700 gap-2">
                                <Plus className="h-4 w-4" />
                                Add Family Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Profile</DialogTitle>
                                <DialogDescription>Create a separate health profile for a family member.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddMember} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input placeholder="e.g. Rahul Sharma" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Relation</Label>
                                        <Input placeholder="e.g. Spouse, Child" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Age</Label>
                                        <Input type="number" placeholder="25" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Create Profile</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Profiles Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.map((member) => (
                            <Card key={member.id} className="group hover:border-teal-200 transition-all cursor-pointer hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <Avatar className="h-16 w-16 ring-4 ring-slate-50">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 text-xl font-medium">
                                                {member.name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Button variant="ghost" size="icon" className="text-slate-300 group-hover:text-slate-500">
                                            <ChevronRight className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    <div className="mt-4">
                                        <h3 className="font-bold text-lg text-slate-900">{member.name}</h3>
                                        <p className="text-sm text-slate-500">{member.relation} • {member.age} yrs</p>
                                    </div>

                                    <div className="mt-6 space-y-2">
                                        {member.lastCheckup ? (
                                            <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-100 flex items-center gap-2 text-xs text-teal-700">
                                                <Activity className="h-3.5 w-3.5 shrink-0" />
                                                Checkup: {member.lastCheckup}
                                            </div>
                                        ) : (
                                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                                                <Shield className="h-3.5 w-3.5 shrink-0" />
                                                No recent history
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Empty State / Add Card */}
                        {members.length < 5 && (
                            <Card
                                className="border-dashed border-2 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px]"
                                onClick={() => setShowAddMember(true)}
                            >
                                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3 text-slate-400 group-hover:text-slate-600">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-slate-900">Add Member</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-[150px]">
                                    Include a dependent or family member
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <PlanSelectionModal
                open={showUpgradeModal}
                onOpenChange={setShowUpgradeModal}
                featureLocked="Family Profiles"
            />
        </div>
    );
}

// Importing Activity here to avoid top-level conflict if needed, or ensuring it's in imports
import { Activity } from "lucide-react";
