"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAYMENT_PROVIDERS = [
  {
    id: "stripe",
    label: "Stripe",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="size-3 md:size-4"
        fill="#5f6bea"
      >
        <path
          fillRule="evenodd"
          d="M111.328 15.602c0-4.97-2.415-8.9-7.013-8.9s-7.423 3.924-7.423 8.863c0 5.85 3.32 8.8 8.036 8.8 2.318 0 4.06-.528 5.377-1.26V19.22a10.246 10.246 0 0 1-4.764 1.075c-1.9 0-3.556-.67-3.774-2.943h9.497a39.64 39.64 0 0 0 .063-1.748zm-9.606-1.835c0-2.186 1.35-3.1 2.56-3.1s2.454.906 2.454 3.1zM89.4 6.712a5.434 5.434 0 0 0-3.801 1.509l-.254-1.208h-4.27v22.64l4.85-1.032v-5.488a5.434 5.434 0 0 0 3.444 1.265c3.472 0 6.64-2.792 6.64-8.957.003-5.66-3.206-8.73-6.614-8.73zM88.23 20.1a2.898 2.898 0 0 1-2.288-.906l-.03-7.2a2.928 2.928 0 0 1 2.315-.96c1.775 0 2.998 2 2.998 4.528.003 2.593-1.198 4.546-2.995 4.546zM79.25.57l-4.87 1.035v3.95l4.87-1.032z"
        />
        <path d="M74.38 7.035h4.87V24.04h-4.87z" />
        <path d="M69.164 8.47l-.302-1.434h-4.196V24.04h4.848V12.5c1.147-1.5 3.082-1.208 3.698-1.017V7.038c-.646-.232-2.913-.658-4.048 1.43zm-9.73-5.646L54.698 3.83l-.02 15.562c0 2.87 2.158 4.993 5.038 4.993 1.585 0 2.756-.302 3.405-.643v-3.95c-.622.248-3.683 1.138-3.683-1.72v-6.9h3.683V7.035h-3.683zM46.3 11.97c0-.758.63-1.05 1.648-1.05a10.868 10.868 0 0 1 4.83 1.25V7.6a12.815 12.815 0 0 0-4.83-.888c-3.924 0-6.557 2.056-6.557 5.488 0 5.37 7.375 4.498 7.375 6.813 0 .906-.78 1.186-1.863 1.186-1.606 0-3.68-.664-5.307-1.55v4.63a13.461 13.461 0 0 0 5.307 1.117c4.033 0 6.813-1.992 6.813-5.485 0-5.796-7.417-4.76-7.417-6.943zM13.88 9.515c0-1.37 1.14-1.9 2.982-1.9A19.661 19.661 0 0 1 25.6 9.876v-8.27A23.184 23.184 0 0 0 16.862.001C9.762.001 5 3.72 5 9.93c0 9.716 13.342 8.138 13.342 12.326 0 1.638-1.4 2.146-3.37 2.146-2.905 0-6.657-1.202-9.6-2.802v8.378A24.353 24.353 0 0 0 14.973 32C22.27 32 27.3 28.395 27.3 22.077c0-10.486-13.42-8.613-13.42-12.56z" />
      </svg>
    ),
  },
  {
    id: "lemonsqueezy",
    label: "LemonSqueezy",
    icon: (
      <svg
        className="size-3 md:size-4"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.92836 17.1856L14.4397 20.6583C15.3706 21.0889 16.0278 21.8116 16.3827 22.6406C17.2803 24.7399 16.0535 26.8869 14.1276 27.6591C12.2015 28.4309 10.1486 27.9342 9.21523 25.7511L5.94631 18.0866C5.693 17.4925 6.32934 16.9087 6.92836 17.1856"
          fill="#FFC233"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.37953 14.9376L15.1331 12.0066C17.71 11.0325 20.5249 12.8756 20.487 15.5536C20.4864 15.5886 20.4858 15.6235 20.4849 15.6588C20.4292 18.2666 17.6926 20.0194 15.1723 19.0968L7.38687 16.2473C6.76582 16.0201 6.76123 15.1713 7.37953 14.9376"
          fill="#FFC233"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.9449 13.9224L14.567 10.6837C17.0998 9.60736 17.7426 6.37695 15.7589 4.51043C15.7329 4.48585 15.7069 4.46156 15.6806 4.43728C13.7357 2.63207 10.5207 3.26767 9.41349 5.64539L5.99314 12.9915C5.72024 13.5773 6.33701 14.1806 6.9449 13.9224"
          fill="#FFC233"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.98349 12.6426L7.75465 5.04415C8.09822 4.102 8.03458 3.1412 7.67939 2.3122C6.77994 0.21378 4.34409 -0.463579 2.41853 0.309741C0.493284 1.08336 -0.594621 2.84029 0.340622 5.02253L3.63095 12.6787C3.8861 13.272 4.76261 13.2486 4.98349 12.6426"
          fill="#FFC233"
        />
      </svg>
    ),
  },
  {
    id: "polar",
    label: "Polar",
    icon: (
      <svg
        className="size-3 md:size-4"
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_1_4)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M66.4284 274.26C134.876 320.593 227.925 302.666 274.258 234.219C320.593 165.771 302.666 72.7222 234.218 26.3885C165.77 -19.9451 72.721 -2.0181 26.3873 66.4297C-19.9465 134.877 -2.01938 227.927 66.4284 274.26ZM47.9555 116.67C30.8375 169.263 36.5445 221.893 59.2454 256.373C18.0412 217.361 7.27564 150.307 36.9437 92.318C55.9152 55.2362 87.5665 29.3937 122.5 18.3483C90.5911 36.7105 62.5549 71.8144 47.9555 116.67ZM175.347 283.137C211.377 272.606 244.211 246.385 263.685 208.322C293.101 150.825 282.768 84.4172 242.427 45.2673C264.22 79.7626 269.473 131.542 252.631 183.287C237.615 229.421 208.385 265.239 175.347 283.137ZM183.627 266.229C207.945 245.418 228.016 210.604 236.936 168.79C251.033 102.693 232.551 41.1978 195.112 20.6768C214.97 47.3945 225.022 99.2902 218.824 157.333C214.085 201.724 200.814 240.593 183.627 266.229ZM63.7178 131.844C49.5155 198.43 68.377 260.345 106.374 280.405C85.9962 254.009 75.5969 201.514 81.8758 142.711C86.5375 99.0536 99.4504 60.737 116.225 35.0969C92.2678 55.983 72.5384 90.4892 63.7178 131.844ZM199.834 149.561C200.908 217.473 179.59 272.878 152.222 273.309C124.853 273.742 101.797 219.039 100.724 151.127C99.6511 83.2138 120.968 27.8094 148.337 27.377C175.705 26.9446 198.762 81.648 199.834 149.561Z"
            fill="currentColor"
          />
        </g>
        <defs>
          <clipPath id="clip0_1_4">
            <rect width="300" height="300" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    id: "shopify",
    label: "Shopify",
    icon: (
      <svg
        className="size-3 md:size-4"
        viewBox="0 0 225 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_164_2)">
          <path
            d="M196.197 50.2706C196.021 48.9906 194.9 48.2822 193.973 48.2042C193.048 48.127 173.473 46.6761 173.473 46.6761C173.473 46.6761 159.877 33.1791 158.385 31.6852C156.892 30.1921 153.976 30.6463 152.844 30.9794C152.678 31.0285 149.874 31.8938 145.236 33.329C140.695 20.2607 132.68 8.25152 118.58 8.25152C118.191 8.25152 117.79 8.2673 117.389 8.29009C113.379 2.98686 108.412 0.682861 104.121 0.682861C71.2752 0.682861 55.5829 41.7437 50.6628 62.6094C37.8996 66.5643 28.8326 69.3759 27.6745 69.7397C20.5503 71.9745 20.325 72.1989 19.3896 78.9119C18.6856 83.9942 0.0449219 228.151 0.0449219 228.151L145.297 255.366L223.999 238.34C223.999 238.34 196.371 51.5506 196.197 50.2706ZM137.208 35.8118L124.918 39.6159C124.922 38.7497 124.926 37.8975 124.926 36.9656C124.926 28.8437 123.799 22.3043 121.99 17.1203C129.256 18.0321 134.094 26.2986 137.208 35.8118ZM112.978 18.7309C114.998 23.7921 116.311 31.0557 116.311 40.8573C116.311 41.3588 116.307 41.8173 116.302 42.2811C108.309 44.7569 99.6237 47.4449 90.9188 50.1417C95.8065 31.2784 104.968 22.1676 112.978 18.7309ZM103.219 9.49294C104.637 9.49294 106.065 9.97426 107.432 10.915C96.905 15.8684 85.6217 28.344 80.8568 53.2575L60.7923 59.4717C66.3735 40.4689 79.6267 9.49294 103.219 9.49294Z"
            fill="#95BF46"
          />
          <path
            d="M193.973 48.2042C193.048 48.1271 173.472 46.6761 173.472 46.6761C173.472 46.6761 159.877 33.1791 158.385 31.6852C157.827 31.1294 157.074 30.8444 156.286 30.7217L145.304 255.364L223.999 238.34C223.999 238.34 196.37 51.5506 196.197 50.2706C196.021 48.9906 194.899 48.2822 193.973 48.2042Z"
            fill="#5E8E3E"
          />
          <path
            d="M118.579 91.6909L108.875 120.558C108.875 120.558 100.373 116.02 89.9502 116.02C74.6709 116.02 73.902 125.608 73.902 128.024C73.902 141.208 108.269 146.26 108.269 177.141C108.269 201.438 92.8592 217.083 72.0811 217.083C47.1474 217.083 34.3965 201.565 34.3965 201.565L41.0726 179.507C41.0726 179.507 54.1795 190.759 65.2392 190.759C72.466 190.759 75.4056 185.069 75.4056 180.912C75.4056 163.715 47.2105 162.947 47.2105 134.688C47.2105 110.904 64.2818 87.8877 98.7419 87.8877C112.02 87.8877 118.579 91.6909 118.579 91.6909Z"
            fill="white"
          />
        </g>
        <defs>
          <clipPath id="clip0_164_2">
            <rect width="224.461" height="256" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    id: "other",
    label: "Other",
    icon: null,
  },
];

