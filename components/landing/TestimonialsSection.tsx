export function TestimonialsSection() {
  return (
    <div className="flex flex-col py-24 px-4 lg:px-6 gap-12 border-b border-stone-200">
      {/* Section Header */}
      <div className="flex flex-col gap-4 items-center text-center">
        <p className="text-stone-800 font-normal text-xs uppercase font-mono leading-4 tracking-wider">
          Wall of Love
        </p>
        <div className="flex flex-col gap-2 items-center max-w-2xl">
          <h2 className="text-stone-800 font-normal text-3xl lg:text-5xl font-cooper leading-tight">
            Loved by data-driven teams
          </h2>
          <p className="text-stone-500 font-normal text-base lg:text-lg leading-relaxed max-w-xl">
            Join thousands of founders and marketers who rely on DataFast to
            make better decisions every day.
          </p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 auto-rows-auto">
        {/* Item 1: Large Video Testimonial (Spans 2 cols, 2 rows on desktop) */}
        <div className="lg:col-span-2 lg:row-span-2 group relative border border-stone-200 bg-stone-50 overflow-hidden transition-all">
          <div className="absolute inset-0 bg-stone-900/5 group-hover:bg-stone-900/0 transition-colors z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1600&auto=format&fit=crop"
            alt="Video thumbnail"
            className="w-full h-full object-cover min-h-[320px] lg:min-h-[480px]"
          />

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <button className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border border-stone-200">
              <svg
                className="w-8 h-8 text-stone-800 ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 w-full p-6 lg:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20">
            <div className="flex flex-col gap-2">
              <p className="text-white font-cooper text-xl lg:text-2xl leading-tight">
                "DataFast completely changed how we allocate our marketing
                budget. The ROI tracking is insane."
              </p>
              <div className="flex items-center gap-3 mt-2">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
                  alt="User"
                  className="w-10 h-10 rounded-full border-2 border-white/20"
                />
                <div className="flex flex-col">
                  <span className="text-white font-mono text-xs font-bold uppercase tracking-wide">
                    Alex Morgan
                  </span>
                  <span className="text-white/80 text-xs">CMO at TechFlow</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Item 2: Text Testimonial */}
        <div className="bg-white p-6 lg:p-8 border border-stone-200 flex flex-col justify-between gap-6 hover:border-stone-300 transition-colors">
          <div className="flex flex-col gap-4">
            <div className="flex gap-1 text-brand-600">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <p className="text-stone-600 text-sm leading-6">
              "Finally an analytics tool that respects user privacy without
              sacrificing the data I actually need. The interface is beautiful
              and fast."
            </p>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
              alt="User"
              className="w-8 h-8 rounded-full bg-stone-100"
            />
            <div className="flex flex-col">
              <span className="text-stone-900 font-mono text-xs font-bold uppercase">
                Sarah Chen
              </span>
              <span className="text-stone-500 text-xs">Founder, Designify</span>
            </div>
          </div>
        </div>

        {/* Item 3: Text Testimonial */}
        <div className="bg-white p-6 lg:p-8 border border-stone-200 flex flex-col justify-between gap-6 hover:border-stone-300 transition-colors">
          <div className="flex flex-col gap-4">
            <div className="flex gap-1 text-brand-600">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <p className="text-stone-600 text-sm leading-6">
              "We switched from GA4 and haven't looked back. The revenue
              attribution feature alone paid for the subscription in the first
              week."
            </p>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces"
              alt="User"
              className="w-8 h-8 rounded-full bg-stone-100"
            />
            <div className="flex flex-col">
              <span className="text-stone-900 font-mono text-xs font-bold uppercase">
                Marcus Johnson
              </span>
              <span className="text-stone-500 text-xs">Head of Growth</span>
            </div>
          </div>
        </div>

        {/* Item 4: Vertical Video Testimonial */}
        <div className="row-span-2 group relative border border-stone-200 bg-stone-50 overflow-hidden transition-all">
          <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-stone-900/0 transition-colors z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop"
            alt="Video thumbnail"
            className="w-full h-full object-cover min-h-[300px]"
          />

          <div className="absolute inset-0 flex items-center justify-center z-20">
            <button className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border border-stone-200">
              <svg
                className="w-6 h-6 text-stone-800 ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
            <p className="text-white text-sm font-medium mb-2">
              "Simple, fast, and effective."
            </p>
            <div className="flex items-center gap-2">
              <span className="text-white/90 font-mono text-xs uppercase">
                Elena Rodriguez
              </span>
            </div>
          </div>
        </div>

        {/* Item 5: Text Testimonial (Wide) */}
        <div className="md:col-span-2 bg-white p-6 lg:p-8 border border-stone-200 flex flex-col md:flex-row items-center gap-6 hover:border-stone-300 transition-colors">
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex gap-1 text-brand-600">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <p className="text-stone-600 text-sm leading-6 font-medium">
              "I've tried every analytics tool out there. DataFast is the only
              one that gives me the data I need without the headache. It's built
              for makers, not data scientists."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex flex-col">
                <span className="text-stone-900 font-mono text-xs font-bold uppercase">
                  David Park
                </span>
                <span className="text-stone-500 text-xs">Indie Hacker</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-32 h-32 bg-stone-100 rounded-lg flex items-center justify-center border border-stone-200 shrink-0">
            <div className="text-center">
              <span className="block text-2xl font-bold text-stone-800">
                3x
              </span>
              <span className="text-xs text-stone-500 font-mono uppercase">
                Revenue
              </span>
            </div>
          </div>
        </div>

        {/* Item 6: Small Video Testimonial */}
        <div className="group relative border border-stone-200 bg-stone-50 overflow-hidden transition-all h-64 lg:h-auto">
          <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-stone-900/0 transition-colors z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=800&auto=format&fit=crop"
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 flex items-center justify-center z-20">
            <button className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border border-stone-200">
              <svg
                className="w-5 h-5 text-stone-800 ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>

          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-[10px] font-mono z-20">
            0:45
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="flex flex-col items-center gap-6 pt-8">
        <p className="text-stone-500 text-sm">Join 1,000+ happy customers</p>
        <button className="cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border border-stone-800 bg-stone-800 text-white px-6 py-3 rounded text-xs hover:bg-stone-700 transition-all">
          Start your free trial
        </button>
      </div>
    </div>
  );
}
