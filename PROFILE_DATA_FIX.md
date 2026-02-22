# Profile Data Loading Fix

## Issue
Profile page showing "Failed to load profile data" and other data not loading properly.

## Root Cause
The profile page queries are failing silently. Need to check:
1. Authentication token validity
2. API endpoint responses
3. Query error handling

## Quick Fix Steps

### 1. Check Browser Console
Open browser DevTools (F12) and check for:
- Network errors (401, 403, 500)
- Console errors
- Failed API requests

### 2. Verify Authentication
```javascript
// In browser console:
localStorage.getItem('accessToken')
localStorage.getItem('refreshToken')
```

If tokens are missing or expired, logout and login again.

### 3. Test API Endpoints Manually

```bash
# Get access token from browser localStorage
# Then test endpoints:

# Profile
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/profile

# Subscription
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/profile/subscription

# Session Minutes
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/session-minutes/status

# Train Me Status
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/train-me/status

# Invoices
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/profile/invoices
```

### 4. Common Issues & Solutions

#### Issue: 401 Unauthorized
**Solution:** Token expired, logout and login again
```
1. Click logout
2. Login with credentials
3. Refresh profile page
```

#### Issue: 403 Forbidden  
**Solution:** Token invalid, clear storage and login
```javascript
// In browser console:
localStorage.clear()
// Then login again
```

#### Issue: 500 Internal Server Error
**Solution:** Check server logs for database errors
- Look for "relation does not exist" errors
- Check if all tables are created

#### Issue: Data shows as "undefined" or "null"
**Solution:** Check if user has subscription/data
```sql
-- Check user subscription
SELECT * FROM subscriptions WHERE user_id = 'YOUR_USER_ID';

-- Check session usage
SELECT * FROM session_usage WHERE user_id = 'YOUR_USER_ID';
```

### 5. Force Refresh Data

Add this to profile page to force refetch:

```typescript
// Add refetch buttons for debugging
const { data: profileData, isLoading, error, refetch } = useQuery({
  queryKey: ["/api/profile"],
});

// In UI:
<Button onClick={() => refetch()}>Refresh Profile</Button>
```

### 6. Check Query Client Configuration

The issue might be with React Query caching. Check if queries are being cached incorrectly.

```typescript
// In queryClient.ts, ensure proper error handling:
queryClient.setDefaultOptions({
  queries: {
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  },
});
```

## Immediate Actions

1. **Logout and Login Again**
   - This will refresh all tokens
   - Clear any stale cache

2. **Check Server Logs**
   - Look for API errors
   - Check database connection

3. **Verify Database Tables**
   ```bash
   node verify-schema.mjs
   ```

4. **Test with Fresh Browser Session**
   - Open incognito/private window
   - Login and check profile

## Expected Behavior

After fix, profile page should show:
- ✅ Name, email, phone, organization
- ✅ Subscription type and status
- ✅ Session minutes balance
- ✅ Train Me status
- ✅ Session history
- ✅ Invoice history (if any)

## Debug Mode

To enable detailed logging, add to profile.tsx:

```typescript
useEffect(() => {
  console.log('Profile Data:', profileData);
  console.log('Subscription Data:', subscriptionData);
  console.log('Loading States:', {
    profile: isLoadingProfile,
    subscription: isLoadingSubscription,
  });
}, [profileData, subscriptionData, isLoadingProfile, isLoadingSubscription]);
```

## Still Not Working?

If data still doesn't load:

1. Check if user exists in database
2. Check if subscription exists
3. Verify all foreign keys are correct
4. Check server logs for errors
5. Try creating a new test user

---

**Quick Test:** Open browser console and run:
```javascript
fetch('/api/profile', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
  }
}).then(r => r.json()).then(console.log)
```

This will show if the API is working.
