import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { DashboardContent } from "@/components/layout/DashboardContent";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-dvh bg-slate-50">
            {/* Sidebar - Hidden on mobile, controlled via Sheet later if needed */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <Header />
                <DisclaimerBanner />

                <DashboardContent>{children}</DashboardContent>
            </div>
        </div>
    );
}
