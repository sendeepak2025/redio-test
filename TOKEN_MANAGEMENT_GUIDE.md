# Token Management System

## Overview

This application implements a comprehensive token management system that handles authentication tokens across:
- **Redux Store** - Application state management
- **localStorage/sessionStorage** - Persistent storage
- **Cookies** - HTTP-only cookies for refresh tokens
- **Axios Headers** - Authorization headers for API requests

## Architecture

### Frontend (React + Redux)

#### 1. Auth Service (`viewer/src/services/authService.ts`)
- Handles all authentication API calls
- Manages token storage (localStorage/sessionStorage)
- Sets Authorization headers in axios
- Implements automatic token refresh on 401 errors

#### 2. Redux Auth Slice (`viewer/src/store/slices/authSlice.ts`)
- Manages authentication state
- Stores user data, tokens, and auth status
- Provides async thunks for login, logout, refresh

#### 3. Redux Store (`viewer/src/store/index.ts`)
- Preloads auth state from storage on app start
- Syncs auth state changes to storage automatically
- Persists tokens and user data

#### 4. Auth Sync Hook (`viewer/src/hooks/useAuthSync.ts`)
- Listens for auth events (token expiration, logout)
- Handles cross-tab synchronization
- Auto-logout on token removal

### Backend (Node.js + Express)

#### 1. Auth Controller (`server/src/controllers/authController.js`)
- Handles login, logout, refresh endpoints
- Generates JWT access and refresh tokens
- Sets HTTP-only cookies for refresh tokens
- Returns tokens in response body

#### 2. Auth Middleware (`server/src/middleware/authMiddleware.js`)
- Validates JWT tokens from Authorization header
- Extracts user info from token payload
- Attaches user to request object
- Handles token expiration errors

## Token Flow

### Login Flow

```
1. User submits credentials
   ↓
2. Frontend: authService.login(credentials)
   ↓
3. Backend: POST /auth/login
   - Validates credentials
   - Generates accessToken & refreshToken
   - Sets refresh_token cookie (HTTP-only)
   - Returns { success, accessToken, refreshToken, user }
   ↓
4. Frontend: authService receives response
   - Sets Authorization header: `Bearer ${accessToken}`
   - Stores in localStorage/sessionStorage:
     * accessToken
     * refreshToken
     * user (JSON)
   ↓
5. Redux: login.fulfilled
   - Updates auth state
   - Sets isAuthenticated = true
   ↓
6. Store subscriber syncs to storage
```

### API Request Flow

```
1. User makes API request
   ↓
2. Axios request interceptor
   - Reads token from storage
   - Adds Authorization header: `Bearer ${token}`
   - Sets withCredentials: true (sends cookies)
   ↓
3. Backend receives request
   - Auth middleware validates token
   - Extracts user from token payload
   - Attaches req.user
   ↓
4. Request processed
   ↓
5. Response returned
```

### Token Refresh Flow

```
1. API request returns 401 (token expired)
   ↓
2. Axios response interceptor catches error
   - Checks if refresh is already in progress
   - Queues failed requests
   ↓
3. Calls authService.refreshToken(refreshToken)
   ↓
4. Backend: POST /auth/refresh
   - Validates refresh token
   - Generates new accessToken & refreshToken
   - Updates refresh_token cookie
   - Returns new tokens
   ↓
5. Frontend: authService receives response
   - Updates Authorization header
   - Updates storage with new tokens
   ↓
6. Redux: refreshToken.fulfilled
   - Updates auth state with new tokens
   ↓
7. Retry all queued requests with new token
```

### Logout Flow

```
1. User clicks logout
   ↓
2. Frontend: dispatch(logout())
   ↓
3. Backend: POST /auth/logout
   - Clears refresh_token cookie
   ↓
4. Frontend: authService.logout()
   - Clears Authorization header
   - Removes from localStorage:
     * accessToken
     * refreshToken
     * user
   - Removes from sessionStorage:
     * accessToken
     * refreshToken
     * user
   ↓
5. Redux: logout.fulfilled
   - Clears auth state
   - Sets isAuthenticated = false
   ↓
6. Store subscriber syncs to storage
```

## Storage Strategy

### Remember Me = true
- Tokens stored in **localStorage**
- Persists across browser sessions
- User stays logged in after closing browser

### Remember Me = false
- Tokens stored in **sessionStorage**
- Cleared when browser tab closes
- More secure for shared computers

## Security Features

### Frontend
1. **Automatic Token Refresh**
   - Intercepts 401 errors
   - Refreshes token automatically
   - Retries failed requests

