import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 py-8 mt-auto bg-white">
      <div className="max-w-4xl mx-auto px-4 lg:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-stone-400 text-xs font-mono">© 2024 Postmetric Inc.</p>
        <div className="flex gap-6">
          <Link
            href="#"
            className="text-stone-400 hover:text-stone-600 text-xs font-mono uppercase"
          >
            Terms
          </Link>
          <Link
            href="#"
            className="text-stone-400 hover:text-stone-600 text-xs font-mono uppercase"
          >
            Privacy
          </Link>
          <Link
            href="#"
            className="text-stone-400 hover:text-stone-600 text-xs font-mono uppercase"
          >
            Status
          </Link>
        </div>
      </div>
    </footer>
  );
}
