// Create mock patient study data to populate the application.
import type { PatientStudy } from './types.ts';

// Using a CORS proxy to ensure remote images can be loaded without policy errors.
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export const MOCK_STUDIES: PatientStudy[] = [
  {
    id: 'study-5',
    patientName: 'David Chen',
    patientAge: 58,
    patientGender: 'Male',
    studyType: 'MRI Spine',
    studyDate: '2023-10-28',
    // This is a sagittal T2-weighted image of a lumbar spine.
    dicomImageUrl: `${CORS_PROXY}https://raw.githubusercontent.com/radiant-viewer/radiant-viewer-data/master/images/dicom-files/series-01-mr-spine-7-images/image-4.dcm`,
    reportSaved: false,
  },
  {
    id: 'study-1',
    patientName: 'John Doe',
    patientAge: 45,
    patientGender: 'Male',
    studyType: 'CT Head',
    studyDate: '2023-10-26',
    dicomImageUrl: `${CORS_PROXY}https://raw.githubusercontent.com/radiant-viewer/radiant-viewer-data/master/images/dicom-files/series-03-22-images/image-12.dcm`,
    reportSaved: true,
  },
  {
    id: 'study-2',
    patientName: 'Jane Smith',
    patientAge: 62,
    patientGender: 'Female',
    studyType: 'MRI Brain',
    studyDate: '2023-10-25',
    dicomImageUrl: `${CORS_PROXY}https://raw.githubusercontent.com/ivmartel/dwv/master/tests/data/bbmri-53323851.dcm`,
    reportSaved: false,
  },
  {
    id: 'study-3',
    patientName: 'Robert Johnson',
    patientAge: 71,
    patientGender: 'Male',
    studyType: 'X-Ray Chest',
    studyDate: '2023-10-27',
    dicomImageUrl: `${CORS_PROXY}https://raw.githubusercontent.com/ivmartel/dwv-jqui-data/master/data/chest-xray/image-000000.dcm`,
    reportSaved: false,
  },
  {
    id: 'study-4',
    patientName: 'Emily White',
    patientAge: 33,
    patientGender: 'Female',
    studyType: 'Ultrasound Aorta',
    studyDate: '2023-10-26',
    dicomImageUrl: `${CORS_PROXY}https://raw.githubusercontent.com/ivmartel/dwv-jqui-data/master/data/us-aorta/image-000000.dcm`,
    reportSaved: false,
  },
];