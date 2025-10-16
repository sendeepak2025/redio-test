import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Divider,
  useTheme,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../../hooks/useAuth'
import type { LoginCredentials } from '../../types/auth'
import { TestCredentials } from '../../components/auth/TestCredentials'

const LoginPage: React.FC = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearAuthError } = useAuth()

  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
    rememberMe: false,
  })

  const from = (location.state as any)?.from?.pathname || '/dashboard'

  const handleInputChange = (field: keyof LoginCredentials) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: event.target.value,
    }))
    
    // Clear error when user starts typing
    if (error) {
      clearAuthError()
    }
  }

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      rememberMe: event.target.checked,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!credentials.username || !credentials.password) {
      return
    }

    try {
      const result = await login(credentials)
      
      if (result.type === 'auth/login/fulfilled') {
        navigate(from, { replace: true })
      }
    } catch (err) {
      // Error is handled by Redux
      console.error('Login failed:', err)
    }
  }

  return (
    <>
      <Helmet>
        <title>Login - Medical Imaging Viewer</title>
      </Helmet>
      
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.default,
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 3,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            borderRadius: 2,
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: theme.palette.primary.main,
              }}
            >
              MedViewer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to access your medical imaging workspace
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Username or Email"
              type="text"
              value={credentials.username}
              onChange={handleInputChange('username')}
              margin="normal"
              required
              autoComplete="username"
              autoFocus
              disabled={isLoading}
              error={!credentials.username && error !== null}
            />
            
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={credentials.password}
              onChange={handleInputChange('password')}
              margin="normal"
              required
              autoComplete="current-password"
              disabled={isLoading}
              error={!credentials.password && error !== null}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading || !credentials.username || !credentials.password}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                variant="body2"
                onClick={(e) => {
                  e.preventDefault()
                  // Handle forgot password
                }}
                disabled={isLoading}
              >
                Forgot your password?
              </Link>
            </Box>
            <FormControlLabel
              control={<Checkbox checked={credentials.rememberMe} onChange={handleCheckboxChange} />}
              label="Remember me"
              sx={{ mt: 1 }}
            />
          </Box>

          {/* Test Credentials (Development Only) */}
          {import.meta.env.DEV && (
            <>
              <Divider sx={{ my: 3 }} />
              <TestCredentials />
            </>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Footer */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Medical Imaging Platform v1.0.0
            </Typography>
          </Box>
        </Paper>
      </Box>
    </>
  )
}

export default LoginPage