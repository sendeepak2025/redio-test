import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Collapse,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Computer as ComputerIcon,
  Folder as FolderIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  ExpandLess,
  ExpandMore,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon,
  MedicalServices as MedicalIcon,
  LocalHospital as HospitalIcon,
  Science as ScienceIcon,
} from '@mui/icons-material'

const drawerWidth = 280

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const [usersMenuOpen, setUsersMenuOpen] = useState(false)

  // Mock user data - replace with actual auth context
  const currentUser = {
    name: 'Dr. John Smith',
    role: 'Radiologist',
    email: 'john.smith@hospital.com',
    avatar: '/avatar.jpg'
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  const handleLogout = () => {
    // Implement logout logic
    navigate('/login')
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const menuItems = [
    {
      title: 'Main',
      items: [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Patients', icon: <PeopleIcon />, path: '/patients' },
        { text: 'Studies', icon: <FolderIcon />, path: '/orthanc' },
      ]
    },
    {
      title: 'System',
      items: [
        { text: 'System Monitoring', icon: <ComputerIcon />, path: '/system-monitoring' },
        { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
      ]
    },
    {
      title: 'Administration',
      items: [
        { 
          text: 'User Management', 
          icon: <GroupIcon />, 
          submenu: [
            { text: 'All Users', icon: <PeopleIcon />, path: '/users' },
            { text: 'Providers', icon: <MedicalIcon />, path: '/users/providers' },
            { text: 'Staff', icon: <HospitalIcon />, path: '/users/staff' },
            { text: 'Technicians', icon: <ScienceIcon />, path: '/users/technicians' },
            { text: 'Administrators', icon: <AdminIcon />, path: '/users/admins' },
          ]
        },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
      ]
    },
  ]

  const drawer = (
    <Box>
      {/* Logo/Header */}
      <Toolbar sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <MedicalIcon sx={{ mr: 1 }} />
        <Typography variant="h6" noWrap component="div">
          Radiology System
        </Typography>
      </Toolbar>
      <Divider />

      {/* User Info */}
      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ width: 40, height: 40, mr: 1.5, bgcolor: 'primary.main' }}>
            {currentUser.name.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {currentUser.name}
            </Typography>
            <Chip 
              label={currentUser.role} 
              size="small" 
              color="primary" 
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
        </Box>
      </Box>
      <Divider />

      {/* Navigation Menu */}
      <List sx={{ px: 1 }}>
        {menuItems.map((section, sectionIndex) => (
          <Box key={sectionIndex}>
            <ListItem sx={{ pt: 2, pb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                {section.title}
              </Typography>
            </ListItem>
            {section.items.map((item, itemIndex) => (
              <Box key={itemIndex}>
                {item.submenu ? (
                  <>
                    <ListItemButton
                      onClick={() => setUsersMenuOpen(!usersMenuOpen)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} />
                      {usersMenuOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={usersMenuOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.submenu.map((subItem, subIndex) => (
                          <ListItemButton
                            key={subIndex}
                            onClick={() => navigate(subItem.path)}
                            selected={isActive(subItem.path)}
                            sx={{
                              pl: 4,
                              borderRadius: 1,
                              mb: 0.5,
                              ml: 2,
                              '&.Mui-selected': {
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                                '&:hover': {
                                  bgcolor: 'primary.main',
                                },
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                              {subItem.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={subItem.text}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  </>
                ) : (
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={isActive(item.path)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: isActive(item.path) ? 'inherit' : 'action.active' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                )}
              </Box>
            ))}
            {sectionIndex < menuItems.length - 1 && <Divider sx={{ my: 1 }} />}
          </Box>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {location.pathname === '/dashboard' && 'Dashboard'}
            {location.pathname === '/patients' && 'Patients'}
            {location.pathname === '/system-monitoring' && 'System Monitoring'}
            {location.pathname === '/orthanc' && 'Studies'}
            {location.pathname.startsWith('/users') && 'User Management'}
            {location.pathname === '/settings' && 'Settings'}
          </Typography>
          <IconButton
            onClick={handleUserMenuOpen}
            size="small"
            sx={{ ml: 2 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {currentUser.name.charAt(0)}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
          >
            <MenuItem onClick={() => { navigate('/profile'); handleUserMenuClose(); }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { navigate('/settings'); handleUserMenuClose(); }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default MainLayout
