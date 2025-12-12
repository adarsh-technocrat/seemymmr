import Image from "next/image";

export function DashboardSection() {
  return (
    <section className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-16 md:pb-24 overflow-visible">
      <div className="relative w-full max-w-full sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1220px] mx-auto">
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center -m-12 sm:-m-24 md:-m-32 lg:-m-[200px]">
          <Image
            src="/dashboard-frame.svg"
            alt="Dashboard Frame"
            width={1250}
            height={982}
            className="w-full h-auto opacity-50 sm:opacity-100"
          />
        </div>
        {/* Dashboard Preview Image */}
        <div className="relative w-full z-10 flex items-center justify-center pt-8 sm:pt-12 md:pt-16 lg:pt-[70px]">
          <div className="w-full max-w-full sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1220px] mx-auto px-0 sm:px-2 md:px-4">
            <img
              src="/dashboard-preview.png"
              alt="Dashboard Preview"
              className="w-full h-auto mx-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
