"use client";

import { PricingContent } from "./PricingContent";

export function PricingPageContent() {
  return (
    <div className="flex flex-col w-full">
      <PricingContent showHeader={true} showBillingToggle={true} />
    </div>
  );
}