2. **Request Queuing**
   - Prevents multiple refresh attempts
   - Queues requests during refresh
   - Retries all after refresh completes

3. **Cross-Tab Sync**
   - Listens to storage events
   - Logs out all tabs when one logs out
   - Prevents stale auth state

4. **Token Validation**
   - Validates token format
   - Checks expiration
   - Handles invalid tokens gracefully

### Backend
1. **HTTP-Only Cookies**
   - Refresh tokens in HTTP-only cookies
   - Not accessible via JavaScript
   - Protected from XSS attacks

2. **JWT Validation**
   - Verifies token signature
   - Checks expiration
   - Validates token structure

3. **Role-Based Access**
   - requireRole middleware
   - Checks user permissions
   - Returns 403 for unauthorized access

## Configuration

### Environment Variables

#### Backend (.env)
```bash
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
NODE_ENV=development
ENABLE_AUTH_LOGGING=true
```

#### Frontend (.env)
```bash
VITE_BACKEND_URL=https://apiradio.varnaamedicalbillingsolutions.com
```

## Usage Examples

### Login with Remember Me
```typescript
import { useAppDispatch } from './store/hooks'
import { login } from './store/slices/authSlice'

const dispatch = useAppDispatch()

const handleLogin = async () => {
  await dispatch(login({
    username: 'admin',
    password: 'password',
    rememberMe: true // Store in localStorage
  }))
}
```

### Making Authenticated API Calls
```typescript
import axios from 'axios'

// Token is automatically added by axios interceptor
const response = await axios.get('/api/patients')
```

### Manual Token Refresh
```typescript
import { useAppDispatch } from './store/hooks'
import { refreshToken } from './store/slices/authSlice'

const dispatch = useAppDispatch()

const handleRefresh = async () => {
  await dispatch(refreshToken())
}
```

### Logout
```typescript
import { useAppDispatch } from './store/hooks'
import { logout } from './store/slices/authSlice'

const dispatch = useAppDispatch()

const handleLogout = async () => {
  await dispatch(logout())
}
```

## Debugging

### Enable Auth Logging
Set `ENABLE_AUTH_LOGGING=true` in backend .env

### Check Token in Browser
```javascript
// In browser console
localStorage.getItem('accessToken')
localStorage.getItem('refreshToken')
localStorage.getItem('user')
```

### Check Axios Headers
```javascript
// In browser console
axios.defaults.headers.common['Authorization']
```

### Monitor Auth Events
```javascript
// In browser console
window.addEventListener('auth:token-expired', () => {
  console.log('Token expired event')
})

window.addEventListener('auth:logout-required', () => {
  console.log('Logout required event')
})
```

## Troubleshooting

### Token Invalid Error
1. Check if JWT_SECRET matches between frontend and backend
2. Verify token hasn't expired
3. Check token format in Authorization header

### Token Not Sent
1. Verify axios interceptor is configured
2. Check if token exists in storage
3. Ensure withCredentials is set

### Refresh Loop
1. Check refresh token validity
2. Verify refresh endpoint returns new tokens
3. Check for circular refresh attempts

### Cross-Tab Issues
1. Verify storage events are firing
2. Check useAuthSync hook is mounted
3. Ensure storage keys match

## Best Practices

1. **Always use HTTPS in production**
   - Protects tokens in transit
   - Enables secure cookies

2. **Set short token expiration**
   - Access token: 30 minutes
   - Refresh token: 7 days

3. **Validate tokens on every request**
   - Don't trust client-side validation
   - Always verify on backend

4. **Clear tokens on logout**
   - Remove from all storage locations
   - Clear axios headers
   - Clear cookies

5. **Handle token expiration gracefully**
   - Auto-refresh when possible
   - Redirect to login when refresh fails
   - Show user-friendly messages

## Testing

### Test Login
```bash
curl -X POST https://apiradio.varnaamedicalbillingsolutions.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -c cookies.txt
```

### Test Authenticated Request
```bash
curl -X GET https://apiradio.varnaamedicalbillingsolutions.com/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -b cookies.txt
```

### Test Token Refresh
```bash
curl -X POST https://apiradio.varnaamedicalbillingsolutions.com/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}' \
  -b cookies.txt
```

## Migration Notes

If upgrading from a previous auth system:
1. Clear all existing tokens from storage
2. Update API calls to use new endpoints
3. Test login/logout flow thoroughly
4. Verify token refresh works correctly
5. Check cross-tab synchronization
