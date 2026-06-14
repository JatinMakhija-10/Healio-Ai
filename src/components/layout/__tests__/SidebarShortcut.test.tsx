import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "../Sidebar";

vi.mock("next/navigation", () => ({
    usePathname: () => "/dashboard",
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/context/AuthContext", () => ({
    useAuth: () => ({
        logout: vi.fn(),
        profile: {
            subscription_plan: "free",
            credits_balance: 0,
        },
    }),
}));

describe("Sidebar new consultation shortcut", () => {
    it("renders the hover tooltip and keyboard shortcut metadata", () => {
        const html = renderToStaticMarkup(<Sidebar />);

        expect(html).toContain("New consultation");
        expect(html).toContain("Ctrl+Shift+O");
        expect(html).toContain('aria-keyshortcuts="Control+Shift+O"');
    });
});
