"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NavItem } from "./NavItem";
import { NavSection } from "./NavSection";
import { SidebarWebsiteSelector } from "./WebsiteSelector";
import {
  LayoutDashboard,
  Sparkles,
  Download,
  Megaphone,
  Filter,
  Bell,
  Code,
  Plug,
  Settings,
  Command,
  Book,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { useAuth } from "@/lib/firebase/auth-context";
import { generateUserAvatar } from "@/lib/avatar";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchAllUserWebsites } from "@/store/slices/websitesSlice";

export function Sidebar() {
  const pathname = usePathname();
  const { user: firebaseUser } = useAuth();
  const dispatch = useAppDispatch();
  const websites = useAppSelector((state) => state.websites.websites) as Array<{
    _id: string;
    domain: string;
    name: string;
    iconUrl?: string;
  }>;
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    image?: string;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchAllUserWebsites());
  }, [dispatch]);

  useEffect(() => {
    if (firebaseUser) {
      const stored = localStorage.getItem("firebaseUser");
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          setUserData({
            name:
              parsedData.name ||
              firebaseUser.displayName ||
              firebaseUser.email?.split("@")[0] ||
              "User",
            email: parsedData.email || firebaseUser.email || "",
            image: parsedData.image || firebaseUser.photoURL || undefined,
          });
        } catch (e) {
          setUserData({
            name:
              firebaseUser.displayName ||
              firebaseUser.email?.split("@")[0] ||
              "User",
            email: firebaseUser.email || "",
            image: firebaseUser.photoURL || undefined,
          });
        }
      } else {
        setUserData({
          name:
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "User",
          email: firebaseUser.email || "",
          image: firebaseUser.photoURL || undefined,
        });
      }
    }
  }, [firebaseUser]);

  const websiteIdMatch = pathname.match(/\/dashboard\/([a-f0-9]{24})/);
  const currentWebsiteId = websiteIdMatch?.[1];
  const hasWebsiteSelected = !!currentWebsiteId;

  return (
    <aside className="fixed max-w-72 w-full flex flex-col px-4 py-6 h-screen bg-stone-50 border-r border-stone-200">
      <Link
        aria-label="Go to home"
        className="w-fit hover:opacity-70 pt-0 pb-6 ml-1 sticky top-0 z-10 flex items-center gap-2"
        href="/"
      >
        <Image
          src="/icon.svg"
          alt="Postmetric Logo"
          width={24}
          height={24}
          className="w-6 h-6 rounded-md"
        />
        <span className="font-bold text-stone-800 text-lg tracking-tight">
          Postmetric
        </span>
      </Link>

      <div className="flex-1 flex flex-col justify-between gap-8 overflow-y-auto">
        <nav className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 items-stretch">
            <SidebarWebsiteSelector />
            <NavItem
              href="/dashboard"
              icon={<LayoutDashboard className="w-[18px] h-[18px]" />}
            >
              Dashboard
            </NavItem>

            {/* Website-specific sections - only show when a website is selected */}
            {hasWebsiteSelected && (
              <>
                <NavSection title="Analytics" color="amber">
                  <NavItem
                    href={`/dashboard/${currentWebsiteId}`}
                    icon={<BarChart3 className="w-[18px] h-[18px]" />}
                  >
                    Analytics
                  </NavItem>
                  <NavItem
                    href={`/dashboard/${currentWebsiteId}?insights=true`}
                    icon={<Sparkles className="w-[18px] h-[18px]" />}
                    onClick={() => {
                      // AI Insights feature coming soon
                    }}
                  >
                    AI Insights
                  </NavItem>
                  <NavItem
                    href={`/dashboard/${currentWebsiteId}/export`}
                    icon={<Download className="w-[18px] h-[18px]" />}
                  >
                    Export & Reports
                  </NavItem>
                </NavSection>
                <NavSection title="Growth" color="rose">
                  <NavItem
                    href={`/dashboard/${currentWebsiteId}/campaigns`}
                    icon={<Megaphone className="w-[18px] h-[18px]" />}
                  >
                    Campaigns
                  </NavItem>
                  <NavItem
                    href={`/dashboard/${currentWebsiteId}/funnels`}
                    icon={<Filter className="w-[18px] h-[18px]" />}
                  >
                    Funnels
                  </NavItem>
                  <NavItem
                    href={`/dashboard/${currentWebsiteId}/roi`}
                    icon={<TrendingUp className="w-[18px] h-[18px]" />}
                  >
                    Marketing ROI
                  </NavItem>
                </NavSection>
              </>
            )}

            {/* Global sections - always visible */}
            <NavSection title="Tools & Settings" color="lime">
              <NavItem
                href="/dashboard/alerts"
                icon={<Bell className="w-[18px] h-[18px]" />}
              >
                Alerts & Notifications
              </NavItem>
              <NavItem
                href="/dashboard/api-keys"
                icon={<Code className="w-[18px] h-[18px]" />}
              >
                API Keys
              </NavItem>
              <NavItem
                href="/dashboard/integrations"
                icon={<Plug className="w-[18px] h-[18px]" />}
              >
                Integrations
              </NavItem>
              {hasWebsiteSelected ? (
                <NavItem
                  href={`/dashboard/${currentWebsiteId}/settings`}
                  icon={<Settings className="w-[18px] h-[18px]" />}
                  badge={
                    <span className="text-lime-700 font-semibold text-[10px] px-2 py-0.5 rounded-md text-center uppercase leading-3.5 bg-lime-100">
                      New
                    </span>
                  }
                >
                  Settings
                </NavItem>
              ) : (
                <NavItem
                  href="/dashboard/settings"
                  icon={<Settings className="w-[18px] h-[18px]" />}
                  badge={
                    <span className="text-lime-700 font-semibold text-[10px] px-2 py-0.5 rounded-md text-center uppercase leading-3.5 bg-lime-100">
                      New
                    </span>
                  }
                >
                  Settings
                </NavItem>
              )}
            </NavSection>
          </div>
        </nav>
        <div className="flex flex-col gap-2 items-stretch">
          <button
            type="button"
            className="h-8 flex items-center gap-3.5 px-2 w-full text-stone-500 group hover:text-stone-800 hover:bg-stone-0 border border-transparent hover:border-stone-100 rounded-lg transition-colors cursor-pointer"
            onClick={() => {
              // Command palette coming soon
            }}
          >
            <div className="flex items-center gap-3.5 grow">
              <Command className="w-4 h-4" />
              <p className="text-stone-500 font-medium text-sm group-hover:text-stone-800 lowercase">
                CMD + K
              </p>
            </div>
          </button>

          <Link
            className="h-8 flex items-center gap-3.5 px-2 w-full text-stone-500 group hover:text-stone-800 hover:bg-stone-0 border border-transparent hover:border-stone-100 rounded-lg transition-colors"
            target="_blank"
            href="https://docs.postmetric.com"
          >
            <div className="flex items-center gap-3.5 grow">
              <Book className="w-[18px] h-[18px]" />
              <p className="text-stone-500 font-medium text-sm group-hover:text-stone-800">
                Documentation
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M6.84444 17.4476L17.1564 7.13566M17.1564 7.13566V17.0352M17.1564 7.13566H7.25692"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </Link>

          {/* User Menu */}
          <div className="user-menu-popup relative">
            <button
              type="button"
              className="h-8 flex items-center gap-3.5 px-2 w-full text-stone-500 group hover:text-stone-800 hover:bg-stone-0 border border-transparent hover:border-stone-100 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 grow">
                {userData?.image ? (
                  <img
                    src={userData.image}
                    alt={userData.name}
                    className="size-4.5 rounded-full"
                    width={18}
                    height={18}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallbackAvatar = generateUserAvatar(
                        userData.email,
                        userData.name,
                        { size: 18 },
                      );
                      target.src = fallbackAvatar;
                    }}
                  />
                ) : (
                  <div
                    className="size-4.5 rounded-full bg-stone-500"
                    style={{
                      backgroundImage: userData
                        ? `url(${generateUserAvatar(
                            userData.email,
                            userData.name,
                            { size: 18 },
                          )})`
                        : undefined,
                    }}
                  />
                )}
                <p className="text-stone-500 font-medium text-sm group-hover:text-stone-800 truncate">
                  {userData?.name || "User"}
                </p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M17 8L12 3L7 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M17 16L12 21L7 16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
