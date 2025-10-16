import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { CssBaseline, Box, Typography, Button, Paper } from '@mui/material'
import { Helmet } from 'react-helmet-async'

import { useAuth } from './hooks/useAuth'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { AuthDebug } from './components/debug/AuthDebug'

import ViewerPage from './pages/viewer/ViewerPage'
import PatientsPage from './pages/patients/PatientsPage'
import OrthancViewerPage from './pages/orthanc/OrthancViewerPage'
import SystemDashboard from './pages/dashboard/SystemDashboard'
import MainLayout from './components/layout/MainLayout'
import UsersPage from './pages/users/UsersPage'

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

function App() {
  const { isAuthenticated, isLoading, user, error } = useAuth()

  console.log('App render:', { isAuthenticated, isLoading, user, error })

  // BYPASS AUTHENTICATION FOR DICOM TESTING
  const bypassAuth = true



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
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
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
                  <PatientsPage />
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