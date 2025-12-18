import Image from "next/image";

export function InsightsSection() {
  return (
    <div className="flex flex-col px-4 lg:px-6 gap-10 py-24">
      <div className="flex flex-col gap-4 items-center">
        <p className="text-stone-800 font-normal text-xs uppercase font-mono leading-4 tracking-wider">
          Insights
        </p>
        <div className="flex flex-col gap-2 items-center max-w-md">
          <h3 className="text-stone-800 font-normal text-3xl font-cooper text-center leading-tight">
            Understand your audience
          </h3>
          <p className="text-stone-500 font-normal text-sm text-center leading-relaxed">
            Visualize your traffic sources, user behavior, and conversion paths.
            Make data-driven decisions to improve your marketing ROI.
          </p>
        </div>
      </div>
      <div className="relative">
        <div className="relative w-full aspect-[16/9] bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
          <Image
            src="https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fchart.3ff767a4.png&w=1080&q=50"
            alt="Analytics Dashboard"
            width={1080}
            height={608}
            className="object-cover w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
