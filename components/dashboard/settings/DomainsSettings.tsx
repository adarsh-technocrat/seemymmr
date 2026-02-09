"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Domain {
  _id: string;
  domain: string;
  status: "verified" | "unverified";
  addedOn: string;
  region: string;
}

export function DomainsSettings() {
  const [domains, setDomains] = useState<Domain[]>([
    {
      _id: "1",
      domain: "test.co",
      status: "unverified",
      addedOn: "19/12/2025",
      region: "us-east-1",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleAddDomain = () => {
    // TODO: Implement add domain functionality
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end gap-2">
        <p className="text-stone-500 font-normal text-sm grow">
          Add and manage authorized domains used for sending emails to ensure
          proper authentication and delivery.
        </p>
        <Button
          onClick={handleAddDomain}
          className="text-stone-50 bg-stone-700 border-2 border-stone-800 hover:bg-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-700"
        >
          <span className="-ml-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 4V20M20 12H4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </span>
          Add Domain
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {domains.map((domain) => (
          <Card
            key={domain._id}
            className="border border-stone-200 rounded-2xl bg-stone-0 flex flex-col justify-between"
          >
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-stone-800 font-semibold text-sm">
                    <span>{domain.domain}</span>
                  </p>
                  <p className="text-stone-500 font-normal text-xs"></p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`size-2.5 border-[1.5px] rounded-full ${
                      domain.status === "verified"
                        ? "bg-green-300 border-green-700"
                        : "bg-rose-300 border-rose-700"
                    }`}
                  ></div>
                  <p className="text-stone-800 font-semibold text-xs tracking-[0.48px] font-mono uppercase">
                    {domain.status === "verified" ? "Verified" : "Unverified"}
                  </p>
                </div>
              </div>
              <div className="flex items-center flex-wrap gap-x-8 gap-y-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center">
                    <p className="text-stone-500 font-normal text-[10px] font-mono tracking-[0.4px] uppercase">
                      Added on
                    </p>
                  </div>
                  <p className="text-stone-800 font-normal text-xs font-mono break-all">
                    {domain.addedOn}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center">
                    <p className="text-stone-500 font-normal text-[10px] font-mono tracking-[0.4px] uppercase">
                      Region
                    </p>
                  </div>
                  <p className="text-stone-800 font-normal text-xs font-mono break-all">
                    {domain.region}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Link
                href={`/dashboard/settings/domains/${domain.domain}`}
                className="rounded-b-2xl border-t border-stone-200 group w-full px-4 py-3 h-[44px] flex items-center font-semibold font-mono text-sm uppercase tracking-[0.56px] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none bg-stone-100 text-stone-500 hover:text-stone-800 disabled:hover:text-stone-500 justify-between"
              >
                DNS Records
                <span className="group-hover:translate-x-1 transform-gpu transition-all duration-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M5 12H19.5833M19.5833 12L12.5833 5M19.5833 12L12.5833 19"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </span>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
