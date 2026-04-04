"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getSubscriptionStatus } from "@/lib/stripe/mockClient";
import { PlanSelectionModal } from "@/components/subscription/PlanSelectionModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
    Users,
    Plus,
    Lock,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ChevronRight,
    Shield,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Activity,
    Trash2,
    Loader2
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

interface Persona {
    id: string;
    name: string;
    relation: string;
    age: number | null;
    gender: string | null;
    conditions: string[];
    allergies: string;
    created_at: string;
}

export default function FamilyPage() {
    const { user } = useAuth();
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [members, setMembers] = useState<Persona[]>([]);
    const [showAddMember, setShowAddMember] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form state
    const [formName, setFormName] = useState("");
    const [formRelation, setFormRelation] = useState("Child");
    const [formAge, setFormAge] = useState("");
    const [formGender, setFormGender] = useState("");
    const [formConditions, setFormConditions] = useState("");
    const [formAllergies, setFormAllergies] = useState("");

    const loadPersonas = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("personas")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true });

            if (!error && data) {
                setMembers(data as Persona[]);
            }
        } catch (e) {
            console.error("Failed to load personas:", e);
        }
    }, [user]);

    useEffect(() => {
        async function init() {
            const status = await getSubscriptionStatus();
            setIsPremium(status === 'plus' || status === 'pro');
            await loadPersonas();
            setLoading(false);
        }
        init();
    }, [loadPersonas]);

    const resetForm = () => {
        setFormName("");
        setFormRelation("Child");
        setFormAge("");
        setFormGender("");
        setFormConditions("");
        setFormAllergies("");
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formName.trim() || isSaving) return;

        // Enforce max 5 personas
        if (members.length >= 5) {
            alert("You can have a maximum of 5 family profiles.");
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase.from("personas").insert({
                user_id: user.id,
                name: formName.trim(),
                relation: formRelation,
                age: formAge ? parseInt(formAge) : null,
                gender: formGender || null,
                conditions: formConditions ? formConditions.split(",").map(c => c.trim()).filter(Boolean) : [],
                allergies: formAllergies.trim(),
            });

            if (error) {
                console.error("Failed to add persona:", error);
                alert("Failed to add profile. Please try again.");
            } else {
                await loadPersonas();
                resetForm();
                setShowAddMember(false);
            }
        } catch (err) {
            console.error("Add persona error:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm("Are you sure you want to remove this profile?")) return;
        setDeletingId(id);
        try {
            const { error } = await supabase
                .from("personas")
                .delete()
                .eq("id", id)
                .eq("user_id", user!.id);

            if (!error) {
                setMembers(prev => prev.filter(m => m.id !== id));
            }
        } catch (err) {
            console.error("Delete persona error:", err);
        } finally {
            setDeletingId(null);
        }
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
                    <Dialog open={showAddMember} onOpenChange={(open) => { setShowAddMember(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="mb-6 bg-teal-600 hover:bg-teal-700 gap-2" disabled={members.length >= 5}>
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
                                    <Label>Full Name *</Label>
                                    <Input placeholder="e.g. Rahul Sharma" value={formName} onChange={e => setFormName(e.target.value)} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Relation</Label>
                                        <select
                                            value={formRelation}
                                            onChange={e => setFormRelation(e.target.value)}
                                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="Self">Self</option>
                                            <option value="Spouse">Spouse</option>
                                            <option value="Child">Child</option>
                                            <option value="Parent">Parent</option>
                                            <option value="Sibling">Sibling</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Age</Label>
                                        <Input type="number" placeholder="25" min={0} max={150} value={formAge} onChange={e => setFormAge(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <select
                                        value={formGender}
                                        onChange={e => setFormGender(e.target.value)}
                                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="">Not specified</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Pre-existing Conditions</Label>
                                    <Input placeholder="e.g. Diabetes, Asthma (comma separated)" value={formConditions} onChange={e => setFormConditions(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Allergies</Label>
                                    <Input placeholder="e.g. Penicillin, Peanuts" value={formAllergies} onChange={e => setFormAllergies(e.target.value)} />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={!formName.trim() || isSaving}>
                                        {isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Create Profile"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Profiles Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.map((member) => (
                            <Card key={member.id} className="group hover:border-teal-200 transition-all hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <Avatar className="h-16 w-16 ring-4 ring-slate-50">
                                            <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 text-xl font-medium">
                                                {member.name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-300 hover:text-red-500"
                                            onClick={() => handleDeleteMember(member.id)}
                                            disabled={deletingId === member.id}
                                        >
                                            {deletingId === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </div>

                                    <div className="mt-4">
                                        <h3 className="font-bold text-lg text-slate-900">{member.name}</h3>
                                        <p className="text-sm text-slate-500">
                                            {member.relation}{member.age ? ` • ${member.age} yrs` : ""}
                                        </p>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {member.conditions?.length > 0 && (
                                            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">
                                                <strong>Conditions:</strong> {member.conditions.join(", ")}
                                            </div>
                                        )}
                                        {member.allergies && (
                                            <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">
                                                <strong>Allergies:</strong> {member.allergies}
                                            </div>
                                        )}
                                        {!member.conditions?.length && !member.allergies && (
                                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                                                <Shield className="h-3.5 w-3.5 shrink-0" />
                                                No medical history recorded
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
                                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3 text-slate-400">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-slate-900">Add Member</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-[150px]">
                                    Include a dependent or family member
                                </p>
                            </Card>
                        )}

                        {/* Max reached message */}
                        {members.length >= 5 && (
                            <div className="col-span-full text-center text-sm text-slate-500 py-4">
                                Maximum 5 profiles reached
                            </div>
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
