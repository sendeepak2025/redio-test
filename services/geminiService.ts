

import { GoogleGenAI } from "@google/genai";
import type { PatientStudy } from '../types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReportWithMedGemma = async (study: PatientStudy, providerNotes: string): Promise<string> => {
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    You are MedGemma, a highly intelligent medical AI assistant specializing in radiology reporting. 
    Your task is to generate a draft radiological report based on the provided study information and preliminary notes from the provider.
    The report should be structured, clear, and professional.

    **Patient & Study Information:**
    - Patient Name: ${study.patientName}
    - Patient Age: ${study.patientAge}
    - Patient Gender: ${study.patientGender}
    - Study Type: ${study.studyType}
    - Study Date: ${study.studyDate}

    **Provider's Preliminary Notes:**
    - ${providerNotes || 'No preliminary notes provided.'}

    **Instructions:**
    1.  Start with a "FINDINGS:" section.
    2.  Describe the key observations based on the study type and notes.
    3.  Follow with an "IMPRESSION:" section.
    4.  Summarize the most critical findings and provide a concise conclusion.
    5.  Maintain a formal and objective tone throughout the report.

    Generate the report now.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating report with MedGemma:", error);
    return "Error: Could not generate the report. Please check the console for details.";
  }
};