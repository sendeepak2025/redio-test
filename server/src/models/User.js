const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  roles: { type: [String], default: ['user'] },
  permissions: { type: [String], default: ['studies:read'] },
  hospitalId: { 
    type: String, 
    index: true 
  }, // Hospital ID as string (e.g., "HOSP001") for multi-tenancy
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: true },
  mfaEnabled: { type: Boolean, default: false },
  lastLogin: { type: Date },
}, { timestamps: true })

UserSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    roles: this.roles,
    permissions: this.permissions,
    // Convert ObjectId to string
    hospitalId: this.hospitalId ? this.hospitalId.toString() : undefined,
    isActive: this.isActive,
    isVerified: this.isVerified,
    mfaEnabled: this.mfaEnabled,
    lastLogin: this.lastLogin ? this.lastLogin.toISOString() : undefined,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  }
}

// Helper method to get primary role for routing
UserSchema.methods.getPrimaryRole = function () {
  if (this.roles.includes('system:admin') || this.roles.includes('super_admin')) {
    return 'superadmin'
  }
  if (this.roles.includes('admin')) {
    return 'admin'
  }
  if (this.roles.includes('radiologist')) {
    return 'radiologist'
  }
  if (this.roles.includes('staff')) {
    return 'staff'
  }
  return 'user'
}

module.exports = mongoose.model('User', UserSchema)