# Payment Sync Strategy

## Overview

This document explains how payment syncing works to ensure no payments are missed when users refresh the analytics page.

## Problem

Previously, when users refreshed the analytics page, the sync would only look at a narrow time window (e.g., last 2 hours for "hourly" frequency). This could miss payments that were:

- Processed earlier in the day
- In different timezones
- Delayed due to payment processing

## Solution

We now use **wider sync windows with buffers** to ensure comprehensive coverage:

### Sync Windows by Period

| Period       | Sync Window     | Buffer    | Total Coverage |
| ------------ | --------------- | --------- | -------------- |
| **Today**    | Last 48 hours   | -         | 48 hours       |
| **Last 24h** | Last 26 hours   | +2 hours  | 26 hours       |
| **Last 7d**  | Last 8 days     | +1 day    | 8 days         |
| **Custom**   | Requested range | +24 hours | Range + 24h    |

### Why This Works

1. **Duplicate Prevention**: The sync function checks for existing payments by `providerPaymentId` before inserting, so wider ranges don't create duplicates.

2. **Timezone Safety**: Syncing 48 hours for "today" ensures we catch all payments regardless of:
   - User's timezone
   - Server timezone
   - Payment processor timezone

3. **Processing Delays**: The buffer accounts for:
   - Payment processing delays
   - Webhook delivery delays
   - Clock skew between systems

4. **Background Processing**: Syncs run in the background, so analytics return immediately with current data, and new data appears on the next refresh.

## Implementation Details

### Analytics Route Auto-Sync

When a user views analytics for a recent period, the route automatically:

1. Checks if a sync was done in the last 15 minutes
2. If not, creates a sync job with the appropriate date range
3. Returns analytics data immediately (sync runs in background)

```typescript
// Example: User views "Today" analytics
// Sync window: Last 48 hours
// Prevents missing payments from earlier today or timezone differences
```

### Cron Jobs

Scheduled cron jobs also use wider windows:

- **Hourly cron**: Syncs last 26 hours (24h + 2h buffer)
- **Every 6 hours**: Syncs last 48 hours
- **Daily**: Syncs last 8 days (7d + 1d buffer)

### Manual Sync

The dev sync script supports different frequencies:

```bash
# Sync last 24 hours (with buffer)
pnpm dev:sync --frequency every-6-hours

# Sync last 7 days (with buffer)
pnpm dev:sync --frequency daily
```

## Performance Considerations

- **Efficient**: Duplicate checks are fast (indexed database queries)
- **Non-blocking**: Syncs run in background, don't slow down analytics
- **Idempotent**: Multiple syncs of the same period are safe (duplicates skipped)

## Monitoring

Check sync status:

```bash
# View recent sync jobs
GET /api/websites/{websiteId}/sync
```

## Best Practices

1. **For Development**: Use `--frequency every-6-hours` or `daily` to ensure comprehensive syncs
2. **For Production**: The automatic sync on page refresh handles most cases
3. **For Manual Syncs**: Always use wider date ranges than the period you're viewing

## Future Improvements

- Consider syncing based on last successful sync timestamp instead of fixed windows
- Add metrics to track sync coverage and identify gaps
- Implement incremental syncs that only fetch new data since last sync
