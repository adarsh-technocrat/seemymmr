"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

const TESTIMONIALS: Array<{
  id: number;
  name: string;
  role: string;
  avatar: string;
  quote: string;
  company?: string;
}> = [
  {
    id: 1,
    name: "Rachel Kim",
    role: "Founder & CEO at Segment",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
    quote:
      "Thanks to Dread, we now understand our users better than ever. It's the backbone of our customer insights.",
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    role: "Founder & CEO",
    company: "GrowthLab",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    quote:
      "The revenue attribution feature is a game-changer. We cut our ad spend by 40% while increasing revenue by focusing on what actually works.",
  },
  {
    id: 3,
    name: "Emily Johnson",
    role: "Head of Analytics",
    company: "DataDriven Co",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    quote:
      "Real-time analytics with revenue tracking? This is exactly what we needed. PostMetric makes data-driven decisions so much easier.",
  },
  {
    id: 4,
    name: "David Park",
    role: "Product Manager",
    company: "SaaSify",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
    quote:
      "We've tried multiple analytics tools, but PostMetric's focus on revenue attribution sets it apart. Highly recommend!",
  },
  {
    id: 5,
    name: "Lisa Anderson",
    role: "CMO",
    company: "BrandBoost",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    quote:
      "The dashboard is intuitive and the insights are actionable. We've optimized our entire marketing strategy based on PostMetric data.",
  },
  {
    id: 6,
    name: "James Wilson",
    role: "Growth Lead",
    company: "ScaleUp",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
    quote:
      "Finally, an analytics tool that connects the dots between marketing spend and actual revenue. This is the future of marketing analytics.",
  },
];

export function TestimonialSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length
    );
  };

  const currentTestimonial = TESTIMONIALS[currentIndex];

  return (
    <section className="relative bg-white py-16 md:py-24 overflow-hidden">
      {/* SVG Background Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src="/testimonial-bg.svg"
          alt=""
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
      </div>

      {/* Testimonial Container */}
      <div className="relative max-w-5xl mx-auto px-10 md:px-16">
        <div className="relative h-[280px]">
          {/* Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-10 md:-translate-x-20 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-[#E2E2E2] flex items-center justify-center hover:bg-white hover:shadow-md transition-all z-10"
            aria-label="Previous testimonial"
          >
            <ArrowLeftIcon className="w-5 h-5 text-[#21262C]" size={20} />
          </button>

          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-10 md:translate-x-20 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-[#E2E2E2] flex items-center justify-center hover:bg-white hover:shadow-md transition-all z-10"
            aria-label="Next testimonial"
          >
            <ArrowRightIcon className="w-5 h-5 text-[#21262C]" size={20} />
          </button>

          {/* Testimonial Card */}
          <div className="relative h-full bg-white rounded-[40px] p-8 border border-[#E2E2E2]">
            {/* Testimonial Text */}
            <div className="absolute top-8 left-8 right-8">
              <p className="text-[32px] font-extrabold leading-[38px] tracking-[-1.6px] text-[#21262C] font-['Inter']">
                {currentTestimonial.quote}
              </p>
            </div>

            {/* Person Info */}
            <div className="absolute bottom-8 left-8 right-8 flex items-center gap-4">
              <div className="relative w-[70px] h-[70px] rounded-full overflow-hidden shrink-0">
                <Image
                  src={currentTestimonial.avatar}
                  alt={currentTestimonial.name}
                  width={70}
                  height={70}
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <div className="text-base font-semibold leading-[19px] text-[#21262C] font-['Inter']">
                  {currentTestimonial.name}
                </div>
                <div className="text-base font-light leading-[19px] tracking-[-0.48px] text-[#21262C] font-['Inter']">
                  {currentTestimonial.role}
                  {currentTestimonial.company &&
                    ` at ${currentTestimonial.company}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {TESTIMONIALS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-[#21262C] w-8"
                  : "bg-[#21262C]/30 hover:bg-[#21262C]/50"
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
