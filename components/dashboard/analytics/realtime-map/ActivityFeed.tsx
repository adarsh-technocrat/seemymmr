"use client";

import { useMemo, useEffect, useRef } from "react";
import { Eye, CreditCard } from "lucide-react";
import {
  formatTimeAgo,
  generateVisitorName,
  type Visitor,
  type PaymentEvent,
  type PageViewEvent,
} from "@/utils/realtime-map";

interface ActivityFeedProps {
  visitors: Visitor[];
  paymentEvents: PaymentEvent[];
  pageViewEvents: PageViewEvent[];
  onVisitorClick?: (visitorId: string, userId?: string) => void;
}

function formatPaymentAmount(amount: number, currency: string = "usd"): string {
  const dollars = amount / 100;
  const currencySymbol = currency.toUpperCase() === "USD" ? "$" : "";
  return `${currencySymbol}${dollars.toFixed(2)}`;
}

export function ActivityFeed({
  visitors,
  paymentEvents,
  pageViewEvents,
  onVisitorClick,
}: ActivityFeedProps) {
  const playedPaymentIds = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/sound-effects/cash-register.mp3");
    audioRef.current.volume = 0.5;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current || paymentEvents.length === 0) return;
    const newPayments = paymentEvents.filter(
      (payment) => !playedPaymentIds.current.has(payment.id)
    );

    if (newPayments.length > 0) {
      newPayments.forEach((payment) => {
        playedPaymentIds.current.add(payment.id);
      });
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.log("Could not play sound effect:", error);
        });
      }
    }
  }, [paymentEvents]);

  // Memoize visitor names to ensure consistency across re-renders
  const visitorNames = useMemo(() => {
    const nameMap = new Map<string, string>();
    // Get names from visitors
    visitors.forEach((visitor) => {
      const key = visitor.userId || visitor.visitorId;
      if (!nameMap.has(key)) {
        nameMap.set(
          key,
          generateVisitorName(visitor.visitorId, visitor.userId)
        );
      }
    });
    // Get names from page view events
    pageViewEvents.forEach((pv) => {
      const key = pv.userId || pv.visitorId;
      if (!nameMap.has(key)) {
        nameMap.set(key, generateVisitorName(pv.visitorId, pv.userId));
      }
    });
    // Get names from payment events
    paymentEvents.forEach((payment) => {
      if (payment.visitorId && !nameMap.has(payment.visitorId)) {
        nameMap.set(payment.visitorId, generateVisitorName(payment.visitorId));
      }
    });
    return nameMap;
  }, [visitors, pageViewEvents, paymentEvents]);

  const activityItems = useMemo(() => {
    // Use page view events for activity feed (shows all individual events)
    const items: (PageViewEvent | PaymentEvent)[] = [
      ...pageViewEvents,
      ...paymentEvents,
    ];
    return items
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      })
      .slice(0, 20);
  }, [pageViewEvents, paymentEvents]);

  return (
    <div className="absolute bottom-0 left-0 z-10 max-h-[20vh] w-full max-w-full overflow-hidden bg-white/90 py-3 text-gray-700 ring-1 ring-gray-200 backdrop-blur-sm md:bottom-4 md:left-4 md:max-h-[30vh] md:w-96 md:rounded-box shadow-lg">
      <div className="hide-scrollbar max-h-[calc(20vh-40px)] overflow-y-auto md:mt-2 md:max-h-[calc(30vh-40px)]">
        <div className="space-y-1">
          {activityItems.map((item) => {
            // Check if it's a payment event
            if ("type" in item && item.type === "payment") {
              const payment = item as PaymentEvent;
              const customerName = payment.customerEmail
                ? payment.customerEmail.split("@")[0].toUpperCase()
                : payment.visitorId
                ? visitorNames.get(payment.visitorId) ||
                  generateVisitorName(payment.visitorId)
                : "Customer";

              return (
                <div
                  key={payment.id}
                  className="flex items-start gap-1.5 py-1 text-xs animate-opacity cursor-pointer px-3 duration-100 hover:bg-gray-100"
                  onClick={() => {
                    if (payment.visitorId && onVisitorClick) {
                      onVisitorClick(payment.visitorId);
                    }
                  }}
                >
                  <div className="mt-0.5 shrink-0">
                    <CreditCard className="h-3.5 w-3.5 text-success" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-gray-900">
                      {customerName}
                    </span>
                    <span className="text-gray-600"> made a </span>
                    <span className="font-medium text-success">
                      {formatPaymentAmount(payment.amount, payment.currency)}
                    </span>
                    <span className="text-gray-600"> payment</span>
                    <div className="mt-0 text-[10px] text-gray-500 opacity-60">
                      {formatTimeAgo(payment.timestamp)}
                    </div>
                  </div>
                  <span className="ml-auto mt-0.5 inline-flex size-1.5 rounded-full bg-primary"></span>
                </div>
              );
            }
            // It's a page view event
            const pageView = item as PageViewEvent;
            const visitorKey = pageView.userId || pageView.visitorId;
            const visitorName =
              visitorNames.get(visitorKey) ||
              generateVisitorName(pageView.visitorId, pageView.userId);

            return (
              <div
                key={pageView.id}
                className="flex items-start gap-1.5 py-1 text-xs cursor-pointer px-3 duration-100 hover:bg-gray-100"
                onClick={() => {
                  if (onVisitorClick) {
                    onVisitorClick(pageView.visitorId, pageView.userId);
                  }
                }}
              >
                <div className="mt-0.5 shrink-0">
                  <Eye className="h-3.5 w-3.5 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-900">
                    {visitorName}
                  </span>
                  <span className="text-gray-600"> from </span>
                  <span className="inline-flex items-baseline gap-1 truncate font-medium text-gray-900">
                    <div className="inline-flex shrink-0 overflow-hidden rounded-sm shadow-sm h-[10px] w-[15px]">
                      <img
                        src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${pageView.country}.svg`}
                        alt={`${pageView.country} flag`}
                        className="h-full w-full saturate-[0.9]"
                        loading="lazy"
                      />
                    </div>
                    <span className="font-medium text-gray-900">
                      {pageView.country}
                    </span>
                  </span>
                  <span className="text-gray-600"> visited </span>
                  <span
                    className="-mx-1 -my-0.5 ml-0 rounded bg-gray-100 px-1 py-0.5 font-mono text-[11px]! font-medium text-gray-900"
                    title={`Path: ${pageView.path} | Session: ${pageView.sessionId}`}
                  >
                    {pageView.path}
                  </span>
                  <div className="mt-0 text-[10px] text-gray-500">
                    {formatTimeAgo(pageView.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
