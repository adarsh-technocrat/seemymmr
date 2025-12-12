"use client";

import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-[#282828] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Say Hello!
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Get in touch with us and let's create something amazing together
          </p>
        </div>

        {/* Newsletter Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4">
              Stay up to date with our news
            </h3>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div>
            <h3 className="font-semibold mb-4 text-white/90">Email Address</h3>
            <p className="text-white/70">hello@postmetric.io</p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-white/90">Contact</h3>
            <p className="text-white/70">
              20, Petersburg st, Brooklyn, NY 11211, USA
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-white/90">Website</h3>
            <p className="text-white/70">postmetric.io</p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-white/90">Phone</h3>
            <p className="text-white/70">+1 (123) 123-1234</p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-white/90">Legal</h3>
            <p className="text-white/70">Refund Policy</p>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/10 pt-8">
          <div>
            <h3 className="text-2xl font-bold mb-2">Instagram</h3>
            <a
              href="#"
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              Follow along →
            </a>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">TikTok</h3>
            <a
              href="#"
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              Follow along →
            </a>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">Youtube</h3>
            <a
              href="#"
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              Follow along →
            </a>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">LinkedIn</h3>
            <a
              href="#"
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              Follow along →
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/60 text-sm">
          © 2025 PostMetric. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