const CURRENCIES = [
  { value: "AED", label: "AED - United Arab Emirates Dirham (AED)" },
  { value: "AUD", label: "AUD - Australian Dollar (AU$)" },
  { value: "BRL", label: "BRL - Brazilian Real (R$)" },
  { value: "CAD", label: "CAD - Canadian Dollar (CA$)" },
  { value: "CHF", label: "CHF - Swiss Franc (CHF)" },
  { value: "CNY", label: "CNY - Chinese Yuan (CN¥)" },
  { value: "CZK", label: "CZK - Czech Republic Koruna (Kč)" },
  { value: "EUR", label: "EUR - Euro (€)" },
  { value: "GBP", label: "GBP - British Pound Sterling (£)" },
  { value: "HKD", label: "HKD - Hong Kong Dollar (HK$)" },
  { value: "IDR", label: "IDR - Indonesian Rupiah (Rp)" },
  { value: "INR", label: "INR - Indian Rupee (Rs)" },
  { value: "JPY", label: "JPY - Japanese Yen (¥)" },
  { value: "KRW", label: "KRW - South Korean Won (₩)" },
  { value: "PLN", label: "PLN - Polish Zloty (zł)" },
  { value: "SGD", label: "SGD - Singapore Dollar (S$)" },
  { value: "USD", label: "USD - US Dollar ($)" },
];

