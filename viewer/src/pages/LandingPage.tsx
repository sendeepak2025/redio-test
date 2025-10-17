import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import {
  CloudUpload,
  Security,
  Speed,
  Analytics,
  LocalHospital,
  Psychology,
  Assessment,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    position: '',
    message: '',
    type: 'contact'
  });

  const [demoForm, setDemoForm] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    position: '',
    estimatedUsers: '',
    estimatedStudiesPerMonth: '',
    currentSystem: '',
    timeline: '1-3 months',
    interestedIn: [] as string[],
    message: ''
  });

  const features = [
    {
      icon: <CloudUpload sx={{ fontSize: 48 }} />,
      title: 'Cloud-Based PACS',
      description: 'Secure, scalable cloud storage for all your medical imaging data with instant access from anywhere.'
    },
    {
      icon: <Security sx={{ fontSize: 48 }} />,
      title: 'HIPAA Compliant',
      description: 'Enterprise-grade security with encryption, audit logging, and role-based access control.'
    },
    {
      icon: <Speed sx={{ fontSize: 48 }} />,
      title: 'Fast Performance',
      description: 'Advanced caching and optimization for instant image loading and smooth 3D rendering.'
    },
    {
      icon: <Psychology sx={{ fontSize: 48 }} />,
      title: 'AI-Powered Analysis',
      description: 'Integrated medical AI for automated findings detection and diagnostic assistance.'
    },
    {
      icon: <Assessment sx={{ fontSize: 48 }} />,
      title: 'Structured Reporting',
      description: 'Comprehensive reporting tools with templates, measurements, and annotations.'
    },
    {
      icon: <Analytics sx={{ fontSize: 48 }} />,
      title: 'Analytics Dashboard',
      description: 'Real-time insights into usage, performance, and operational metrics.'
    }
  ];

  const handleContactSubmit = async () => {
    try {
      setSubmitError('');
      await axios.post('/api/public/contact-request', {
        type: contactForm.type,
        contactInfo: {
          name: contactForm.name,
          email: contactForm.email,
          phone: contactForm.phone,
          organization: contactForm.organization,
          position: contactForm.position
        },
        details: {
          message: contactForm.message
        }
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setContactDialogOpen(false);
        setSubmitSuccess(false);
        setContactForm({
          name: '',
          email: '',
          phone: '',
          organization: '',
          position: '',
          message: '',
          type: 'contact'
        });
      }, 2000);
    } catch (error) {
      setSubmitError('Failed to submit request. Please try again.');
    }
  };

  const handleDemoSubmit = async () => {
    try {
      setSubmitError('');
      await axios.post('/api/public/contact-request', {
        type: 'demo',
        contactInfo: {
          name: demoForm.name,
          email: demoForm.email,
          phone: demoForm.phone,
          organization: demoForm.organization,
          position: demoForm.position
        },
        details: {
          message: demoForm.message,
          estimatedUsers: parseInt(demoForm.estimatedUsers) || 0,
          estimatedStudiesPerMonth: parseInt(demoForm.estimatedStudiesPerMonth) || 0,
          currentSystem: demoForm.currentSystem,
          timeline: demoForm.timeline,
          interestedIn: demoForm.interestedIn
        }
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setDemoDialogOpen(false);
        setSubmitSuccess(false);
        setDemoForm({
          name: '',
          email: '',
          phone: '',
          organization: '',
          position: '',
          estimatedUsers: '',
          estimatedStudiesPerMonth: '',
          currentSystem: '',
          timeline: '1-3 months',
          interestedIn: [],
          message: ''
        });
      }, 2000);
    } catch (error) {
      setSubmitError('Failed to submit request. Please try again.');
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 12,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <LocalHospital sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h2" gutterBottom fontWeight="bold">
            Medical Imaging Platform
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            Enterprise PACS, AI-Powered Diagnostics, and Cloud-Based Collaboration
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
              onClick={() => setDemoDialogOpen(true)}
            >
              Request Demo
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'grey.100' } }}
              onClick={() => navigate('/auth/login')}
            >
              Sign In
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom fontWeight="bold">
          Key Features
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
          Everything you need for modern medical imaging
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" gutterBottom fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom fontWeight="bold">
            Why Choose Us?
          </Typography>
          <Grid container spacing={3} sx={{ mt: 4 }}>
            {[
              'Multi-site deployment support',
              'Real-time collaboration tools',
              'Advanced 3D visualization',
              'Automated backup and disaster recovery',
              'Comprehensive audit logging',
              'Role-based access control',
              'Integration with existing PACS',
              'Mobile-friendly interface',
              '24/7 technical support',
              'Regular feature updates'
            ].map((benefit, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <CheckCircle color="success" />
                  <Typography variant="body1">{benefit}</Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom fontWeight="bold">
          Ready to Get Started?
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Join hundreds of healthcare facilities using our platform
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={() => setDemoDialogOpen(true)}
          >
            Schedule Demo
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => setContactDialogOpen(true)}
          >
            Contact Sales
          </Button>
        </Stack>
      </Container>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contact Us</DialogTitle>
        <DialogContent>
          {submitSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Request submitted successfully! We'll contact you soon.
            </Alert>
          )}
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Name"
            value={contactForm.name}
            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={contactForm.email}
            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Phone"
            value={contactForm.phone}
            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Organization"
            value={contactForm.organization}
            onChange={(e) => setContactForm({ ...contactForm, organization: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Position"
            value={contactForm.position}
            onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={4}
            value={contactForm.message}
            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleContactSubmit}
            disabled={!contactForm.name || !contactForm.email || !contactForm.message}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Demo Dialog */}
      <Dialog open={demoDialogOpen} onClose={() => setDemoDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Request a Demo</DialogTitle>
        <DialogContent>
          {submitSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Demo request submitted! Our team will contact you within 24 hours.
            </Alert>
          )}
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={demoForm.name}
                onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={demoForm.email}
                onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={demoForm.phone}
                onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Organization"
                value={demoForm.organization}
                onChange={(e) => setDemoForm({ ...demoForm, organization: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={demoForm.position}
                onChange={(e) => setDemoForm({ ...demoForm, position: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Users"
                type="number"
                value={demoForm.estimatedUsers}
                onChange={(e) => setDemoForm({ ...demoForm, estimatedUsers: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Studies per Month"
                type="number"
                value={demoForm.estimatedStudiesPerMonth}
                onChange={(e) => setDemoForm({ ...demoForm, estimatedStudiesPerMonth: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Timeline"
                value={demoForm.timeline}
                onChange={(e) => setDemoForm({ ...demoForm, timeline: e.target.value })}
                margin="normal"
              >
                <MenuItem value="immediate">Immediate</MenuItem>
                <MenuItem value="1-3 months">1-3 Months</MenuItem>
                <MenuItem value="3-6 months">3-6 Months</MenuItem>
                <MenuItem value="6+ months">6+ Months</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current System"
                value={demoForm.currentSystem}
                onChange={(e) => setDemoForm({ ...demoForm, currentSystem: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Information"
                multiline
                rows={3}
                value={demoForm.message}
                onChange={(e) => setDemoForm({ ...demoForm, message: e.target.value })}
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDemoDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleDemoSubmit}
            disabled={!demoForm.name || !demoForm.email || !demoForm.organization}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LandingPage;
