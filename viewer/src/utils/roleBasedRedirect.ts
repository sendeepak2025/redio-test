/**
 * Role-based redirect utility
 * Determines which dashboard to redirect to based on user role
 */

export const getRoleBasedRedirect = (role: string | null, roles: string[] = []): string => {
  // Check primary role first
  if (role === 'superadmin') {
    return '/superadmin'
  }
  
  // Check roles array as fallback
  if (roles.includes('system:admin') || roles.includes('super_admin')) {
    return '/superadmin'
  }
  
  if (role === 'admin' || roles.includes('admin')) {
    return '/dashboard'
  }
  
  if (role === 'radiologist' || roles.includes('radiologist')) {
    return '/dashboard'
  }
  
  if (role === 'staff' || roles.includes('staff')) {
    return '/dashboard'
  }
  
  // Default redirect
  return '/dashboard'
}

export const getRoleName = (role: string | null): string => {
  switch (role) {
    case 'superadmin':
      return 'Super Administrator'
    case 'admin':
      return 'Administrator'
    case 'radiologist':
      return 'Radiologist'
    case 'staff':
      return 'Staff'
    default:
      return 'User'
  }
}
