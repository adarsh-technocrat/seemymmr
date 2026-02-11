"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DomainLogo } from "@/components/ui/domain-logo";

interface WebsiteSelectorProps {
  websiteId: string;
  website: {
    _id: string;
    domain: string;
    name: string;
    iconUrl?: string;
  } | null;
}

export function WebsiteSelector({ websiteId, website }: WebsiteSelectorProps) {
  return (
    <div className="relative inline-block shrink-0">
      <div className="join-divider border border-borderColor bg-white rounded-md overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          className="join-item h-8 inline-flex shrink-0 flex-nowrap items-center gap-2 whitespace-nowrap border-0 bg-transparent text-textPrimary hover:bg-gray-50 px-3"
          disabled
        >
          {website ? (
            <DomainLogo
              domain={website.domain}
              iconUrl={website.iconUrl}
              size={20}
              alt={website.name}
              className="size-5! rounded"
            />
          ) : null}
          <h3 className="text-base font-normal">
            {website?.name || "Loading..."}
          </h3>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="join-item h-8 w-8 p-0 border-0 border-l border-borderColor bg-transparent text-textPrimary hover:bg-gray-50"
          asChild
        >
          <Link href={`/dashboard/${websiteId}/settings`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-settings size-4"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </Link>
        </Button>
      </div>
    </div>
  );
}
