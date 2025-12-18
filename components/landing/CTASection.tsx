"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Diverse user names/emails that will generate different avatars
// These are deterministic - same seed = same avatar every time
const AVATAR_USERS = [
  { name: "Alex Thompson", email: "alex.t@example.com" },
  { name: "Maria Garcia", email: "maria.g@example.com" },
  { name: "James Wilson", email: "james.w@example.com" },
  { name: "Lisa Anderson", email: "lisa.a@example.com" },
  { name: "Michael Brown", email: "michael.b@example.com" },
];

export function CTASection() {
  return (
    <div className="flex lg:flex-row flex-col px-6 lg:px-12 py-12 gap-8 border-y border-stone-200 bg-white items-center">
      <div className="flex flex-col gap-4 flex-1">
        <h2 className="text-stone-800 font-normal text-3xl font-cooper leading-tight text-center lg:text-start">
          Ready to grow your revenue?
        </h2>
        <p className="text-stone-500 font-normal text-base leading-relaxed text-center lg:text-start max-w-xl">
          Join 1,000+ makers who are using Postmetric to understand their
          business and grow their revenue.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center lg:justify-start mt-2">
          <Link
            href="/dashboard/new"
            className="cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border border-stone-800 bg-stone-800 text-white px-6 py-3 rounded text-xs hover:bg-stone-700 transition-all w-full sm:w-auto"
          >
            Get Started Free
          </Link>
          <Link
            href="#"
            className="cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border border-stone-200 bg-white text-stone-700 px-6 py-3 rounded text-xs hover:bg-stone-50 transition-all w-full sm:w-auto"
          >
            View Live Demo
          </Link>
        </div>
      </div>
      <div className="flex -space-x-4 overflow-hidden p-2">
        {AVATAR_USERS.map((user, index) => (
          <Avatar
            key={index}
            className="inline-block h-12 w-12 ring-2 ring-white"
          >
            <AvatarFallback
              email={user.email}
              name={user.name}
              className="h-12 w-12"
            />
          </Avatar>
        ))}
        <div className="h-12 w-12 rounded-full ring-2 ring-white bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
          +1k
        </div>
      </div>
    </div>
  );
}
