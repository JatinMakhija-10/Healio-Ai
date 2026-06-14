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
        <div className="fixed inset-0 flex overflow-hidden bg-slate-50">
            {/* Sidebar - Hidden on mobile, controlled via Sheet later if needed */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex min-h-0 flex-col overflow-hidden">
                <Header />
                <DisclaimerBanner />

                <DashboardContent>{children}</DashboardContent>
            </div>
        </div>
    );
}
