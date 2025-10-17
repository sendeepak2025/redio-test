import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { CssBaseline } from '@mui/material'
import { Helmet } from 'react-helmet-async'

import { useAuth } from './hooks/useAuth'
import { useAuthSync } from './hooks/useAuthSync'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { AuthDebug } from './components/debug/AuthDebug'
import { getRoleBasedRedirect } from './utils/roleBasedRedirect'

import ViewerPage from './pages/viewer/ViewerPage'
import PatientsPage from './pages/patients/PatientsPage'
import OrthancViewerPage from './pages/orthanc/OrthancViewerPage'
import SystemDashboard from './pages/dashboard/SystemDashboard'
import MainLayout from './components/layout/MainLayout'
import UsersPage from './pages/users/UsersPage'
import LandingPage from './pages/LandingPage'
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import SettingsPage from './pages/settings/SettingsPage'
import ProfilePage from './pages/profile/ProfilePage'

// Simple pages without complex dependencies
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'))



// Simple Protected Route
const SimpleProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  console.log('SimpleProtectedRoute:', { isAuthenticated, isLoading, user })

  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }

  console.log('Authenticated, showing protected content')
  return <>{children}</>
}

// Super Admin Protected Route
const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  console.log('SuperAdminRoute:', { isAuthenticated, isLoading, user, roles: user?.roles })

  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // Check if user has super admin role
  const isSuperAdmin = user?.roles?.includes('system:admin') || user?.roles?.includes('super_admin')
  
  if (!isSuperAdmin) {
    console.log('Not a super admin, redirecting to dashboard')
    return <Navigate to="/dashboard" replace />
  }

  console.log('Super admin authenticated, showing protected content')
  return <>{children}</>
}

function App() {
  const { isAuthenticated, isLoading, user, error } = useAuth()
  
  // Sync auth state with browser events
  useAuthSync()

  console.log('App render:', { isAuthenticated, isLoading, user, error })

  // Show loading screen while checking authentication
  if (isLoading) {
    console.log('App showing loading screen')
    return <LoadingScreen message="Initializing application..." />
  }

  // Show error if authentication failed
  if (error) {
    console.error('Authentication error:', error)
  }

  return (
    <>
      <Helmet>
        <title>Medical Imaging Viewer</title>
        <meta name="description" content="Advanced medical imaging viewer with AI-powered analysis" />
      </Helmet>

      <CssBaseline />

      <React.Suspense fallback={<LoadingScreen message="Loading page..." />}>
        <Routes>
          {/* Public routes */}
          <Route path="/landing" element={<LandingPage />} />
          
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={getRoleBasedRedirect(user?.roles?.[0] || null, user?.roles || [])} replace />
              ) : (
                <LoginPage />
              )
            }
          />

          {/* Debug route */}
          <Route
            path="/debug"
            element={<AuthDebug />}
          />

          {/* Protected routes with layout */}
          <Route
            path="/dashboard"
            element={
              <SimpleProtectedRoute>
                <MainLayout>
                  <SystemDashboard />
                </MainLayout>
              </SimpleProtectedRoute>
            }
          />
          
          <Route
            path="/patients"
            element={
              <SimpleProtectedRoute>
                <MainLayout>
                  <PatientsPage />
                </MainLayout>
              </SimpleProtectedRoute>
            }
          />
          
          <Route
            path="/system-monitoring"
            element={
              <SimpleProtectedRoute>
                <MainLayout>
                  <SystemDashboard />
                </MainLayout>
              </SimpleProtectedRoute>
            }
          />
          
          <Route
            path="/users"
            element={
              <SimpleProtectedRoute>
                <MainLayout>
                  <UsersPage />
                </MainLayout>
              </SimpleProtectedRoute>
            }
          />
          
          <Route
            path="/users/:type"
            element={
              <SimpleProtectedRoute>
                <MainLayout>
                  <UsersPage />
                </MainLayout>
              </SimpleProtectedRoute>
            }
          />
          
          <Route
            path="/superadmin"
            element={
              <SuperAdminRoute>
                <MainLayout>
                  <SuperAdminDashboard />
                </MainLayout>
              </SuperAdminRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <SimpleProtectedRoute>
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              </SimpleProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <SimpleProtectedRoute>
                <MainLayout>
                  <ProfilePage />
                </MainLayout>
              </SimpleProtectedRoute>
            }
          />

          <Route
            path="/viewer/:studyInstanceUID"
            element={
              <SimpleProtectedRoute>
                <ViewerPage />
              </SimpleProtectedRoute>
            }
          />

          <Route
            path="/patient/studies/:studyInstanceUID"
            element={
              <SimpleProtectedRoute>
                <ViewerPage />
              </SimpleProtectedRoute>
            }
          />

          {/* Orthanc Viewer - Direct access to Orthanc studies */}
          <Route
            path="/orthanc"
            element={
              <SimpleProtectedRoute>
                <MainLayout>
                  <OrthancViewerPage />
                </MainLayout>
              </SimpleProtectedRoute>
            }
  
/>
          {/* Default redirect */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          {/* Catch all */}
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </React.Suspense>
    </>
  )
}

export default App