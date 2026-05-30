"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanSelectionModal } from "@/components/subscription/PlanSelectionModal";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { getSubscriptionStatus } from "@/lib/stripe/mockClient";
import { getFamilyProfileLimit, hasFeature } from "@/lib/subscription/plans";
import {
  AlertCircle,
  Edit3,
  HeartPulse,
  Info,
  Loader2,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

type Relation = "Self" | "Spouse" | "Child" | "Parent" | "Sibling" | "Other";
type Gender = "male" | "female" | "other" | "";

interface PersonaRow {
  id: string;
  user_id?: string;
  name: string;
  relation: Relation;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  conditions: string[] | null;
  allergies: string | null;
  created_at: string;
  updated_at?: string;
}

interface FamilyFormState {
  name: string;
  relation: Relation;
  ageBand: string;
  gender: Gender;
  conditions: string;
  allergies: string;
}

const RELATIONS: Relation[] = ["Self", "Spouse", "Child", "Parent", "Sibling", "Other"];
const GENDERS: { value: Gender; label: string }[] = [
  { value: "", label: "Not specified" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const AGE_BANDS = [
  { label: "Under 5", value: "under_5", repAge: 3 },
  { label: "5–12", value: "5_12", repAge: 8 },
  { label: "13–17", value: "13_17", repAge: 15 },
  { label: "18–35", value: "18_35", repAge: 26 },
  { label: "36–59", value: "36_59", repAge: 47 },
  { label: "60+", value: "60_plus", repAge: 68 },
];

const EMPTY_FORM: FamilyFormState = {
  name: "",
  relation: "Child",
  ageBand: "",
  gender: "",
  conditions: "",
  allergies: "",
};

function ageToBand(age: number | null) {
  if (age == null) return "";
  return AGE_BANDS.find(band => band.repAge === age)?.value ?? "";
}

function ageLabel(age: number | null) {
  if (age == null) return "Age not set";
  return AGE_BANDS.find(band => band.repAge === age)?.label ?? `${age} yrs`;
}

function parseCsv(value: string) {
  return value.split(",").map(item => item.trim()).filter(Boolean);
}

function initials(name: string) {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

function formFromMember(member: PersonaRow): FamilyFormState {
  return {
    name: member.name,
    relation: member.relation,
    ageBand: ageToBand(member.age),
    gender: member.gender ?? "",
    conditions: (member.conditions ?? []).join(", "),
    allergies: member.allergies ?? "",
  };
}

export default function FamilyPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<PersonaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [profileLimit, setProfileLimit] = useState(1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FamilyFormState>(EMPTY_FORM);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const loadMembers = useCallback(async () => {
    if (!user?.id) {
      setMembers([]);
      return;
    }

    const { data, error: loadError } = await supabase
      .from("personas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (loadError) {
      console.error("Failed to load family profiles:", loadError);
      setError("Could not load family profiles. Please refresh and try again.");
      return;
    }

    setMembers((data ?? []) as unknown as PersonaRow[]);
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      try {
        const status = await getSubscriptionStatus();
        if (!mounted) return;
        setIsPremium(hasFeature(status, "family_profiles"));
        setProfileLimit(getFamilyProfileLimit(status));
        await loadMembers();
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [loadMembers]);

  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return members;
    return members.filter(member => {
      const haystack = `${member.name} ${member.relation} ${member.gender ?? ""} ${(member.conditions ?? []).join(" ")} ${member.allergies ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [members, query]);

  const isAtLimit = members.length >= profileLimit;
  const childrenCount = members.filter(member => member.relation === "Child").length;
  const profilesWithContext = members.filter(member => (member.conditions?.length ?? 0) > 0 || Boolean(member.allergies)).length;
  const selectedMember = editingId ? members.find(member => member.id === editingId) : null;

  const openCreateDialog = () => {
    setError("");
    if (isAtLimit) {
      setShowUpgradeModal(true);
      return;
    }
    setEditingId(null);
    setForm(EMPTY_FORM);
    setConsentAccepted(false);
    setDialogOpen(true);
  };

  const openEditDialog = (member: PersonaRow) => {
    setError("");
    setEditingId(member.id);
    setForm(formFromMember(member));
    setConsentAccepted(true);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setConsentAccepted(false);
  };

  const saveMember = async () => {
    if (!user?.id) {
      setError("Please sign in to manage family profiles.");
      return;
    }
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!consentAccepted) {
      setError("Consent confirmation is required before saving a family health profile.");
      return;
    }
    if (!editingId && isAtLimit) {
      setShowUpgradeModal(true);
      return;
    }

    setSaving(true);
    setError("");

    const band = AGE_BANDS.find(item => item.value === form.ageBand);
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      relation: form.relation,
      age: band?.repAge ?? null,
      gender: form.gender || null,
      conditions: parseCsv(form.conditions),
      allergies: form.allergies.trim(),
      updated_at: new Date().toISOString(),
    };

    const result = editingId
      ? await supabase.from("personas").update(payload).eq("id", editingId).eq("user_id", user.id)
      : await supabase.from("personas").insert(payload);

    if (result.error) {
      console.error("Failed to save family profile:", result.error);
      setError("Could not save this profile. Please check the details and try again.");
      setSaving(false);
      return;
    }

    await loadMembers();
    setSaving(false);
    closeDialog();
  };

  const deleteMember = async (member: PersonaRow) => {
    if (!user?.id) return;
    if (!confirm(`Delete ${member.name}&apos;s family profile? This cannot be undone.`)) return;

    setDeletingId(member.id);
    setError("");

    const { error: deleteError } = await supabase
      .from("personas")
      .delete()
      .eq("id", member.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Failed to delete family profile:", deleteError);
      setError("Could not delete this profile. Please try again.");
    } else {
      setMembers(prev => prev.filter(item => item.id !== member.id));
    }

    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-72 rounded-lg" />
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            Consent-first family health context
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Family Profiles</h1>
          <p className="text-gray-500 mt-1 max-w-2xl">
            Save minimal health context for loved ones so Healio can personalize guidance more safely.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isPremium && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5">
              <Lock className="h-3 w-3" />
              Basic: {profileLimit} profile
            </Badge>
          )}
          <Button onClick={openCreateDialog} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Profile
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 flex items-start gap-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-700"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
        <p className="text-xs leading-relaxed text-blue-700">
          <strong>DPDP notice:</strong> Add family health context only with consent. Healio stores age bands instead of exact birth dates, supports deletion at any time, and uses this data only for personalized wellness and safety guidance.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Card className="border-gray-100"><CardContent className="p-4"><p className="text-xs text-gray-500">Profiles</p><p className="text-2xl font-bold text-gray-900">{members.length}/{profileLimit}</p></CardContent></Card>
        <Card className="border-gray-100"><CardContent className="p-4"><p className="text-xs text-gray-500">Children</p><p className="text-2xl font-bold text-gray-900">{childrenCount}</p></CardContent></Card>
        <Card className="border-gray-100"><CardContent className="p-4"><p className="text-xs text-gray-500">With context</p><p className="text-2xl font-bold text-gray-900">{profilesWithContext}</p></CardContent></Card>
        <Card className="border-gray-100"><CardContent className="p-4"><p className="text-xs text-gray-500">Plan</p><p className="text-2xl font-bold text-gray-900">{isPremium ? "Plus" : "Basic"}</p></CardContent></Card>
      </div>

      {isAtLimit && (
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Profile limit reached</p>
              <p className="text-sm text-amber-700">Upgrade to Plus to manage up to 5 family profiles.</p>
            </div>
          </div>
          {!isPremium && <Button size="sm" onClick={() => setShowUpgradeModal(true)}>Upgrade</Button>}
        </div>
      )}

      <Card className="border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-gray-400" /> Profiles</CardTitle>
            <div className="relative sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search profiles" className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-14">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-700">{members.length === 0 ? "No family profiles yet" : "No matching profiles"}</p>
              <p className="text-sm text-gray-400 mt-1">{members.length === 0 ? "Create your first profile with consent." : "Try a different search term."}</p>
              {members.length === 0 && <Button onClick={openCreateDialog} className="mt-4 gap-2"><Plus className="h-4 w-4" />Add Profile</Button>}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMembers.map(member => (
                <Card key={member.id} className="border-gray-100 hover:border-teal-200 hover:shadow-md transition-all">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-12 w-12 ring-4 ring-gray-50">
                          <AvatarFallback className="bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-700 font-bold">
                            {initials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                          <p className="text-xs text-gray-500">{member.relation} · {ageLabel(member.age)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(member)} className="h-8 w-8 text-gray-400 hover:text-teal-600">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMember(member)} disabled={deletingId === member.id} className="h-8 w-8 text-gray-400 hover:text-red-600">
                          {deletingId === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="capitalize">{member.gender ?? "gender not set"}</Badge>
                      <Badge variant="outline">{member.conditions?.length ?? 0} condition{(member.conditions?.length ?? 0) === 1 ? "" : "s"}</Badge>
                    </div>

                    <div className="space-y-2">
                      {(member.conditions?.length ?? 0) > 0 && (
                        <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          <strong>Conditions:</strong> {(member.conditions ?? []).join(", ")}
                        </div>
                      )}
                      {member.allergies && (
                        <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-800">
                          <strong>Allergies:</strong> {member.allergies}
                        </div>
                      )}
                      {(member.conditions?.length ?? 0) === 0 && !member.allergies && (
                        <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
                          <HeartPulse className="h-3.5 w-3.5" />
                          No medical context added yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedMember ? "Edit Family Profile" : "Add Family Profile"}</DialogTitle>
            <DialogDescription>
              Store only the minimum details needed for safer personalization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Rahul Sharma" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Relation</Label>
                <select value={form.relation} onChange={e => setForm(prev => ({ ...prev, relation: e.target.value as Relation }))} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {RELATIONS.map(relation => <option key={relation} value={relation}>{relation}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Age band</Label>
                <select value={form.ageBand} onChange={e => setForm(prev => ({ ...prev, ageBand: e.target.value }))} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Not specified</option>
                  {AGE_BANDS.map(band => <option key={band.value} value={band.value}>{band.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <select value={form.gender} onChange={e => setForm(prev => ({ ...prev, gender: e.target.value as Gender }))} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                {GENDERS.map(gender => <option key={gender.value || "none"} value={gender.value}>{gender.label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Conditions</Label>
              <Input value={form.conditions} onChange={e => setForm(prev => ({ ...prev, conditions: e.target.value }))} placeholder="e.g. Asthma, Diabetes" />
              <p className="text-[11px] text-gray-400">Separate multiple conditions with commas.</p>
            </div>

            <div className="space-y-2">
              <Label>Allergies</Label>
              <Input value={form.allergies} onChange={e => setForm(prev => ({ ...prev, allergies: e.target.value }))} placeholder="e.g. Penicillin, peanuts" />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 cursor-pointer">
              <Checkbox checked={consentAccepted} onCheckedChange={value => setConsentAccepted(Boolean(value))} className="mt-0.5" />
              <span className="text-xs text-slate-600 leading-relaxed">
                I confirm I have consent to store this family member&apos;s health context in Healio for personalized wellness and safety guidance.
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={saveMember} disabled={saving || !form.name.trim() || !consentAccepted} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {selectedMember ? "Save Changes" : "Create Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PlanSelectionModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} featureLocked="Family Profiles" />
    </div>
  );
}
