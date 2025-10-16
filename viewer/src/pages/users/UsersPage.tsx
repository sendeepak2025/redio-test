import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Tabs,
  Tab,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
} from '@mui/icons-material'

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  isActive: boolean
  lastLogin?: string
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedTab, setSelectedTab] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Mock data - replace with API call
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        username: 'dr.smith',
        email: 'john.smith@hospital.com',
        firstName: 'John',
        lastName: 'Smith',
        roles: ['radiologist', 'provider'],
        isActive: true,
        lastLogin: '2024-10-16T10:30:00Z'
      },
      {
        id: '2',
        username: 'dr.johnson',
        email: 'sarah.johnson@hospital.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        roles: ['radiologist', 'provider'],
        isActive: true,
        lastLogin: '2024-10-16T09:15:00Z'
      },
      {
        id: '3',
        username: 'tech.mike',
        email: 'mike.brown@hospital.com',
        firstName: 'Mike',
        lastName: 'Brown',
        roles: ['technician'],
        isActive: true,
        lastLogin: '2024-10-16T08:00:00Z'
      },
      {
        id: '4',
        username: 'nurse.emily',
        email: 'emily.davis@hospital.com',
        firstName: 'Emily',
        lastName: 'Davis',
        roles: ['staff', 'nurse'],
        isActive: true,
        lastLogin: '2024-10-15T16:45:00Z'
      },
      {
        id: '5',
        username: 'admin.robert',
        email: 'robert.wilson@hospital.com',
        firstName: 'Robert',
        lastName: 'Wilson',
        roles: ['admin'],
        isActive: true,
        lastLogin: '2024-10-16T07:30:00Z'
      },
    ]
    setUsers(mockUsers)
    setFilteredUsers(mockUsers)
  }, [])

  useEffect(() => {
    filterUsers()
  }, [selectedTab, users])

  const filterUsers = () => {
    let filtered = users
    switch (selectedTab) {
      case 1: // Providers
        filtered = users.filter(u => u.roles.includes('provider') || u.roles.includes('radiologist'))
        break
      case 2: // Staff
        filtered = users.filter(u => u.roles.includes('staff') || u.roles.includes('nurse'))
        break
      case 3: // Technicians
        filtered = users.filter(u => u.roles.includes('technician'))
        break
      case 4: // Admins
        filtered = users.filter(u => u.roles.includes('admin'))
        break
      default: // All
        filtered = users
    }
    setFilteredUsers(filtered)
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, any> = {
      radiologist: 'primary',
      provider: 'primary',
      technician: 'secondary',
      staff: 'info',
      nurse: 'info',
      admin: 'error',
    }
    return colors[role] || 'default'
  }

  const handleAddUser = () => {
    setEditingUser(null)
    setOpenDialog(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingUser(null)
  }

  const handleSaveUser = () => {
    // Implement save logic
    handleCloseDialog()
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          Add User
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)}>
          <Tab label={`All Users (${users.length})`} />
          <Tab label="Providers" />
          <Tab label="Staff" />
          <Tab label="Technicians" />
          <Tab label="Administrators" />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        @{user.username}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {user.roles.map((role) => (
                      <Chip
                        key={role}
                        label={role}
                        size="small"
                        color={getRoleColor(role)}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={user.isActive ? <ActiveIcon /> : <BlockIcon />}
                    label={user.isActive ? 'Active' : 'Inactive'}
                    color={user.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleEditUser(user)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="First Name"
              fullWidth
              defaultValue={editingUser?.firstName}
            />
            <TextField
              label="Last Name"
              fullWidth
              defaultValue={editingUser?.lastName}
            />
            <TextField
              label="Username"
              fullWidth
              defaultValue={editingUser?.username}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              defaultValue={editingUser?.email}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                multiple
                defaultValue={editingUser?.roles || []}
                label="Role"
              >
                <MenuItem value="radiologist">Radiologist</MenuItem>
                <MenuItem value="provider">Provider</MenuItem>
                <MenuItem value="technician">Technician</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="nurse">Nurse</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
              </Select>
            </FormControl>
            {!editingUser && (
              <TextField
                label="Password"
                type="password"
                fullWidth
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">
            {editingUser ? 'Save Changes' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UsersPage
