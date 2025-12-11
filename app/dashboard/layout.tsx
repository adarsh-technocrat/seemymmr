import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import User from "@/db/models/User";
import { calculateTrialDaysRemaining } from "@/utils/trial";

// Force dynamic rendering since we use cookies for session
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let daysRemaining: number | null = null;

  try {
    const session = await getSession();
    if (session?.user?.id) {
      await connectDB();
      const user = await User.findById(session.user.id);
      daysRemaining = calculateTrialDaysRemaining(
        user?.subscription?.trialEndsAt
      );
    }
  } catch (error) {
    console.error("Error calculating trial days:", error);
  }

  const displayDays =
    daysRemaining !== null
      ? daysRemaining
      : parseInt(process.env.TRIAL_PERIOD_DAYS || "14", 10);

  return (
    <div className="min-h-screen bg-background">
      <Link
        href="/dashboard/billing"
        className="block w-full bg-gray-100 px-4 py-2.5 text-center text-sm text-textPrimary hover:bg-gray-200 transition-colors border-b border-gray-200"
      >
        You have{" "}
        <span className="font-medium text-textPrimary">
          {displayDays} {displayDays === 1 ? "day" : "days"}
        </span>{" "}
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

      <header className="bg-background">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-4 pb-4 pt-4 md:px-8"
          aria-label="Global"
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            title="PostMetric dashboard"
          >
            <Image
              alt="PostMetric logo"
              src="https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon.3a869d3d.png&w=64&q=75"
              width={28}
              height={28}
              className="size-6 md:size-7"
              unoptimized
            />
            <span className="text-base font-bold md:text-lg text-textPrimary">
              PostMetric
            </span>
          </Link>
          <UserMenu />
        </nav>
      </header>
      {children}
    </div>
  );
}
