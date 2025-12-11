/**
 * PostMetric Analytics Tracking Script
 * 
 * This script tracks pageviews, custom events, user identification, and more.
 * It's designed to be privacy-friendly and bot-resistant.
 */

(function() {
  'use strict';

  // Get the current script element to read data attributes
  const script = document.currentScript;
  const DATA_PREFIX = 'data-';
  const getAttr = script.getAttribute.bind(script);

  // Get configuration from script tag data attributes
  const websiteId = getAttr(DATA_PREFIX + 'website-id');
  const domain = getAttr(DATA_PREFIX + 'domain');
  
  // Determine API URL from script src
  function getApiUrl() {
    try {
      const scriptSrc = script.src;
      const scriptUrl = new URL(scriptSrc);
      // Construct API URL from script origin
      // If script is at /js/script.js, API will be at /api/track
      return new URL('/api/track', scriptUrl.origin).href;
    } catch (e) {
      // Fallback to relative path
      return '/api/track';
    }
  }
  
  const DEFAULT_API_URL = getApiUrl();

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Check if hostname is localhost
   */
  function isLocalhost(hostname) {
    if (!hostname) return false;
    const h = hostname.toLowerCase();
    return (
      ['localhost', '127.0.0.1', '::1'].includes(h) ||
      /^127(\.[0-9]+){0,3}$/.test(h) ||
      /^(\[)?::1?\]?$/.test(h) ||
      h.endsWith('.local') ||
      h.endsWith('.localhost')
    );
  }

  /**
   * Detect if the current visitor is a bot
   */
  function isBot() {
    try {
      // Check for automation tools
      if (
        window.navigator.webdriver === true ||
        window.callPhantom ||
        window._phantom ||
        window.__nightmare
      ) {
        return true;
      }

      // Check for required objects
      if (
        !window.navigator ||
        !window.location ||
        !window.document ||
        typeof window.navigator !== 'object' ||
        typeof window.location !== 'object' ||
        typeof window.document !== 'object'
      ) {
        return true;
      }

      const nav = window.navigator;

      // Check user agent
      if (
        !nav.userAgent ||
        nav.userAgent === '' ||
        nav.userAgent === 'undefined' ||
        nav.userAgent.length < 5
      ) {
        return true;
      }

      const ua = nav.userAgent.toLowerCase();

      // Check for known bot user agents
      if (
        ua.includes('headlesschrome') ||
        ua.includes('phantomjs') ||
        ua.includes('selenium') ||
        ua.includes('webdriver') ||
        ua.includes('puppeteer') ||
        ua.includes('playwright')
      ) {
        return true;
      }

      // Check for automation framework properties
      const automationProps = [
        '__webdriver_evaluate',
        '__selenium_evaluate',
        '__webdriver_script_function',
        '__webdriver_unwrapped',
        '__fxdriver_evaluate',
        '__driver_evaluate',
        '_Selenium_IDE_Recorder',
        '_selenium',
        'calledSelenium',
        '$cdc_asdjflasutopfhvcZLmcfl_',
      ];

      for (const prop of automationProps) {
        if (window[prop] !== undefined) {
          return true;
        }
      }

      // Check document attributes
      if (document.documentElement) {
        if (
          document.documentElement.getAttribute('webdriver') ||
          document.documentElement.getAttribute('selenium') ||
          document.documentElement.getAttribute('driver')
        ) {
          return true;
        }
      }

      // Check for HTTP client user agents
      if (
        ua.includes('python') ||
        ua.includes('curl') ||
        ua.includes('wget') ||
        ua.includes('java/') ||
        ua.includes('go-http') ||
        ua.includes('node.js') ||
        ua.includes('axios') ||
        ua.includes('postman')
      ) {
        return true;
      }
    } catch (e) {
      return false;
    }

    return false;
  }

  /**
   * Set a cookie
   */
  function setCookie(name, value, days) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }

    let cookie = name + '=' + (value || '') + expires + '; path=/';

    // Set domain for non-localhost
    if (!isLocalhost(window.location.hostname) && window.location.protocol !== 'file:') {
      const hostname = window.location.hostname;
      const domain = getAttr(DATA_PREFIX + 'domain');
      
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        cookie += '; domain=.' + domain.replace(/^\./, '');
      } else {
        cookie += '; domain=.' + hostname.replace(/^\./, '');
      }
    }

    // Add Secure and SameSite attributes for HTTPS
    if (window.location.protocol === 'https:') {
      cookie += '; Secure';
    }
    cookie += '; SameSite=Lax';

    document.cookie = cookie;
  }

  /**
   * Get a cookie value
   */
  function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }

  /**
   * Generate UUID v4
   */
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get or generate visitor ID
   */
  function getVisitorId() {
    // Check URL parameter first
    let vid = (function() {
      try {
        return new URL(window.location.href).searchParams.get('_pm_vid') || null;
      } catch {
        return null;
      }
    })();

    if (vid) {
      setCookie('_pm_vid', vid, 365);
      // Clean URL
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('_pm_vid') || url.searchParams.has('_pm_sid')) {
          url.searchParams.delete('_pm_vid');
          url.searchParams.delete('_pm_sid');
          window.history.replaceState({}, '', url.toString());
        }
      } catch {}
      return vid;
    }

    // Check cookie
    vid = getCookie('_pm_vid');
    
    if (!vid) {
      vid = generateUUID();
      setCookie('_pm_vid', vid, 365);
    }

    return vid;
  }

  /**
   * Get or generate session ID
   */
  function getSessionId() {
    // Check URL parameter first
    let sid = (function() {
      try {
        return new URL(window.location.href).searchParams.get('_pm_sid') || null;
      } catch {
        return null;
      }
    })();

    if (sid) {
      setCookie('_pm_sid', sid, 1/48); // 30 minutes
      return sid;
    }

    // Check cookie
    sid = getCookie('_pm_sid');
    
    if (!sid) {
      sid = 's' + generateUUID();
      setCookie('_pm_sid', sid, 1/48); // 30 minutes
    }

    return sid;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  // Process queued calls
  let queuedCalls = [];
  if (window.postmetric && window.postmetric.q && Array.isArray(window.postmetric.q)) {
    queuedCalls = window.postmetric.q.map(call => Array.from(call));
  }

  // Check if tracking is enabled
  let trackingEnabled = true;
  let disabledReason = '';

  // Bot detection
  if (trackingEnabled && isBot()) {
    trackingEnabled = false;
    disabledReason = 'Tracking disabled - bot detected';
  }

  // Localhost and file protocol checks
  const allowFileProtocol = getAttr(DATA_PREFIX + 'allow-file-protocol') === 'true';
  const allowLocalhost = getAttr(DATA_PREFIX + 'allow-localhost') === 'true';

  if (
    trackingEnabled &&
    ((isLocalhost(window.location.hostname) && !allowLocalhost) ||
     (window.location.protocol === 'file:' && !allowFileProtocol))
  ) {
    trackingEnabled = false;
    disabledReason =
      window.location.protocol === 'file:'
        ? "Tracking disabled on file protocol (use data-allow-file-protocol='true' to enable)"
        : "Tracking disabled on localhost (use data-allow-localhost='true' to enable)";
  }

  // Iframe check
  const debug = getAttr(DATA_PREFIX + 'debug') === 'true';
  const disableConsole = getAttr(DATA_PREFIX + 'disable-console') === 'true';

  if (trackingEnabled && window !== window.parent && !debug) {
    trackingEnabled = false;
    disabledReason = 'Tracking disabled inside an iframe';
  }

  // Required configuration (already set above from data attributes)
  const allowedHostnames = getAttr(DATA_PREFIX + 'allowed-hostnames');
  const allowedHostnamesList = allowedHostnames
    ? allowedHostnames.split(',').map(h => h.trim()).filter(Boolean)
    : [];

  if (!trackingEnabled || (!websiteId || !domain)) {
    trackingEnabled = false;
    disabledReason = 'Missing website ID or domain';
  }

  // ============================================================================
  // Logging
  // ============================================================================

  function log(level, message, ...args) {
    if (disableConsole) return;
    
    const prefix = 'PostMetric:';
    switch (level) {
      case 'info':
      default:
        console.log(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'error':
        console.error(prefix, message, ...args);
        break;
    }
  }

  // ============================================================================
  // API Configuration
  // ============================================================================

  // Determine API URL
  let apiUrl;
  const customApiUrl = getAttr(DATA_PREFIX + 'api-url');

  if (customApiUrl) {
    try {
      new URL(customApiUrl);
      apiUrl = customApiUrl;
    } catch {
      try {
        apiUrl = new URL(customApiUrl, window.location.origin).href;
      } catch {
        log('error', `Could not construct valid URL from data-api-url "${customApiUrl}". Falling back to ${DEFAULT_API_URL}`);
        apiUrl = DEFAULT_API_URL;
      }
    }
  } else {
    // Use the API URL determined from script location
    apiUrl = DEFAULT_API_URL;
  }

  // ============================================================================
  // Data Collection
  // ============================================================================

  /**
   * Collect page data
   */
  function collectPageData() {
    const href = window.location.href;
    if (!href) {
      log('warn', 'Unable to collect href. This may indicate incorrect script implementation or browser issues.');
      return;
    }

    const url = new URL(href);
    const adClickIds = {};

    // Extract ad click IDs
    const fbclid = url.searchParams.get('fbclid');
    const gclid = url.searchParams.get('gclid');
    const gclsrc = url.searchParams.get('gclsrc');
    const wbraid = url.searchParams.get('wbraid');
    const gbraid = url.searchParams.get('gbraid');
    const li_fat_id = url.searchParams.get('li_fat_id');
    const msclkid = url.searchParams.get('msclkid');
    const ttclid = url.searchParams.get('ttclid');
    const twclid = url.searchParams.get('twclid');

    if (gclid) adClickIds.gclid = gclid;
    if (gclsrc) adClickIds.gclsrc = gclsrc;
    if (wbraid) adClickIds.wbraid = wbraid;
    if (gbraid) adClickIds.gbraid = gbraid;
    if (li_fat_id) adClickIds.li_fat_id = li_fat_id;
    if (fbclid) adClickIds.fbclid = fbclid;
    if (msclkid) adClickIds.msclkid = msclkid;
    if (ttclid) adClickIds.ttclid = ttclid;
    if (twclid) adClickIds.twclid = twclid;

    return {
      websiteId: websiteId,
      domain: domain,
      href: href,
      referrer: document.referrer || null,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      adClickIds: Object.keys(adClickIds).length > 0 ? adClickIds : undefined,
    };
  }

  // ============================================================================
  // Event Tracking
  // ============================================================================

  /**
   * Send event to API
   */
  function sendEvent(eventData, callback) {
    // Check localStorage flag
    if (localStorage.getItem('postmetric_ignore') === 'true') {
      log('info', 'Event ignored - tracking disabled via localStorage flag');
      if (callback) callback({ status: 200 });
      return;
    }

    // Check bot
    if (isBot()) {
      log('info', 'Event ignored - bot detected');
      if (callback) callback({ status: 200 });
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl + '?site=' + encodeURIComponent(websiteId), true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          log('info', `${eventData.type || 'Event'} tracked successfully`);
          // Refresh session cookie
          setCookie('_pm_sid', getSessionId(), 1/48);
        } else {
          log('error', `Failed to track ${eventData.type || 'event'} - HTTP ${xhr.status}`);
        }
        if (callback) callback({ status: xhr.status });
      }
    };

    xhr.send(JSON.stringify(eventData));
  }

  /**
   * Track pageview
   */
  let lastPageviewTime = 0;
  let lastPageviewUrl = '';

  function trackPageview(callback) {
    if (!trackingEnabled) {
      log('info', `Pageview ignored - ${disabledReason}`);
      if (callback) callback({ status: 200 });
      return;
    }

    const now = Date.now();
    const currentUrl = window.location.href;

    // Throttle: ignore if same URL within 1 minute
    if (currentUrl === lastPageviewUrl && now - lastPageviewTime < 60000) {
      log('info', 'Pageview ignored - throttled (same URL within 1 minute)');
      if (callback) callback({ status: 200 });
      return;
    }

    lastPageviewTime = now;
    lastPageviewUrl = currentUrl;

    // Save to sessionStorage
    try {
      sessionStorage.setItem(
        'postmetric_pageview_state',
        JSON.stringify({ time: now, url: currentUrl })
      );
    } catch (e) {}

    const eventData = collectPageData();
    eventData.type = 'pageview';
    eventData.path = window.location.pathname + window.location.search;
    eventData.title = document.title;
    eventData.hostname = window.location.hostname;

    sendEvent(eventData, callback);
  }

  /**
   * Track payment event
   */
  function trackPayment(provider, sessionId, callback) {
    if (!trackingEnabled) {
      log('info', `Payment event ignored - ${disabledReason}`);
      if (callback) callback({ status: 200 });
      return;
    }

    const eventData = collectPageData();
    eventData.type = 'payment';

    if (provider === 'stripe') {
      eventData.extraData = { stripe_session_id: sessionId };
    } else if (provider === 'lemonsqueezy') {
      eventData.extraData = { lemonsqueezy_order_id: sessionId };
    } else if (provider === 'polar') {
      eventData.extraData = { polar_checkout_id: sessionId };
    }

    sendEvent(eventData, callback);
  }

  /**
   * Track custom goal event
   */
  function trackGoal(eventName, customData, callback) {
    if (!trackingEnabled) {
      log('info', `Custom event '${eventName}' ignored - ${disabledReason}`);
      if (callback) callback({ status: 200 });
      return;
    }

    // Use GET endpoint for goals (backward compatibility)
    const goalUrl =
      apiUrl.replace('/api/track', '/api/goals/track') +
      '?site=' +
      encodeURIComponent(websiteId) +
      '&event=' +
      encodeURIComponent(eventName) +
      (customData && customData.value ? '&value=' + encodeURIComponent(customData.value) : '') +
      '&path=' +
      encodeURIComponent(window.location.pathname + window.location.search);

    const img = new Image(1, 1);
    img.src = goalUrl;
    
    if (callback) callback({ status: 200 });
  }

  /**
   * Sanitize custom data
   */
  function sanitizeCustomData(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      log('warn', 'customData must be a non-null object');
      return {};
    }

    const sanitized = {};
    let paramCount = 0;

    function sanitizeValue(value) {
      if (value == null) return '';
      let str = String(value);
      // Limit length to prevent DoS
      if (str.length > 255) str = str.substring(0, 255);
      // Remove XSS vectors
      str = str
        .replace(/[<>'"&]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/data:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/expression\(/gi, '')
        .replace(/import\s+/gi, '')
        .replace(/@import/gi, '')
        .trim();
      return str;
    }

    for (const [key, value] of Object.entries(data)) {
      if (key === 'eventName') {
        sanitized[key] = sanitizeValue(value);
        continue;
      }

      if (paramCount >= 10) {
        log('error', 'Maximum 10 custom parameters allowed');
        return null;
      }

      if (
        typeof key !== 'string' ||
        key.length === 0 ||
        key.length > 32 ||
        !/^[a-z0-9_-]+$/.test(key.toLowerCase())
      ) {
        log(
          'error',
          `Invalid property name "${key}". Use only lowercase letters, numbers, underscores, and hyphens. Max 32 characters.`
        );
        return null;
      }

      const lowerKey = key.toLowerCase();
      sanitized[lowerKey] = sanitizeValue(value);
      paramCount++;
    }

    return sanitized;
  }

  /**
   * Main tracking function (public API)
   */
  function postmetric(eventName, customData, callback) {
    if (!trackingEnabled) {
      log('info', `Event '${eventName}' ignored - ${disabledReason}`);
      return;
    }

    if (!eventName) {
      log('warn', 'Missing event_name for custom event');
      return;
    }

    // Payment event
    if (eventName === 'payment') {
      if (!customData || !customData.email) {
        log('warn', 'Missing email for payment event');
        return;
      }
      trackGoal(eventName, { email: customData.email }, callback);
      return;
    }

    // Identify event
    if (eventName === 'identify') {
      if (!customData || !customData.user_id) {
        log('warn', 'Missing user_id for identify event');
        return;
      }

      identifyUser(customData.user_id, customData, callback);
      return;
    }

    // Custom event
    const sanitized = sanitizeCustomData(customData || {});
    if (sanitized === null) {
      log('error', 'Custom event rejected due to validation errors');
      return;
    }

    trackGoal('custom', { eventName: eventName, ...sanitized }, callback);
  }

  /**
   * Identify user
   */
  function identifyUser(userId, userData, callback) {
    if (!trackingEnabled) {
      log('info', `Identify event ignored - ${disabledReason}`);
      if (callback) callback({ status: 200 });
      return;
    }

    const identifyUrl = apiUrl.replace('/api/track', '/api/identify');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', identifyUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          log('info', 'User identified successfully');
        } else {
          log('error', 'Failed to identify user - HTTP ' + xhr.status);
        }
        if (callback) callback({ status: xhr.status });
      }
    };

    xhr.send(
      JSON.stringify({
        site: websiteId,
        userId: userId,
        email: userData.email,
        name: userData.name,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
      })
    );
  }

  // ============================================================================
  // External Link Tracking
  // ============================================================================

  /**
   * Get root domain
   */
  function getRootDomain(hostname) {
    if (!hostname) return null;
    const parts = hostname.replace(/^www\./, '').split('.');
    return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  }

  /**
   * Check if hostname is allowed
   */
  function isAllowedHostname(hostname) {
    if (!hostname) return false;
    if (hostname === domain) return true;
    for (const allowed of allowedHostnamesList) {
      if (hostname === allowed) return true;
    }
    return false;
  }

  /**
   * Track external link click
   */
  function trackExternalLink(link) {
    if (!link || !link.href) return;

    try {
      const url = new URL(link.href);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

      const linkHostname = url.hostname;
      const currentHostname = window.location.hostname;

      // Same hostname - don't track
      if (linkHostname === currentHostname) return;

      // Same root domain - don't track
      if (getRootDomain(linkHostname) === getRootDomain(currentHostname)) return;

      // Allowed hostname - add tracking params but don't track as external
      if (isAllowedHostname(linkHostname)) {
        try {
          const linkUrl = new URL(link.href);
          linkUrl.searchParams.set('_pm_vid', getVisitorId());
          linkUrl.searchParams.set('_pm_sid', getSessionId());
          link.href = linkUrl.toString();
        } catch {}
        return;
      }

      // External link - track it
      trackGoal('external_link', {
        url: link.href,
        text: link.textContent.trim(),
      });
    } catch (e) {}
  }

  // ============================================================================
  // Goal Tracking via Data Attributes
  // ============================================================================

  /**
   * Track goal from data attribute
   */
  function trackGoalFromElement(element) {
    const eventName = element.getAttribute('data-postmetric-goal');
    if (!eventName || !eventName.trim()) return;

    const goalData = { eventName: eventName.trim() };

    // Collect additional data attributes
    for (const attr of element.attributes) {
      if (
        attr.name.startsWith('data-postmetric-goal-') &&
        attr.name !== 'data-postmetric-goal'
      ) {
        const key = attr.name.substring(23);
        if (key) {
          goalData[key.replace(/-/g, '_')] = attr.value;
        }
      }
    }

    const sanitized = sanitizeCustomData(goalData);
    if (sanitized !== null) {
      trackGoal('custom', sanitized);
    }
  }

  // ============================================================================
  // Scroll Tracking
  // ============================================================================

  /**
   * Calculate scroll percentage
   */
  function getScrollPercentage() {
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    const winHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const trackLength = docHeight - winHeight;
    
    return trackLength <= 0 ? 100 : Math.min(100, Math.round((scrollTop / trackLength) * 100));
  }

  /**
   * Track scroll event for element
   */
  function trackScrollForElement(element, observer) {
    const eventName = element.getAttribute('data-postmetric-scroll');
    if (!eventName || !eventName.trim()) return;

    const delayAttr = element.getAttribute('data-postmetric-scroll-delay');
    let delay = 0;
    if (delayAttr !== null) {
      const parsed = parseInt(delayAttr, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        delay = parsed;
      }
    }

    const track = () => {
      const rect = element.getBoundingClientRect();
      if (!(rect.bottom > 0 && rect.top < window.innerHeight)) {
        observer.unobserve(element);
        return;
      }

      const scrollPct = getScrollPercentage();
      const thresholdAttr = element.getAttribute('data-postmetric-scroll-threshold');
      let threshold = 0.5;
      if (thresholdAttr !== null) {
        const parsed = parseFloat(thresholdAttr);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          threshold = parsed;
        }
      }

      const scrollData = {
        eventName: eventName.trim(),
        scroll_percentage: scrollPct.toString(),
        threshold: threshold.toString(),
        delay: delay.toString(),
      };

      // Collect additional data attributes
      for (const attr of element.attributes) {
        if (
          attr.name.startsWith('data-postmetric-scroll-') &&
          attr.name !== 'data-postmetric-scroll' &&
          attr.name !== 'data-postmetric-scroll-threshold' &&
          attr.name !== 'data-postmetric-scroll-delay'
        ) {
          const key = attr.name.substring(25);
          if (key) {
            scrollData[key.replace(/-/g, '_')] = attr.value;
          }
        }
      }

      const sanitized = sanitizeCustomData(scrollData);
      if (sanitized !== null) {
        trackGoal('custom', sanitized);
      }

      observer.unobserve(element);
    };

    if (delay > 0) {
      setTimeout(track, delay);
    } else {
      track();
    }
  }

  /**
   * Initialize scroll tracking
   */
  function initScrollTracking() {
    if (!window.IntersectionObserver) {
      log('warn', 'Intersection Observer not supported, scroll tracking disabled');
      return;
    }

    const elements = document.querySelectorAll('[data-postmetric-scroll]');
    if (elements.length === 0) return;

    // Group elements by threshold
    const thresholdMap = new Map();

    elements.forEach(element => {
      const thresholdAttr = element.getAttribute('data-postmetric-scroll-threshold');
      let threshold = 0.5;
      if (thresholdAttr !== null) {
        const parsed = parseFloat(thresholdAttr);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          threshold = parsed;
        } else {
          log(
            'warn',
            `Invalid threshold value "${thresholdAttr}" for element. Using default 0.5. Threshold must be between 0 and 1.`
          );
        }
      }

      if (!thresholdMap.has(threshold)) {
        thresholdMap.set(threshold, []);
      }
      thresholdMap.get(threshold).push(element);
    });

    // Create observers for each threshold
    thresholdMap.forEach((elements, threshold) => {
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              trackScrollForElement(entry.target, observer);
            }
          });
        },
        {
          root: null,
          rootMargin: '0px',
          threshold: threshold,
        }
      );

      elements.forEach(element => {
        observer.observe(element);
      });
    });
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  // Restore pageview state from sessionStorage
  (function() {
    try {
      const state = sessionStorage.getItem('postmetric_pageview_state');
      if (state) {
        const parsed = JSON.parse(state);
        lastPageviewTime = parsed.time || 0;
        lastPageviewUrl = parsed.url || '';
      }
    } catch (e) {
      lastPageviewTime = 0;
      lastPageviewUrl = '';
    }
  })();

  // Set up event listeners
  document.addEventListener('click', function(e) {
    const goalElement = e.target.closest('[data-postmetric-goal]');
    if (goalElement) {
      trackGoalFromElement(goalElement);
    }
    trackExternalLink(e.target.closest('a'));
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const goalElement = e.target.closest('[data-postmetric-goal]');
      if (goalElement) {
        trackGoalFromElement(goalElement);
      }
      trackExternalLink(e.target.closest('a'));
    }
  });

  // Initialize scroll tracking
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollTracking);
  } else {
    initScrollTracking();
  }

  // ============================================================================
  // SPA Navigation Tracking
  // ============================================================================

  let navigationTimeout = null;
  let currentPath = window.location.pathname;

  function handleNavigation() {
    trackPageview();

    // Auto-detect payment providers
    (function() {
      try {
        const url = new URL(window.location.href);
        const sessionId = url.searchParams.get('session_id');
        if (sessionId && sessionId.startsWith('cs_')) {
          const key = 'postmetric_stripe_payment_sent_' + sessionId;
          if (!sessionStorage.getItem(key)) {
            trackPayment('stripe', sessionId);
            sessionStorage.setItem(key, '1');
          }
        }
      } catch (e) {
        log('error', 'Error auto detecting Stripe session ID:', e);
      }
    })();

    (function() {
      try {
        const url = new URL(window.location.href);
        const checkoutId = url.searchParams.get('checkout_id');
        if (checkoutId) {
          const key = 'postmetric_polar_payment_sent_' + checkoutId;
          if (!sessionStorage.getItem(key)) {
            trackPayment('polar', checkoutId);
            sessionStorage.setItem(key, '1');
          }
        }
      } catch (e) {
        log('error', 'Error auto detecting Polar checkout ID:', e);
      }
    })();

    (function() {
      try {
        const url = new URL(window.location.href);
        const orderId = url.searchParams.get('order_id');
        if (orderId) {
          const key = 'postmetric_lemonsqueezy_payment_sent_' + orderId;
          if (!sessionStorage.getItem(key)) {
            trackPayment('lemonsqueezy', orderId);
            sessionStorage.setItem(key, '1');
          }
        }
      } catch (e) {
        log('error', 'Error auto detecting Lemonsqueezy order ID:', e);
      }
    })();
  }

  function debouncedNavigation() {
    if (navigationTimeout) clearTimeout(navigationTimeout);
    navigationTimeout = setTimeout(handleNavigation, 100);
  }

  // Track initial pageview
  handleNavigation();

  // Override pushState
  const originalPushState = window.history.pushState;
  window.history.pushState = function() {
    originalPushState.apply(this, arguments);
    if (currentPath !== window.location.pathname) {
      currentPath = window.location.pathname;
      debouncedNavigation();
    }
  };

  // Track popstate
  window.addEventListener('popstate', function() {
    if (currentPath !== window.location.pathname) {
      currentPath = window.location.pathname;
      debouncedNavigation();
    }
  });

  // ============================================================================
  // Public API
  // ============================================================================

  // Expose global function
  window.postmetric = postmetric;

  // Process queued calls
  if (window.postmetric.q) {
    delete window.postmetric.q;
  }

  (function() {
    while (queuedCalls.length > 0) {
      const call = queuedCalls.shift();
      if (Array.isArray(call) && call.length > 0) {
        try {
          postmetric.apply(null, call);
        } catch (e) {
          log('error', 'Error processing queued call:', e, call);
        }
      }
    }
  })();

  // Warn if tracking is disabled
  if (!trackingEnabled) {
    log('warn', disabledReason);
  }
})();

