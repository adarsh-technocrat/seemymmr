"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { UserMenu } from "@/components/dashboard/UserMenu";

export function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/blog", label: "Blog" },
    { href: "/changelog", label: "Changelog" },
  ];

  const isActive = (href: string) => {
    if (href === "/pricing") {
      return pathname === "/pricing";
    }
    if (href === "/blog") {
      return pathname === "/blog";
    }
    if (href === "/changelog") {
      return pathname === "/changelog";
    }
    // For hash links, check if we're on the home page
    if (href.startsWith("/#")) {
      return pathname === "/";
    }
    return false;
  };

  return (
    <header className="grid grid-cols-2 lg:grid-cols-3 h-14 items-center sticky top-0 backdrop-blur-lg w-full gap-2 px-4 lg:px-6 z-50 bg-stone-50/80 border-b border-stone-200/50">
      <Link
        href="/"
        className="w-fit hover:opacity-70 py-0 m-0 flex items-center gap-2"
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

      <div className="w-full hidden lg:flex items-center justify-center">
        <div className="lg:flex gap-2 justify-center items-center hidden">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex w-full font-mono justify-between px-3 py-1 gap-1 items-center uppercase text-xs select-none cursor-pointer rounded-lg transition-colors duration-200 ${
                  active
                    ? "bg-brand-100 text-brand-600 font-medium"
                    : "text-stone-700 hover:text-brand-600 hover:bg-brand-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="w-full hidden lg:flex justify-end">
        <div className="hidden lg:flex gap-4 justify-end w-max items-center">
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-stone-200" />
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="uppercase cursor-pointer box-border flex items-center justify-center font-semibold font-mono text-xs border border-stone-200 px-4 py-2 rounded hover:bg-stone-100 transition-all text-stone-700"
              >
                Dashboard
              </Link>
              <UserMenu />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="uppercase cursor-pointer box-border flex items-center justify-center font-semibold font-mono text-xs border border-stone-200 px-4 py-2 rounded hover:bg-stone-100 transition-all text-stone-700"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard/new"
                className="cursor-pointer box-border flex items-center justify-center font-semibold font-mono text-xs border border-stone-800 bg-stone-800 text-white px-4 py-2 rounded hover:bg-stone-700 transition-all uppercase"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex lg:hidden w-full items-center justify-end gap-2">
        {!loading && user && (
          <div className="lg:hidden">
            <UserMenu />
          </div>
        )}
        <button className="flex gap-4 justify-end lg:hidden">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      </div>
    </header>
  );
}
