import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { AroviaLogo } from "@/components/ui/AroviaLogo";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F6F2] px-4 text-center">
      {/* Logo */}
      <Link
        href="/"
        className="mb-12 hover:opacity-80 transition-opacity"
        aria-label="Arovia home"
      >
        <AroviaLogo variant="horizontal" size={36} />
      </Link>

      {/* 404 Content */}
      <div className="w-full max-w-md">
        <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-[#E1F5EE] text-[#0F6E56]">
          <span className="text-3xl font-bold">404</span>
        </div>

        <h1 className="text-3xl font-bold text-[#1A1A2E] mb-3">Page not found</h1>
        <p className="text-base leading-7 text-[#555555] mb-8 max-w-sm mx-auto">
          The page you are looking for does not exist or may have moved. Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1A1A2E] px-6 text-base font-bold text-white shadow-sm transition hover:bg-[#0F6E56] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6E56]"
          >
            <Home className="size-4" aria-hidden="true" />
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#D6D2C8] bg-white px-6 text-base font-bold text-[#1C1C1E] transition hover:border-[#9FE1CB] hover:bg-[#E1F5EE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6E56]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
