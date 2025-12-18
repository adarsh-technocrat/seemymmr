import Image from "next/image";

export function DashboardPreview() {
  return (
    <div className="px-4 lg:px-6 pb-20">
      <div className="relative rounded-xl border border-stone-200 bg-stone-50/50 p-2 shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-white/50 pointer-events-none z-10"></div>
        <Image
          src="/dashboard-preview.png"
          alt="Dashboard Preview"
          width={1080}
          height={675}
          className="w-full h-auto rounded-lg shadow-lg border border-stone-200"
        />
      </div>
    </div>
  );
}