interface RevenueSettingsProps {
  website: {
    _id: string;
    domain?: string;
    name?: string;
    settings?: {
      currency?: string;
      timezone?: string;
      colorScheme?: string;
      nickname?: string;
      additionalDomains?: string[];
      publicDashboard?: {
        enabled: boolean;
        shareId?: string;
      };
    };
    paymentProviders?: {
      stripe?: { apiKey?: string; webhookSecret?: string };
    };
  } | null;
  websiteId: string;
  onUpdate: () => void;
}

export function RevenueSettings({
  website,
  websiteId,
  onUpdate,
}: RevenueSettingsProps) {
  const [selectedProvider, setSelectedProvider] = useState("stripe");
  const [stripeApiKey, setStripeApiKey] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (website) {
      setCurrency((website.settings as any)?.currency || "USD");
    }
  }, [website]);

  const handleConnectStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentProviders: {
            stripe: {
              apiKey: stripeApiKey,
            },
          },
        }),
      });
      if (response.ok) {
        onUpdate();
        setStripeApiKey("");
      }
    } catch (error) {
      console.error("Error connecting Stripe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...website?.settings,
            currency,
          },
        }),
      });
      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating currency:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      {/* Payment Provider Setup */}
      <Card className="custom-card">
        <CardHeader>
          <CardTitle>Payment providers</CardTitle>
          <CardDescription>
            Connect your payment provider to track revenue and link it to your
            marketing campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            role="tablist"
            className="-m-1 grid rounded-xl bg-neutral/5 p-1 shadow-inner dark:bg-neutral/50"
            style={{
              gridTemplateColumns: "repeat(5, minmax(0px, 1fr))",
            }}
          >
            {PAYMENT_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                role="tab"
                onClick={() => setSelectedProvider(provider.id)}
                className={`flex cursor-pointer select-none items-center justify-center gap-1 rounded-lg px-1 py-1 text-sm font-medium transition-all md:gap-1.5 md:px-2 md:py-1.5 ${
                  selectedProvider === provider.id
                    ? "bg-base-100 shadow animate-popup"
                    : "hover:bg-neutral/50"
                }`}
              >
                {provider.icon && (
                  <span className="shrink-0">{provider.icon}</span>
                )}
                <span className="truncate">{provider.label}</span>
              </button>
            ))}
          </div>

          {/* Stripe Connection Form */}
          {selectedProvider === "stripe" && (
            <div className="space-y-8 pt-6">
              <div className="space-y-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-textPrimary">
                    <span className="w-4">1.</span>
                    <span>Connect Stripe</span>
                  </div>
                  <div className="text-sm text-textSecondary leading-relaxed pl-5">
                    Create a{" "}
                    <a
                      href="https://dashboard.stripe.com/apikeys/create?name=DataFast&permissions%5B%5D=rak_charge_read&permissions%5B%5D=rak_subscription_read&permissions%5B%5D=rak_customer_read&permissions%5B%5D=rak_payment_intent_read&permissions%5B%5D=rak_checkout_session_read&permissions%5B%5D=rak_invoice_read&permissions%5B%5D=rak_webhook_write"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group link text-base-content hover:text-primary inline-flex items-center gap-1"
                    >
                      restricted API key
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="inline size-3.5 -translate-x-px translate-y-px duration-200 group-hover:translate-x-0 group-hover:translate-y-0"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.22 11.78a.75.75 0 0 1 0-1.06L9.44 5.5H5.75a.75.75 0 0 1 0-1.5h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V6.56l-5.22 5.22a.75.75 0 0 1-1.06 0Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </a>{" "}
                    (do not change any permissions) and paste the API key below:
                  </div>
                </div>
                <form className="space-y-2 pl-5" onSubmit={handleConnectStripe}>
                  <Input
                    required
                    autoComplete="off"
                    placeholder="rk_live_******************"
                    className="input input-sm input-bordered w-full placeholder:opacity-70"
                    type="text"
                    value={stripeApiKey}
                    onChange={(e) => setStripeApiKey(e.target.value)}
                  />
                  <Button
                    type="submit"
                    className="btn btn-neutral btn-sm btn-block"
                    disabled={loading}
                  >
                    Connect
                  </Button>
                </form>
              </div>

              <div className="space-y-4 opacity-50">
                <div className="space-y-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-semibold text-textPrimary">
                      <span className="w-4">2.</span>
                      <span>Link with traffic</span>
                    </div>
                    <div className="text-sm text-textSecondary leading-relaxed pl-5">
                      Make revenue-driven decisions by linking your revenue data
                      with your traffic data.{" "}
                      <span className="inline-flex flex-row items-center gap-1">
                        <a
                          href="/docs/revenue-attribution/get-started"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="peer link font-medium text-base-content hover:text-primary"
                        >
                          Get started here
                        </a>{" "}
                        (it takes 2 minutes).
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Providers Placeholder */}
          {selectedProvider !== "stripe" && (
            <div className="py-8 text-center text-textSecondary">
              <p>
                {selectedProvider.charAt(0).toUpperCase() +
                  selectedProvider.slice(1)}{" "}
                integration coming soon.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Currency Selector */}
      <Card className="custom-card">
        <form onSubmit={handleSaveCurrency}>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
            <CardDescription>
              Used for all revenue reporting and payment conversion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="input-sm w-full border-base-content/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                disabled={loading}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </section>
  );
}
