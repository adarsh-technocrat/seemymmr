import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Trial Notification Bar */}
      <Link
        href="/dashboard/billing"
        className="block w-full bg-gray-100 px-4 py-2.5 text-center text-sm text-textPrimary hover:bg-gray-200 transition-colors border-b border-gray-200"
      >
        You have <span className="font-medium text-textPrimary">14 days</span>{" "}
        left in your free trial
        <span>
          {" "}
          —{" "}
          <span className="text-primary font-medium underline">
            Pick a plan for $0
          </span>{" "}
          to keep analytics running without interruption
        </span>
      </Link>

      {/* Header */}
      <div className="bg-background border-b border-gray-100">
        <header>
          <nav
            className="mx-auto flex max-w-6xl items-center justify-between px-4 pb-10 pt-4 md:px-8"
            aria-label="Global"
          >
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
              title="seeMoreThanMMR dashboard"
            >
              <Image
                alt="seeMoreThanMMR logo"
                src="https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon.3a869d3d.png&w=64&q=75"
                width={28}
                height={28}
                className="size-6 md:size-7"
                unoptimized
              />
              <span className="text-base font-bold md:text-lg text-textPrimary">
                seeMoreThanMMR
              </span>
            </Link>
            <div className="flex flex-1 items-center justify-end gap-4">
              <div className="relative">
                <button
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-textPrimary hover:bg-gray-100 transition-colors"
                  type="button"
                >
                  <Image
                    src="https://lh3.googleusercontent.com/a/ACg8ocLjuOuMC2HRn46ofTAQ4rl296tX0qxLfCF4JCNDJT3DD_Qf4WaL=s96-c"
                    alt="Adarsh Kumar Singh"
                    className="size-6 shrink-0 rounded-full"
                    width={24}
                    height={24}
                    unoptimized
                  />
                  <span className="capitalize text-textPrimary">
                    Adarsh Kumar Singh
                  </span>
                </button>
              </div>
            </div>
          </nav>
        </header>
      </div>
      {children}
    </div>
  );
}
