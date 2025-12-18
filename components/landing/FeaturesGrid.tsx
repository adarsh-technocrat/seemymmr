const FEATURES = [
  {
    icon: (
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
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: "Real-time Data",
    description:
      "See visitors on your site as they arrive. Watch conversions happen in real-time.",
  },
  {
    icon: (
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
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    title: "Event Tracking",
    description:
      "Track custom events like button clicks, form submissions, and video plays easily.",
  },
  {
    icon: (
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
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Privacy Focused",
    description:
      "We don't use cookies and we don't track personal data. Compliant with GDPR, CCPA.",
  },
  {
    icon: (
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
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: "Lightweight Script",
    description:
      "Our script is less than 1kb. It won't slow down your site or affect your SEO score.",
  },
  {
    icon: (
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
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: "Email Reports",
    description:
      "Get weekly or monthly email reports with your key metrics delivered to your inbox.",
  },
  {
    icon: (
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
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Team Access",
    description:
      "Invite your team members to view your analytics. Control permissions and access levels.",
  },
];

export function FeaturesGrid() {
  return (
    <div className="flex flex-col gap-6 items-center py-20">
      <div className="flex flex-col gap-4 items-center lg:px-6 px-4">
        <p className="text-stone-800 font-normal text-xs uppercase font-mono leading-4">
          Features
        </p>
        <p className="text-stone-800 font-normal text-2xl leading-120 text-center font-cooper lg:whitespace-pre-line">
          Everything you need to grow your business
        </p>
      </div>

      <ul className="grid w-full grid-cols-2 lg:grid-cols-3 border-t border-b lg:border-b-stone-50 border-stone-200 divide-x divide-stone-200">
        {FEATURES.map((feature, index) => {
          const isLastRow = index >= 3;
          const isSecondCol = index % 3 === 1;
          const isLastItem = index === FEATURES.length - 1;

          return (
            <li
              key={index}
              className={`${
                isLastRow
                  ? "border-b-stone-50 lg:border-b-stone-200"
                  : "border-b border-stone-200"
              } h-full flex flex-col ${
                isSecondCol ? "border-r-stone-50 lg:border-r-stone-200" : ""
              } ${isLastItem ? "border-r lg:border-b" : ""}`}
            >
              <div className="flex flex-col gap-4 py-6 px-4 lg:px-6">
                <span className="text-stone-800">{feature.icon}</span>
                <div className="flex flex-col gap-2">
                  <p className="text-stone-800 font-medium text-sm font-mono leading-5 uppercase">
                    {feature.title}
                  </p>
                  <p className="text-stone-500 font-normal text-sm leading-5 text-justify">
                    {feature.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
