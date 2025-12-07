# DataFast Clone - Implementation Guide

## What We've Built So Far

### ✅ Completed

1. **Architecture Documentation** (`ARCHITECTURE.md`)

   - Complete system architecture
   - Database schema design
   - API routes structure
   - Implementation phases
   - Security and performance considerations

2. **Database Models** (`db/models/`)
   - ✅ User Model - User accounts and subscriptions
   - ✅ Website Model - Tracked websites with settings
   - ✅ Session Model - Visitor sessions
   - ✅ PageView Model - Individual page views
   - ✅ Goal Model - Custom goals configuration
   - ✅ GoalEvent Model - Goal completion events
   - ✅ Payment Model - Revenue tracking
   - ✅ Funnel Model - Conversion funnel configuration
   - ✅ FunnelEvent Model - Funnel step completions
   - ✅ Profile Model - User profiles (existing)

All models include proper indexing for performance optimization.

---

## Next Steps - Implementation Roadmap

### Phase 1: Core Tracking (Priority: HIGH)

#### 1.1 Create Tracking Endpoint

**File**: `app/api/track/route.ts`

**Requirements**:

- Accept GET (pixel) and POST requests
- Extract tracking code from query params or body
- Generate/retrieve visitor ID (from cookie)
- Generate/retrieve session ID
- Parse UTM parameters from URL
- Detect device, browser, OS from User-Agent
- Get geolocation from IP address
- Check exclusion rules (IP, country, hostname, path)
- Store page view
- Update session
- Return 1x1 pixel or 204 No Content

**Key Functions Needed**:

```typescript
// utils/tracking/visitor.ts
- generateVisitorId()
- getVisitorIdFromCookie()
- generateSessionId()

// utils/tracking/device.ts
- parseUserAgent(userAgent: string)
- detectDevice(userAgent: string)

// utils/tracking/geolocation.ts
- getLocationFromIP(ip: string)

// utils/tracking/validation.ts
- shouldExcludeVisit(website, ip, country, hostname, path)
```

#### 1.2 Tracking Script Generator

**File**: `app/api/track.js/route.ts` or `public/track.js`

**Requirements**:

- Generate JavaScript snippet for each website
- Auto-track page views
- Support SPA navigation (history API)
- Support custom goal tracking
- Handle user identification

**Script Features**:

```javascript
// Basic tracking
datafast("track", "pageview", { path: "/page" });

// Custom goal
datafast("track", "goal", { event: "button_click", value: 100 });

// User identification
datafast("identify", { userId: "user123", email: "user@example.com" });
```

#### 1.3 Utility Functions

**Files**: `utils/tracking/*.ts`

Create utility modules for:

- Visitor/Session ID generation
- User-Agent parsing
- IP geolocation
- UTM parameter extraction
- Exclusion rule checking

---

### Phase 2: Website Management (Priority: HIGH)

#### 2.1 Website CRUD API

**Files**:

- `app/api/websites/route.ts` - List & Create
- `app/api/websites/[id]/route.ts` - Get, Update, Delete

**Endpoints**:

```
GET    /api/websites          - List user's websites
POST   /api/websites          - Create new website
GET    /api/websites/[id]     - Get website details
PUT    /api/websites/[id]     - Update website
DELETE /api/websites/[id]     - Delete website
```

**Features**:

- Generate unique tracking code on creation
- Validate domain format
- Handle website settings updates
- Payment provider webhook secret management

#### 2.2 Website Settings Page

**File**: `app/dashboard/[websiteId]/settings/page.tsx`

**Features**:

- Edit website name and domain
- Configure exclusion rules
- Set up payment providers
- View tracking code
- Copy installation script

---

### Phase 3: Analytics Dashboard (Priority: HIGH)

#### 3.1 Analytics Aggregation Queries

**File**: `utils/analytics/aggregations.ts`

**Functions Needed**:

```typescript
// Time-series data
getVisitorsOverTime(websiteId, startDate, endDate, granularity)
getRevenueOverTime(websiteId, startDate, endDate, granularity)

// Breakdowns
getSourceBreakdown(websiteId, startDate, endDate, type: 'channel' | 'referrer' | 'campaign')
getPathBreakdown(websiteId, startDate, endDate, type: 'page' | 'hostname' | 'entry' | 'exit')
getLocationBreakdown(websiteId, startDate, endDate, type: 'country' | 'region' | 'city')
getSystemBreakdown(websiteId, startDate, endDate, type: 'browser' | 'os' | 'device')

// Metrics
getMetrics(websiteId, startDate, endDate)
// Returns: visitors, revenue, conversionRate, revenuePerVisitor, bounceRate, sessionTime
```

