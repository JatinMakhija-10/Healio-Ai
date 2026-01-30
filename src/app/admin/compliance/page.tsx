import { FlaggedSessionList } from "@/components/admin/compliance/FlaggedSessionList";
import { Shield } from "lucide-react";

export default function CompliancePage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <Shield className="h-8 w-8 text-purple-600" />
                    Compliance & Quality
                </h1>
                <p className="text-slate-500">
                    Review flagged sessions, investigate potential violations, and ensure platform safety.
                </p>
            </div>

            <FlaggedSessionList />
        </div>
    );
}
