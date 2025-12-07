import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import { getWebsiteByTrackingCode } from "@/utils/database/website";

/**
 * Generate tracking script for a website
 * Usage: /api/track.js?site=TRACKING_CODE
 */
export async function GET(request: NextRequest) {
  const trackingCode = request.nextUrl.searchParams.get("site");

  if (!trackingCode) {
    return new NextResponse("// Tracking code required", {
      status: 400,
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  }

  // Validate tracking code format (should be 24-character hex string)
  // This prevents injection attacks by ensuring only valid format is accepted
  if (!/^[a-f0-9]{24}$/i.test(trackingCode)) {
    return new NextResponse("// Invalid tracking code format", {
      status: 400,
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  }

  // Verify tracking code exists in database to prevent unauthorized script generation
  try {
    await connectDB();
    const website = await getWebsiteByTrackingCode(trackingCode);
    if (!website) {
      return new NextResponse("// Website not found", {
        status: 404,
        headers: {
          "Content-Type": "application/javascript",
        },
      });
    }
  } catch (error) {
    console.error("Error verifying tracking code:", error);
    return new NextResponse("// Error verifying tracking code", {
      status: 500,
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Use JSON.stringify to safely escape values and prevent XSS/RCE
  // This ensures proper escaping of quotes, backslashes, and special characters
  const safeTrackingCode = JSON.stringify(trackingCode);
  const safeTrackUrl = JSON.stringify(
    `${appUrl}/api/track?site=${trackingCode}`
  );

  const script = `
(function() {
  'use strict';
  
  // Configuration
  var TRACKING_CODE = ${safeTrackingCode};
  var TRACK_URL = ${safeTrackUrl};
  var SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  // State
  var visitorId = getCookie('_df_vid');
  var sessionId = getCookie('_df_sid');
  var lastActivity = getCookie('_df_last') ? parseInt(getCookie('_df_last')) : Date.now();
  var userId = null;
  
  // Cookie utilities
  function getCookie(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
  
  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + value + expires + '; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }
  
  // Check if new session
  function isNewSession() {
    var now = Date.now();
    var timeSinceLastActivity = now - lastActivity;
    
    if (!sessionId || timeSinceLastActivity > SESSION_TIMEOUT) {
      return true;
    }
    return false;
  }
  
  // Track pageview
  function trackPageview(data) {
    data = data || {};
    var path = data.path || window.location.pathname + window.location.search;
    var title = data.title || document.title;
    var hostname = data.hostname || window.location.hostname;
    
    // Use pixel tracking for better compatibility
    var img = new Image(1, 1);
    img.src = TRACK_URL + 
      '&path=' + encodeURIComponent(path) +
      '&title=' + encodeURIComponent(title) +
      '&hostname=' + encodeURIComponent(hostname) +
      '&_=' + Date.now();
    
    // Update last activity
    setCookie('_df_last', Date.now().toString(), 365);
  }
  
  // Track custom goal
  function trackGoal(data) {
    if (!data || !data.event) {
      console.warn('PostMetric: Goal event name required');
      return;
    }
    
    var goalUrl = TRACK_URL.replace('/api/track', '/api/goals/track') + 
      '&event=' + encodeURIComponent(data.event) +
      (data.value ? '&value=' + encodeURIComponent(data.value) : '') +
      '&_=' + Date.now();
    
    var img = new Image(1, 1);
    img.src = goalUrl;
  }
  
  // Identify user
  function identify(data) {
    if (data && data.userId) {
      userId = data.userId;
      setCookie('_df_uid', userId, 365);
      
      // Send identification to server
      fetch(TRACK_URL.replace('/api/track', '/api/identify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: TRACKING_CODE,
          userId: data.userId,
          email: data.email,
          name: data.name,
          visitorId: getCookie('_df_vid'),
          sessionId: getCookie('_df_sid')
        })
      }).catch(function() {}); // Silently fail
    }
  }
  
  // Main tracking function
  function postMetric(method, type, data) {
    if (method === 'track') {
      if (type === 'pageview') {
        trackPageview(data);
      } else if (type === 'goal') {
        trackGoal(data);
      }
    } else if (method === 'identify') {
      identify(data);
    }
  }
  
  // Auto-track pageview
  trackPageview();
  
  // Track SPA navigation (for React, Vue, etc.)
  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(function() {
      trackPageview();
    }, 0);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    setTimeout(function() {
      trackPageview();
    }, 0);
  };
  
  // Track popstate (back/forward)
  window.addEventListener('popstate', function() {
    setTimeout(function() {
      trackPageview();
    }, 0);
  });
  
  // Expose global function
  window.postMetric = postMetric;
  
  // Scroll tracking (if enabled)
  var scrollTracked = false;
  window.addEventListener('scroll', function() {
    if (!scrollTracked) {
      scrollTracked = true;
      // Track scroll as a goal event
      trackGoal({ event: 'scroll', value: 0 });
    }
  }, { once: true });
})();
`;

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}
