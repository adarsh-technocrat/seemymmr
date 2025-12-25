import Link from "next/link";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import User from "@/db/models/User";
import { calculateTrialDaysRemaining } from "@/utils/trial";
import { TrialExpiredBanner } from "@/components/dashboard/TrialExpiredBanner";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let daysRemaining: number | null = null;
  let subscriptionStatus: string | undefined = undefined;
  let subscriptionPlan: string | undefined = undefined;
  let hasActiveSubscription = false;

  try {
    const session = await getSession();
    if (session?.user?.id) {
      await connectDB();
      const user = await User.findById(session.user.id);
      daysRemaining = calculateTrialDaysRemaining(
        user?.subscription?.trialEndsAt
      );
      subscriptionStatus = user?.subscription?.status;
      subscriptionPlan = user?.subscription?.plan;
      hasActiveSubscription =
        subscriptionStatus === "active" &&
        subscriptionPlan !== "free" &&
        subscriptionPlan !== undefined;
    }
  } catch (error) {
    console.error("Error calculating trial days:", error);
  }

  const displayDays =
    daysRemaining !== null
      ? daysRemaining
      : parseInt(process.env.TRIAL_PERIOD_DAYS || "14", 10);

  const isTrialExpired =
    daysRemaining !== null && daysRemaining === 0 && !hasActiveSubscription;

  if (isTrialExpired) {
    return <TrialExpiredBanner />;
  }

  return (
    <div className="antialiased font-sans min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto flex w-full min-h-screen">
        <Sidebar />
        <main className="ml-72 px-4 py-6 grow w-full min-h-screen">
          {/* Trial Banner */}
          {displayDays > 0 && (
            <Link
              href="/dashboard/billing"
              className="block w-full bg-stone-100 px-4 py-2.5 text-center text-sm text-stone-700 hover:bg-stone-200 transition-colors border border-stone-200 rounded-lg mb-4"
            >
              You have{" "}
              <span className="font-medium text-stone-800">
                {displayDays} {displayDays === 1 ? "day" : "days"}
              </span>{" "}
              left in your free trial
              <span>
                {" "}
                —{" "}
                <span className="text-stone-800 font-medium underline">
                  Pick a plan for $0
                </span>{" "}
                to keep analytics running without interruption
              </span>
            </Link>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
