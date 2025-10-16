// Define the PatientStudy interface.
export interface PatientStudy {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  studyType: string;
  studyDate: string;
  dicomImageUrl: string;
  dicomFile?: File;
  reportSaved?: boolean;
}