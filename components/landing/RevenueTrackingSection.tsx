import Image from "next/image";

export function RevenueTrackingSection() {
  return (
    <div className="flex flex-col px-4 lg:px-6 gap-10 py-24 border-t border-stone-200">
      <div className="flex flex-col gap-4 items-center justify-center">
        <p className="text-stone-800 font-normal text-xs uppercase font-mono leading-4 tracking-wider">
          Revenue Tracking
        </p>
        <div className="flex flex-col gap-2 items-center max-w-md">
          <h3 className="text-stone-800 font-normal text-3xl font-cooper text-center leading-tight">
            Connect revenue to sources
          </h3>
          <p className="text-stone-500 font-normal text-sm text-center leading-relaxed">
            See exactly how much revenue each marketing channel generates. Opti
            mize your ad spend and focus on what brings in cash.
          </p>
        </div>
      </div>
      <div className="relative w-full aspect-[16/9] bg-stone-50 rounded-xl border border-stone-200 overflow-hidden flex items-center justify-center">
        <Image
          src="https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Frevenue_2.d41716c4.png&w=3840&q=75"
          alt="Revenue Tracking"
          width={3840}
          height={2160}
          className="object-contain w-full h-full"
        />
      </div>
    </div>
  );
}
