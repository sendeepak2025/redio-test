const Study = require('../models/Study');
const Patient = require('../models/Patient');

async function getPatients(req, res) {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    // Build query based on user's hospital
    const query = {};

    // Check if user is super admin
    const isSuperAdmin = req.user.roles && (
      req.user.roles.includes('system:admin') ||
      req.user.roles.includes('super_admin')
    );

    // Filter by hospital for non-super-admin users
    if (!isSuperAdmin && req.user.hospitalId) {
      query.hospitalId = req.user.hospitalId;
      console.log(`🔒 Filtering patients by hospitalId: ${req.user.hospitalId} for user: ${req.user.username}`);
    } else if (isSuperAdmin) {
      console.log(`👑 Super admin ${req.user.username} - showing all patients`);
    }

    const patients = await Patient.find(query).lean();
    console.log(`   📋 Found ${patients.length} patients`);

    const out = patients.map(p => ({
      patientID: p.patientID,
      patientName: p.patientName || 'Unknown',
      birthDate: p.birthDate || '',
      sex: p.sex || '',
      studyCount: Array.isArray(p.studyIds) ? p.studyIds.length : 0,
      hospitalId: p.hospitalId ? p.hospitalId.toString() : null
    }));
    res.json({ success: true, data: out });
  } catch (e) {
    console.error('Failed to list patients:', e);
    res.status(500).json({ success: false, message: e.message });
  }
}

async function getPatientStudies(req, res) {
  try {
    const { patientID } = req.params;

    // Build query based on user's hospital
    const patientQuery = { patientID };
    if (req.user && req.user.hospitalId) {
      const isSuperAdmin = req.user.roles && (
        req.user.roles.includes('system:admin') ||
        req.user.roles.includes('super_admin')
      );

      if (!isSuperAdmin) {
        patientQuery.hospitalId = req.user.hospitalId;
      }
    }

    const patient = await Patient.findOne(patientQuery).lean();
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Build study query
    const studyQuery = { patientID };
    if (patient.hospitalId) {
      studyQuery.hospitalId = patient.hospitalId;
    }

    let studies = [];
    if (Array.isArray(patient.studyIds) && patient.studyIds.length > 0) {
      studyQuery.studyInstanceUID = { $in: patient.studyIds };
      studies = await Study.find(studyQuery).lean();
    } else {
      // Fallback: query by patientID if studyIds are not populated
      studies = await Study.find(studyQuery).lean();
    }

    const out = studies.map(s => ({
      studyInstanceUID: s.studyInstanceUID,
      patientName: s.patientName || patient.patientName || 'Unknown',
      patientID: s.patientID || patientID,
      modality: s.modality || 'OT',
      numberOfSeries: s.numberOfSeries || 1,
      numberOfInstances: s.numberOfInstances || 1,
      studyDescription: s.studyDescription || '',
      hospitalId: s.hospitalId
    }));

    res.json({ success: true, data: out });
  } catch (e) {
    console.error('Failed to list patient studies:', e);
    res.status(500).json({ success: false, message: e.message });
  }
}

async function createPatient(req, res) {
  try {
    const { patientID, patientName, birthDate, sex } = req.body || {}
    if (!patientID || typeof patientID !== 'string') {
      return res.status(400).json({ success: false, message: 'patientID is required' })
    }

    // Check authentication
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    // Get hospitalId from authenticated user (already a string from JWT)
    const hospitalId = req.user.hospitalId || null;

    console.log(`👤 Creating patient ${patientID} for hospital: ${hospitalId} by user: ${req.user.username}`);

    // Upsert patient by patientID
    const existing = await Patient.findOne({ patientID })
    if (existing) {
      existing.patientName = patientName ?? existing.patientName
      existing.birthDate = birthDate ?? existing.birthDate
      existing.sex = sex ?? existing.sex
      // Update hospitalId if not set
      if (!existing.hospitalId && hospitalId) {
        existing.hospitalId = hospitalId;
        console.log(`   ✅ Updated existing patient with hospitalId: ${hospitalId}`);
      }
      await existing.save()
      return res.json({
        success: true,
        data: {
          patientID: existing.patientID,
          hospitalId: existing.hospitalId ? existing.hospitalId.toString() : null
        }
      })
    }

    const patient = new Patient({
      patientID,
      patientName,
      birthDate,
      sex,
      studyIds: [],
      hospitalId
    })
    await patient.save()
    console.log(`   ✅ Created new patient with hospitalId: ${hospitalId}`);

    res.json({
      success: true,
      data: {
        patientID: patient.patientID,
        hospitalId: patient.hospitalId ? patient.hospitalId.toString() : null
      }
    })
  } catch (e) {
    console.error('Failed to create patient:', e)
    res.status(500).json({ success: false, message: e.message })
  }
}

module.exports = { getPatients, getPatientStudies, createPatient }