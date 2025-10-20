# crypto.randomUUID Fix

## Issue
The application was throwing an error:
```
crypto.randomUUID is not a function
```

This error occurred because `crypto.randomUUID()` is not available in all browsers or environments.

## Root Cause
The `authService.ts` file was using `crypto.randomUUID()` directly without checking for browser compatibility:

```typescript
// Old code (line 181)
config.headers['x-correlation-id'] = crypto.randomUUID()
```

## Solution
Added a polyfill function that:
1. Checks if `crypto.randomUUID` is available
2. Uses it if available
3. Falls back to a UUID v4 generator if not

```typescript
// Polyfill for crypto.randomUUID if not available
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Updated usage
config.headers['x-correlation-id'] = generateUUID()
```

## Files Modified
- `viewer/src/services/authService.ts`

## Testing
After this fix:
1. The authentication error should be resolved
2. The application should load normally
3. Login should work correctly
4. All API requests will have correlation IDs

## Browser Compatibility
The polyfill ensures compatibility with:
- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Older browsers without crypto.randomUUID
- ✅ Development environments
- ✅ Production builds

## Next Steps
1. Refresh your browser (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache if needed
3. Try logging in again
4. The error should be gone!
