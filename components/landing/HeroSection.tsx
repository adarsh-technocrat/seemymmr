"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AVATAR_USERS = [
  { name: "Sarah Chen", email: "sarah.chen@example.com" },
  { name: "Marcus Johnson", email: "marcus.j@example.com" },
  { name: "Priya Patel", email: "priya.patel@example.com" },
  { name: "David Kim", email: "david.kim@example.com" },
  { name: "Emma Rodriguez", email: "emma.r@example.com" },
];

export function HeroSection() {
  return (
    <div className="py-12 px-4 lg:px-20 lg:py-24 flex flex-col gap-8 items-center pb-20">
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-mono text-stone-600 mb-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        Analytics for UXmagic.ai
      </div>

      <div className="flex flex-col gap-4 items-center max-w-3xl">
        <h1 className="font-cooper text-[32px] lg:text-[56px] leading-tight lg:leading-[1.1] text-center text-balance text-stone-900">
          Find out which marketing channels drive your revenue
        </h1>
        <h2 className="text-center text-balance lg:whitespace-pre-line whitespace-normal leading-relaxed text-stone-500 text-lg lg:text-xl max-w-2xl">
          Postmetric is the analytics tool for entrepreneurs. From first click
          to customer, it helps you understand where the money is and how to
          increase your revenue without bombarding you with data.
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center mt-4 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-stone-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
          <input
            type="email"
            className="block w-full pl-10 pr-3 py-3 border border-stone-200 rounded text-sm placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-800 focus:border-stone-800 font-mono"
            placeholder="Enter your email"
          />
        </div>
        <Link
          href="/dashboard/new"
          className="w-full sm:w-auto cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border border-stone-800 bg-stone-800 text-white px-6 py-3 rounded text-xs hover:bg-stone-700 transition-all whitespace-nowrap"
        >
          Get Started Free
          <svg
            className="ml-2 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            ></path>
          </svg>
        </Link>
      </div>

      <p className="text-xs text-stone-400 mt-2 font-mono">
        No credit card required • 14-day free trial
      </p>

      <div className="flex flex-col items-center gap-3 mt-8">
        <div className="flex -space-x-2 overflow-hidden p-1">
          {AVATAR_USERS.map((user, index) => (
            <Avatar
              key={index}
              className="inline-block h-8 w-8 ring-2 ring-white"
            >
              <AvatarFallback
                email={user.email}
                name={user.name}
                className="h-8 w-8"
              />
            </Avatar>
          ))}
        </div>
        <div className="text-sm text-stone-600">
          <span className="font-bold text-stone-900">1,000+</span> makers trust
          Postmetric
        </div>
      </div>
    </div>
  );
}