**MongoDB Aggregation Examples**:

```javascript
// Visitors over time
db.pageviews.aggregate([
  {
    $match: {
      websiteId: ObjectId("..."),
      timestamp: { $gte: startDate, $lte: endDate },
    },
  },
  {
    $group: {
      _id: { $dateTrunc: { date: "$timestamp", unit: "day" } },
      count: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
]);
```

#### 3.2 Analytics API Endpoint

**File**: `app/api/websites/[websiteId]/analytics/route.ts`

**Query Parameters**:

- `startDate` - Start date (ISO string)
- `endDate` - End date (ISO string)
- `granularity` - 'hourly' | 'daily' | 'weekly' | 'monthly'
- `metrics` - Comma-separated list of metrics to return

**Response**:

```json
{
  "visitors": [...],
  "revenue": [...],
  "metrics": {
    "visitors": "18.9k",
    "revenue": "$28.3k",
    "conversionRate": "0.60%",
    "revenuePerVisitor": "$1.49"
  },
  "breakdowns": {
    "source": {...},
    "path": {...},
    "location": {...},
    "system": {...}
  }
}
```

#### 3.3 Update Dashboard UI

**File**: `app/dashboard/[websiteId]/page.tsx`

**Changes**:

- Replace dummy data with API calls
- Add loading states
- Add error handling
- Implement date range selector
- Add granularity selector
- Connect all charts to real data

---

### Phase 4: Authentication (Priority: MEDIUM)

#### 4.1 Choose Authentication Solution

**Option A: NextAuth.js** (Recommended)

- Free and open-source
- Supports multiple providers
- Good Next.js integration

**Option B: Clerk**

- Paid but feature-rich
- Better UX out of the box
- Built-in user management

#### 4.2 Implementation Steps

1. Install authentication library
2. Configure providers (Google, GitHub, Email)
3. Create authentication pages
4. Add middleware for route protection
5. Update database queries to use authenticated user ID

**Files to Create**:

- `app/api/auth/[...nextauth]/route.ts` (if using NextAuth)
- `middleware.ts` - Route protection
- Update `app/login/page.tsx` - Connect to auth
- Update `app/dashboard/layout.tsx` - Show authenticated user

---

### Phase 5: Revenue Attribution (Priority: MEDIUM)

#### 5.1 Payment Provider Webhooks

**Stripe Webhook** (`app/api/webhooks/stripe/route.ts`):

- Verify webhook signature
- Handle `checkout.session.completed`
- Handle `payment_intent.succeeded`
- Extract visitor/session ID from metadata
- Create Payment record

**LemonSqueezy Webhook** (`app/api/webhooks/lemonsqueezy/route.ts`):

- Verify webhook signature
- Handle order created/completed events
- Extract visitor/session ID from metadata
- Create Payment record

#### 5.2 Revenue Linking Logic

**Strategies**:

1. **Metadata Method**: Payment providers include `visitorId` or `sessionId` in metadata
2. **Email Matching**: Match customer email to identified users
3. **Timestamp Correlation**: Link payments to recent sessions (less reliable)

**Implementation**:

```typescript
// utils/revenue/linkPayment.ts
async function linkPaymentToVisitor(payment, websiteId) {
  // Try metadata first
  if (payment.metadata?.visitorId) {
    return payment.metadata.visitorId;
  }

  // Try email matching
  if (payment.customerEmail) {
    const session = await Session.findOne({
      websiteId,
      // Match by email if user identification is enabled
    });
    return session?.visitorId;
  }

  // Fallback: timestamp correlation
  // Find recent sessions and link to most likely one
}
```

#### 5.3 Revenue Dashboard

- Revenue charts
- Revenue per visitor
- Revenue by source/channel
- Refund tracking

---

### Phase 6: Custom Goals (Priority: LOW)

#### 6.1 Goal Management API

**Files**:

