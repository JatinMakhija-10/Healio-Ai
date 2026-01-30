"use client";

import { QnAList } from "@/components/admin/qna/QnAList";
import { FileText, HelpCircle } from "lucide-react";

export default function ClinicalQnAPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <HelpCircle className="h-8 w-8 text-purple-600" />
                    Clinical QnA
                </h1>
                <p className="text-slate-500">
                    Maintain the clinical knowledge base used by the AI engine and medical staff.
                </p>
            </div>

            <QnAList />
        </div>
    );
}
