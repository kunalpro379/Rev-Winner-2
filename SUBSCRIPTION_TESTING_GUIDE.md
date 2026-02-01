# Subscription Management Testing Guide

## Overview
This document outlines how to test the improved Subscription Management UI and functionality.

## Features Improved

### 1. ✅ UI Enhancements
- **Merged Date Columns**: Start Date and End Date are now displayed as a single range "MMM d, yyyy - MMM d, yyyy"
- **Better Layout**: Improved table styling with hover effects and better visual hierarchy
- **Status Colors**: Color-coded status badges (green for active, blue for trial, red for expired, gray for canceled)
- **Usage Progress Bar**: Visual progress indicator showing minutes used vs limit
- **Cleaner Design**: Removed unnecessary "N/A" values with meaningful alternatives

### 2. ✅ Data Display Improvements
- **Days Remaining**: Shows countdown to expiry (e.g., "30 days left" in amber)
- **Usage Metrics**: Displays "X / Y min" or "Unlimited" instead of N/A
- **Plan Names**: Properly formatted plan names (e.g., "free_trial" → "free trial")
- **No Subscription**: Shows "No Plan" badge instead of N/A

### 3. ✅ Functional Features

#### Extend Subscription
- **Location**: Click the "Extend" button on any subscription row
- **Dialog**: Opens a dialog to enter number of days (1-365)
- **Behavior**: 
  - Validates input (must be positive)
  - Calls `/api/admin/subscriptions/{userId}/extend-trial`
  - Updates subscription end date
  - Refreshes data on success
- **Feedback**: Toast notification on success/failure

#### Cancel Subscription
- **Location**: Click the "Cancel" button on active subscriptions
- **Dialog**: Opens a dialog for cancellation reason
- **Behavior**:
  - Calls `/api/admin/subscriptions/{subscriptionId}/cancel`
  - Marks subscription as "canceled"
  - Records cancellation reason in audit logs
  - Refreshes data on success
- **Safety**: Warning message shown in dialog

### 4. ✅ Data Fetching

#### All Subscriptions Tab
- **Endpoint**: `GET /api/admin/users`
- **Parameters**: 
  - `page`: Page number (1-indexed)
  - `limit`: Items per page (20)
  - `search`: Optional search query
  - `subscriptionStatus`: Filter by status (active, trial, expired, canceled)
  - `planType`: Filter by plan type
- **Response**: Returns users with subscription data

#### Expiring Soon Tab
- **Endpoint**: `GET /api/admin/subscriptions/expiring-soon`
- **Parameters**: 
  - `days`: Number of days to look ahead (default: 7)
- **Response**: Returns subscriptions expiring within the specified days

## Testing Procedures

### Manual Testing

#### 1. Test UI Rendering
```
1. Navigate to Admin Panel > Subscriptions
2. Verify "All Subscriptions" tab shows proper table layout
3. Verify column headers are visible and properly sized
4. Check "Expiring Soon" tab displays with amber highlighting
```

#### 2. Test Data Display
```
1. Check that dates show as "Jan 30, 2026 - Jul 30, 2026" format (single line)
2. Verify "Days left" counter appears in amber
3. Verify usage shows "X / Y min" or "Unlimited"
4. Check status badges have correct colors
```

#### 3. Test Search and Filters
```
1. Search by name: Type "kunal" → Should filter results
2. Search by email: Type "gmail.com" → Should show Gmail users
3. Filter by Status: Select "Active" → Should show only active subs
4. Filter by Plan: Select "Monthly" → Should show monthly plans
5. Verify pagination works: Click Next/Previous buttons
```

#### 4. Test Extend Functionality
```
1. Click "Extend" button on any subscription
2. Enter "30" in the days field
3. Click "Extend" button in dialog
4. Verify toast notification appears: "Trial Extended"
5. Check that subscription end date has been updated
6. Verify data refreshes automatically
```

#### 5. Test Cancel Functionality
```
1. Click "Cancel" button on an active subscription
2. Enter cancellation reason (optional)
3. Click "Yes, Cancel" button
4. Verify warning message was shown
5. Verify toast notification: "Subscription Canceled"
6. Check that subscription status changed to "canceled"
7. Verify "Cancel" button is no longer shown for this subscription
```

### Backend API Testing

#### Using curl/Postman

**Test Extend Trial:**
```bash
curl -X POST http://localhost:3000/api/admin/subscriptions/{userId}/extend-trial \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"days": 30}'
```

**Test Cancel Subscription:**
```bash
curl -X POST http://localhost:3000/api/admin/subscriptions/{subscriptionId}/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "User requested cancellation"}'
```

**Test Get All Users:**
```bash
curl "http://localhost:3000/api/admin/users?page=1&limit=20&subscriptionStatus=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test Get Expiring Soon:**
```bash
curl "http://localhost:3000/api/admin/subscriptions/expiring-soon?days=7" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Expected Behavior

### All Subscriptions Tab
- Shows list of all users with their subscription details
- Dates appear on single line: "Jan 30, 2026 - Jul 30, 2026"
- Usage shows as "2 / 180 min" with progress bar
- Status badges are color-coded
- Search filters work in real-time
- Pagination works correctly

### Expiring Soon Tab
- Shows only subscriptions expiring within the selected days
- Displays amber warning for subscriptions ending soon
- Shows "X days left" in red if < 3 days
- Both Extend and Cancel buttons are available

### Extend Dialog
- Input accepts 1-365 days
- Validates input before submission
- Shows loading state during submission
- Refreshes subscription list on success

### Cancel Dialog
- Shows warning message
- Allows entering optional reason
- Shows loading state during submission
- Refreshes subscription list on success
- Button changes to "Keep Subscription" for safety

## Error Handling

The component handles these error scenarios:
1. **Network Errors**: Shows toast with error message
2. **Invalid Input**: Disables submit button if input is invalid
3. **Server Errors**: Displays server error message in toast
4. **No Data**: Shows "No subscriptions found" message

## Database Queries

The backend uses optimized SQL queries:
- Joins `auth_users` with `subscriptions` table
- Filters using indexes on `user_id`, `status`, `plan_type`
- Includes `session_minutes_purchases` for usage tracking
- Properly counts active sessions

## Performance Considerations

1. **Pagination**: Fetches 20 users per page
2. **Debouncing**: Search queries are not auto-debounced (user can optimize if needed)
3. **Caching**: Uses React Query for automatic cache management
4. **Lazy Loading**: Data loads on tab switch

## Troubleshooting

### Issue: N/A appears in date fields
- **Cause**: `current_period_start` or `current_period_end` is NULL in database
- **Solution**: Update database or migrate old records with default dates

### Issue: Extend button doesn't work
- **Cause**: Missing authentication token
- **Solution**: Check localStorage for `accessToken`

### Issue: Progress bar shows 0%
- **Cause**: `minutes_used` field is missing or NULL
- **Solution**: Ensure sessions create audit records

### Issue: Filters not working
- **Cause**: Backend filters not applying correctly
- **Solution**: Check `getAllUsersWithDetails` query conditions

## Future Enhancements

1. Add bulk extend/cancel functionality
2. Add export to CSV feature
3. Add email notifications for expiring subscriptions
4. Add detailed subscription history view
5. Add auto-renewal settings UI
6. Add usage analytics charts