- `app/api/goals/route.ts` - Create, List goals
- `app/api/goals/[id]/route.ts` - Update, Delete goal
- `app/api/goals/track/route.ts` - Track goal event

#### 6.2 Goal Tracking in Script

Update tracking script to support:

```javascript
datafast("track", "goal", {
  event: "button_click",
  value: 100, // optional
});
```

#### 6.3 Goal Dashboard

- Goal completion charts
- Goal conversion rates
- Goal value tracking

---

### Phase 7: Conversion Funnels (Priority: LOW)

#### 7.1 Funnel Management API

**Files**:

- `app/api/funnels/route.ts` - Create, List funnels
- `app/api/funnels/[id]/route.ts` - Update, Delete funnel

#### 7.2 Funnel Tracking

- Track funnel step completions
- Calculate conversion rates between steps
- Visualize funnel drop-off

#### 7.3 Funnel Dashboard

- Funnel visualization
- Step-by-step conversion rates
- Drop-off analysis

---

### Phase 8: Advanced Features (Priority: LOW)

#### 8.1 X (Twitter) Mentions

- Twitter API integration
- Track mentions
- Link to traffic spikes
- Display on chart

#### 8.2 GitHub Integration

- GitHub API integration
- Track commits
- Link to traffic/revenue

#### 8.3 Google Search Console

- GSC API integration
- Import search data
- Display search queries

---

## Quick Start Implementation

### Step 1: Set Up Environment Variables

Create `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/postmetric
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Optional: For geolocation
IPSTACK_API_KEY=your-key-here
# or
MAXMIND_LICENSE_KEY=your-key-here

# Optional: For payment providers
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
LEMONSQUEEZY_API_KEY=...
```

### Step 2: Install Additional Dependencies

```bash
pnpm add next-auth ua-parser-js
pnpm add -D @types/ua-parser-js
```

### Step 3: Start with Tracking Endpoint

1. Create `app/api/track/route.ts`
2. Create utility functions in `utils/tracking/`
3. Test with a simple HTML page

### Step 4: Create Website Management

1. Create website CRUD APIs
2. Update dashboard to list/create websites
3. Add website settings page

### Step 5: Build Analytics

1. Create aggregation queries
2. Create analytics API endpoint
3. Update dashboard to use real data

---

## Testing Strategy

### Unit Tests

- Test utility functions (device detection, UTM parsing, etc.)
- Test aggregation queries
- Test exclusion logic

### Integration Tests

- Test tracking endpoint with various scenarios
- Test webhook handlers
- Test API endpoints

### E2E Tests

- Test complete user flow
- Test tracking script on a test website
- Test revenue attribution flow

---

## Performance Optimization

### Database

- Use compound indexes (already added)
- Consider time-series database for scale
- Archive old data

### Caching

- Cache aggregated analytics data
- Use Redis for session data
- Cache geolocation lookups

### Rate Limiting

- Limit tracking requests per IP
- Prevent abuse

---

## Security Checklist

- [ ] Hash IP addresses before storage
- [ ] Verify webhook signatures
- [ ] Implement rate limiting
- [ ] Add CORS configuration
- [ ] Protect admin APIs with authentication
- [ ] Encrypt sensitive data
- [ ] Implement data deletion (GDPR)

---

## Resources

- [DataFast Documentation](https://datafa.st/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [MongoDB Aggregation](https://www.mongodb.com/docs/manual/aggregation/)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [User-Agent Parsing](https://github.com/faisalman/ua-parser-js)

---

## Questions to Consider

1. **Geolocation Service**: Which service to use? (MaxMind, IPStack, IPAPI)
2. **Real-time Updates**: WebSockets or Server-Sent Events?
3. **Data Retention**: How long to keep raw data?
4. **Scaling**: When to move to time-series database?
5. **Pricing**: What pricing model? (Free tier, paid plans)

---

## Next Immediate Steps

1. ✅ **DONE**: Architecture documentation
2. ✅ **DONE**: Database models
3. **NEXT**: Create tracking endpoint (`app/api/track/route.ts`)
4. **NEXT**: Create utility functions for tracking
5. **NEXT**: Create tracking script generator
6. **NEXT**: Set up authentication
7. **NEXT**: Create website management APIs

Start with the tracking endpoint - it's the core of the entire system!
