# Follow-up System Troubleshooting Guide

## Current Status: ✅ FULLY CONFIGURED

The follow-up system is **completely set up** on both frontend and backend. Here's what I found:

## ✅ What's Working

### Frontend Configuration
1. **FollowUpPage Component**: ✓ Exists at `viewer/src/pages/followup/FollowUpPage.tsx`
2. **Routing**: ✓ Properly configured in `viewer/src/App.tsx` at `/followups`
3. **Sidebar Menu**: ✓ "Follow-ups" menu item exists with calendar icon
4. **API Service**: ✓ All follow-up API methods defined in `viewer/src/services/ApiService.ts`
5. **No TypeScript Errors**: ✓ All files compile without issues

### Backend Configuration
1. **Routes File**: ✓ Exists at `server/src/routes/follow-ups.js`
2. **Route Registration**: ✓ Registered in `server/src/routes/index.js` as `/api/follow-ups`
3. **Controller**: ✓ Referenced in routes file
4. **Authentication**: ✓ All routes protected with auth middleware
5. **Role-Based Access**: ✓ Proper RBAC configured

## 🔍 Why It's Not Showing

The issue is **NOT** with the code - everything is properly configured. The problem is likely one of these:

### 1. Backend Server Not Running
**Most Likely Issue**: The backend server needs to be running for the API to work.

**Solution**:
```bash
# Start the backend server
cd server
npm start
```

### 2. Frontend Not Built/Running
The frontend needs to be running in development mode or built for production.

**Solution**:
```bash
# Development mode
cd viewer
npm run dev

# OR Production build
cd viewer
npm run build
```

### 3. User Permissions
The follow-up menu requires `studies:read` permission.

**Check**: Make sure your logged-in user has the correct permissions.

### 4. Browser Cache
Old cached files might be preventing the new menu from showing.

**Solution**: 
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Clear browser cache
- Try incognito/private mode

## 🚀 Quick Start Guide

### Step 1: Start Backend
```bash
cd server
npm start
```

Wait for: `Server running on port 5000`

### Step 2: Start Frontend
```bash
cd viewer
npm run dev
```

Wait for: `Local: http://localhost:5173`

### Step 3: Access Follow-ups
1. Open browser to `http://localhost:5173`
2. Login with your credentials
3. Look for "Follow-ups" in the sidebar (between "Patients" and "Viewer")
4. Click to access the follow-up management page

## 📊 What You Should See

When you click "Follow-ups" in the sidebar, you should see:

1. **Statistics Dashboard**:
   - Total follow-ups
   - Pending count
   - Scheduled count
   - Overdue count
   - Completion rate

2. **Three Tabs**:
   - All Follow-ups
   - Overdue
   - Upcoming (7 days)

3. **Filters**:
   - By status (Pending, Scheduled, Completed)
   - By type (Routine, Urgent, Critical)

4. **Action Buttons**:
   - Schedule
   - Complete
   - Add Notes

## 🧪 Testing the API

Run this test to verify the backend is working:

```bash
node test-followup-api.js
```

This will test:
- Login authentication
- Follow-ups endpoint
- Statistics endpoint

## 🔧 Common Issues & Solutions

### Issue: "Follow-ups" menu not visible
**Cause**: User doesn't have `studies:read` permission
**Solution**: Update user permissions in the database or admin panel

### Issue: Clicking "Follow-ups" shows blank page
**Cause**: Backend API not responding
**Solution**: 
1. Check backend server is running
2. Check browser console for errors
3. Verify API URL in frontend config

### Issue: "Network Error" or "Failed to fetch"
**Cause**: Backend server not running or wrong URL
**Solution**:
1. Start backend server: `cd server && npm start`
2. Check `viewer/.env` or `viewer/src/config.ts` for correct API URL

### Issue: "Unauthorized" or "403 Forbidden"
**Cause**: Not logged in or insufficient permissions
**Solution**:
1. Login again
2. Check user has `studies:read` permission
3. Check JWT token is valid

## 📁 File Locations

### Frontend Files
- Page: `viewer/src/pages/followup/FollowUpPage.tsx`
- Routing: `viewer/src/App.tsx` (line 27, 177-185)
- Sidebar: `viewer/src/components/layout/Sidebar.tsx` (line 60-66)
- API Service: `viewer/src/services/ApiService.ts` (line 637-708)

### Backend Files
- Routes: `server/src/routes/follow-ups.js`
- Route Registration: `server/src/routes/index.js` (line 31, 176-177)
- Controller: `server/src/controllers/followUpController.js`
- Model: `server/src/models/FollowUp.js`
- Automation: `server/src/services/followup-automation.js`

## 🎯 Next Steps

1. **Start the servers** (if not running)
2. **Login to the application**
3. **Check the sidebar** for "Follow-ups" menu item
4. **Click it** to access the follow-up management page

If you still don't see it after starting both servers:
1. Check browser console (F12) for errors
2. Check backend server logs for errors
3. Verify you're logged in with a user that has `studies:read` permission
4. Try clearing browser cache and hard refresh

## 📞 Still Having Issues?

If the follow-up system still isn't showing after following these steps:

1. **Check Backend Logs**: Look for errors when starting the server
2. **Check Browser Console**: Press F12 and look for JavaScript errors
3. **Verify Database**: Make sure MongoDB is running and connected
4. **Check Environment Variables**: Verify `.env` files are properly configured

---

**Last Updated**: October 21, 2025
**Status**: ✅ All code is properly configured - just needs servers running
