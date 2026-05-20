"use client";

import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Action = "suspend" | "unsuspend" | "reset-password";

interface Props {
    userId: string;
    userEmail?: string | null;
    userFullName?: string | null;
    action: Action | null;
    onClose: () => void;
    onCompleted?: () => void;
}

export function UserActionsDialog({ userId, userEmail, userFullName, action, onClose, onCompleted }: Props) {
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);

    const open = action !== null;
    const displayName = userFullName || userEmail || "this user";

    const titles: Record<Action, string> = {
        suspend: `Suspend ${displayName}?`,
        unsuspend: `Re-instate ${displayName}?`,
        "reset-password": `Send password reset to ${displayName}?`,
    };

    const descriptions: Record<Action, string> = {
        suspend: "The user will be signed out and unable to log back in until you re-instate them. They will receive an in-app notification.",
        unsuspend: "The user will regain full access immediately and receive an in-app notification.",
        "reset-password": `An email with a recovery link will be sent to ${userEmail || "the user"}. You will not see the new password.`,
    };

    const confirmLabels: Record<Action, string> = {
        suspend: "Suspend account",
        unsuspend: "Re-instate account",
        "reset-password": "Send reset email",
    };

    const handleConfirm = async () => {
        if (!action) return;
        setBusy(true);
        try {
            const url =
                action === "reset-password"
                    ? `/api/admin/users/${userId}/reset-password`
                    : `/api/admin/users/${userId}/suspend`;
            const body =
                action === "reset-password"
                    ? {}
                    : { suspend: action === "suspend", reason: reason.trim() || null };

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.message || json.error || "Request failed");
            }

            const successMessages: Record<Action, string> = {
                suspend: "User suspended",
                unsuspend: "User re-instated",
                "reset-password": "Password reset email sent",
            };
            toast.success(successMessages[action]);
            onCompleted?.();
            setReason("");
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Action failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{action ? titles[action] : ""}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {action ? descriptions[action] : ""}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {action === "suspend" && (
                    <div className="space-y-2 py-2">
                        <Label htmlFor="suspend-reason">Reason (optional)</Label>
                        <Textarea
                            id="suspend-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Short explanation visible to other admins…"
                            maxLength={500}
                            disabled={busy}
                        />
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirm();
                        }}
                        disabled={busy}
                        className={
                            action === "suspend"
                                ? "bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                : action === "unsuspend"
                                  ? "bg-green-600 hover:bg-green-700 focus:ring-green-600"
                                  : ""
                        }
                    >
                        {busy ? "Working…" : action ? confirmLabels[action] : ""}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
