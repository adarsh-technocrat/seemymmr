import Image from "next/image";

const INTEGRATIONS = [
  {
    name: "Next.js",
    image:
      "https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon-nextjs.3a58dc60.png&w=256&q=75",
  },
  {
    name: "React",
    image:
      "https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon-reactrouter.b724a1f1.png&w=256&q=75",
  },
  {
    name: "Vue",
    image:
      "https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon-vuejs.010f3bde.png&w=256&q=75",
  },
  {
    name: "PHP",
    image:
      "https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon-php.858345a0.png&w=256&q=75",
  },
  {
    name: "Laravel",
    image:
      "https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon-laravel.dd822c6e.png&w=256&q=75",
  },
  {
    name: "WordPress",
    image:
      "https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon-wp.e47770d1.png&w=256&q=75",
  },
  {
    name: "Webflow",
    image:
      "https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon-webflow.baf6b80a.png&w=256&q=75",
  },
  {
    name: "Framer",
    image:
      "https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon-framer.06f8bb07.png&w=256&q=75",
  },
  {
    name: "Shopify",
    image:
      "https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon-shopify.a664161d.png&w=256&q=75",
  },
  {
    name: "Squarespace",
    image:
      "https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon-squarespace.0cda12b3.png&w=256&q=75",
  },
  {
    name: "Wix",
    image:
      "https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon-wix.34f61b06.png&w=256&q=75",
  },
  {
    name: "Ghost",
    image:
      "https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon-ghostcms.36b39cb0.png&w=256&q=75",
  },
];

export function IntegrationsSection() {
  return (
    <div className="flex flex-col w-full px-4 lg:px-6 gap-10 items-center py-24">
      <div className="flex flex-col gap-4 items-center max-w-2xl">
        <p className="text-stone-800 font-normal text-xs uppercase font-mono leading-4 tracking-wider">
          Integrations
        </p>
        <div className="flex flex-col gap-2 items-center">
          <h3 className="text-stone-800 font-normal text-3xl lg:text-4xl font-cooper text-center leading-tight">
            Works with your stack
          </h3>
          <p className="text-stone-500 font-normal text-base text-center leading-relaxed">
            Install in minutes. Compatible with all major frameworks and
            platforms.
          </p>
        </div>
      </div>

      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-8">
          {INTEGRATIONS.map((integration, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <Image
                  src={integration.image}
                  alt={integration.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain grayscale hover:grayscale-0 transition-all"
                />
              </div>
              <span className="text-xs font-medium text-stone-600 text-center">
                {integration.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
