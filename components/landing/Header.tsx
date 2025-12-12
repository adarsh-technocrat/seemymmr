import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-textPrimary hover:text-gray-900 text-sm transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-textPrimary hover:text-gray-900 text-sm transition-colors"
            >
              Pricing
            </a>
            <a
              href="https://docs.postmetric.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-textPrimary hover:text-gray-900 text-sm transition-colors"
            >
              Docs
            </a>
            <a
              href="#"
              className="text-textPrimary hover:text-gray-900 text-sm transition-colors"
            >
              Blog
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="embossed">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}
