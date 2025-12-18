export function FeatureCards() {
  return (
    <div className="flex flex-col lg:flex-row border-t border-stone-200 lg:divide-x divide-stone-200">
      <div className="flex flex-col border-b lg:border-b-0 lg:border-y-0 border-stone-200 flex-1">
        <div className="py-8 px-6 lg:px-10 flex flex-col gap-6">
          <div className="w-10 h-10 rounded bg-stone-100 flex items-center justify-center border border-stone-200 text-stone-700">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20V10" />
              <path d="M18 20V4" />
              <path d="M6 20v-4" />
            </svg>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-stone-800 font-normal text-xl font-cooper">
              Revenue Attribution
            </h3>
            <p className="text-stone-500 font-normal text-sm leading-6">
              Know exactly which marketing channels are bringing in paying
              customers. Stop guessing and start scaling what works.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col border-b lg:border-b-0 lg:border-y-0 border-stone-200 flex-1">
        <div className="py-8 px-6 lg:px-10 flex flex-col gap-6">
          <div className="w-10 h-10 rounded bg-stone-100 flex items-center justify-center border border-stone-200 text-stone-700">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-stone-800 font-normal text-xl font-cooper">
              Customer Journey
            </h3>
            <p className="text-stone-500 font-normal text-sm leading-6">
              Track every touchpoint from first visit to purchase. Understand
              the path your customers take to conversion.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col border-b lg:border-b-0 lg:border-y-0 border-stone-200 flex-1">
        <div className="py-8 px-6 lg:px-10 flex flex-col gap-6">
          <div className="w-10 h-10 rounded bg-stone-100 flex items-center justify-center border border-stone-200 text-stone-700">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-stone-800 font-normal text-xl font-cooper">
              Privacy First
            </h3>
            <p className="text-stone-500 font-normal text-sm leading-6">
              GDPR, CCPA and PECR compliant. No cookies, no personal data
              collection. Your users' privacy is respected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
