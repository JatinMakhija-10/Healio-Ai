import { Star, Droplets, Clock, Zap } from "lucide-react";
import Link from "next/link";

interface UsageLimitCardProps {
    limit: number;
    resetsAt: string;
    code?: string;
    cooldownRemaining?: number;
    creditsBalance?: number;
    onUpgradeClick?: () => void;
}

export function UsageLimitCard({ limit, resetsAt, code, cooldownRemaining, creditsBalance, onUpgradeClick }: UsageLimitCardProps) {
    const formattedDate = new Date(resetsAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const isCooldown = code === "COOLDOWN";
    const isDaily = code === "DAILY_LIMIT";
    const badgeText = isCooldown ? "Cooldown" : isDaily ? "Daily limit" : "Limit reached";
    const headingText = isCooldown
        ? `Wait ${cooldownRemaining ?? 30}s`
        : isDaily
        ? "Daily limit reached"
        : "Monthly limit reached";

    return (
        <div className="w-full max-w-[400px] bg-[#2C2C2C] rounded-[24px] p-6 text-white font-sans shadow-xl border border-white/5 relative overflow-hidden">
            {/* Top gradient border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-teal-600" />

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-[#E5F3F1] text-teal-700 w-8 h-8 rounded-lg flex items-center justify-center">
                        {isCooldown ? <Clock size={16} className="text-teal-600" /> : <Droplets size={16} className="fill-current text-teal-600" />}
                    </div>
                    <span className="font-semibold text-[15px] opacity-90">Healio</span>
                </div>
                <div className={`text-xs font-medium px-3 py-1 rounded-full ${
                    isCooldown ? "bg-amber-900/40 text-amber-300" : "bg-[#FDECEA] text-[#C44635]"
                }`}>
                    {badgeText}
                </div>
            </div>

            {/* Usage Stats */}
            <div className="mb-6">
                <div className="text-[11px] font-bold tracking-wider text-gray-400 mb-1 uppercase">
                    {isCooldown ? "Please Wait" : "Consultations Used"}
                </div>
                {isCooldown ? (
                    <p className="text-lg text-gray-300 leading-relaxed">
                        Free plan has a <span className="text-white font-semibold">30-second cooldown</span> between consultations.
                    </p>
                ) : (
                    <>
                        <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-4xl font-bold tracking-tight">{limit}</span>
                            <span className="text-lg text-gray-500 font-medium">/ {limit}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-gradient-to-r from-teal-400 to-teal-500 w-full rounded-full" />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>{headingText}</span>
                            <span>{limit} of {limit}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Credits shortcut */}
            {typeof creditsBalance === "number" && creditsBalance > 0 && (
                <div className="mb-5 bg-purple-900/30 border border-purple-500/20 rounded-xl p-3 flex items-center gap-3">
                    <Zap className="h-5 w-5 text-purple-400 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-purple-200">You have {creditsBalance} credit{creditsBalance !== 1 ? "s" : ""}</p>
                        <p className="text-xs text-purple-300/70">Credits are used automatically when limits are exceeded</p>
                    </div>
                </div>
            )}

            <div className="h-[1px] w-full bg-gray-700 mb-6" />

            {/* Healio Plus CTA */}
            <div className="mb-6">
                <div className="flex gap-4 items-start mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#E5F5EF] flex items-center justify-center flex-shrink-0">
                        <Star className="text-teal-600 fill-teal-600 w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-0.5 mt-0.5">Healio Plus</h3>
                        <p className="text-[#A3A3A3] text-[13px] italic">Unlimited care, whenever you need it</p>
                    </div>
                </div>

                <ul className="space-y-3">
                    {[
                        "Unlimited monthly consultations",
                        "Downloadable PDF health reports",
                        "Family profiles — up to 5 members"
                    ].map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
                <button 
                    onClick={onUpgradeClick}
                    className="w-full py-3 px-4 bg-[#3A3A3A] hover:bg-[#454545] transition-colors rounded-xl font-medium text-sm text-white border border-gray-600"
                >
                    Upgrade to Healio Plus
                </button>
                <Link href="/dashboard/billing" className="block">
                    <button className="w-full py-2.5 px-4 text-teal-400 hover:text-teal-300 transition-colors rounded-xl text-xs font-medium">
                        Buy credit packs instead
                    </button>
                </Link>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-400 font-medium mt-3">
                Free plan resets <span className="text-white relative top-[0.5px] ml-1">{formattedDate}</span>
            </div>
        </div>
    );
}
