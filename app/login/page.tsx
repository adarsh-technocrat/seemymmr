"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleAuth = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <section className="flex w-full flex-col items-center justify-center px-4 py-16 md:px-8 lg:w-1/2">
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-sm md:p-8 md:px-12">
          <div className="mb-8 flex flex-col items-start justify-center gap-4">
            <div className="space-y-1 md:space-y-2">
              <Link
                href="/"
                className="inline-flex cursor-pointer items-center justify-center gap-2 duration-200 hover:opacity-80"
              >
                <Image
                  src="https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon.3a869d3d.png&w=128&q=75"
                  alt="seeMoreThanMMR Logo"
                  width={40}
                  height={40}
                  className="h-8 w-8 md:h-10 md:w-10"
                  unoptimized
                />
              </Link>
              <h1 className="text-xl font-bold text-textPrimary md:text-2xl">
                Sign in to seeMoreThanMMR
              </h1>
            </div>
            <div className="text-sm text-textSecondary">
              <span>
                If you already have an account, sign in to seeMoreThanMMR to get
                started. Or{" "}
                <Link
                  href="/signup"
                  className="text-textPrimary underline hover:opacity-80"
                >
                  create an account
                </Link>{" "}
                to start your 14-day free trial.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-textPrimary transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-textSecondary">or</span>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-textPrimary"
              >
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-borderColor bg-white px-4 py-3 text-sm text-textPrimary placeholder-textSecondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
              style={{
                boxShadow:
                  "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.06) 0px 1px 1px 0px, rgba(225, 101, 64, 0.157) 0px 0px 0px 1px, rgba(225, 101, 64, 0.64) 0px 8px 16px -8px, rgba(181, 81, 51, 0.48) 0px -1px 2px 0px inset",
              }}
            >
              Sign up with email
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-1.5 text-center text-sm text-textSecondary opacity-75">
          <p>
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <span className="mx-2">·</span>
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
          </p>
          <p>
            <span className="cursor-pointer hover:underline">
              © 2024 seeMoreThanMMR
            </span>
          </p>
        </div>
      </section>

      <div className="hidden h-screen w-1/2 overflow-hidden border-l border-gray-200 lg:block">
        <div className="relative h-full w-full">
          <Image
            src="https://image.mux.com/IAD2rWZEhEc6Mzo3YyejHhnOQpwk00vfIEHdfpUBV5yU/thumbnail.webp"
            alt="seeMoreThanMMR Dashboard Preview"
            fill
            className="object-cover brightness-90"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}
