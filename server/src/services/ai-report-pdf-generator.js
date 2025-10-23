const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * AI Report PDF Generator
 * Creates professional PDF reports from AI analysis data
 */
class AIReportPDFGenerator {
  constructor() {
    this.pageMargin = 50;
    this.contentWidth = 500;
  }

  /**
   * Generate PDF report from AI analysis data
   */
  async generatePDF(reportData, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: this.pageMargin,
            bottom: this.pageMargin,
            left: this.pageMargin,
            right: this.pageMargin
          }
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Generate report content
        this.addHeader(doc, reportData);
        this.addPatientInfo(doc, reportData);
        this.addImageSnapshot(doc, reportData);
        this.addReportSections(doc, reportData);
        this.addKeyFindings(doc, reportData);
        this.addDetections(doc, reportData);
        this.addQualityMetrics(doc, reportData);
        this.addFooter(doc, reportData);

        doc.end();

        stream.on('finish', () => {
          console.log(`📄 PDF report generated: ${outputPath}`);
          resolve(outputPath);
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add report header
   */
  addHeader(doc, reportData) {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('AI-ASSISTED RADIOLOGY REPORT', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Report ID: ${reportData.reportId}`, { align: 'center' })
       .text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, { align: 'center' })
       .moveDown(1);

    // Add line separator
    doc.moveTo(this.pageMargin, doc.y)
       .lineTo(this.pageMargin + this.contentWidth, doc.y)
       .stroke()
       .moveDown(1);
  }

  /**
   * Add patient information
   */
  addPatientInfo(doc, reportData) {
    const patient = reportData.patientInfo || {};

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('PATIENT INFORMATION')
       .moveDown(0.5);

    doc.fontSize(10)
       .font('Helvetica');

    const patientInfo = [
      ['Patient ID:', patient.patientID || 'N/A'],
      ['Patient Name:', patient.patientName || 'N/A'],
      ['Age:', patient.age || 'N/A'],
      ['Sex:', patient.sex || 'N/A'],
      ['Modality:', reportData.modality || 'N/A'],
      ['Study UID:', reportData.studyInstanceUID || 'N/A']
    ];

    patientInfo.forEach(([label, value]) => {
      doc.text(`${label} `, { continued: true, width: 150 })
         .font('Helvetica-Bold')
         .text(value)
         .font('Helvetica');
    });

    if (patient.indication && patient.indication !== 'Not specified') {
      doc.moveDown(0.5)
         .text('Clinical Indication: ', { continued: true })
         .font('Helvetica-Bold')
         .text(patient.indication)
         .font('Helvetica');
    }

    doc.moveDown(1);
  }

  /**
   * Add image snapshot
   */
  addImageSnapshot(doc, reportData) {
    if (reportData.imageSnapshot && reportData.imageSnapshot.absolutePath) {
      try {
        const imagePath = reportData.imageSnapshot.absolutePath;
        
        if (fs.existsSync(imagePath)) {
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .text('ANALYZED IMAGE')
             .moveDown(0.5);

          // Add image (scaled to fit)
          doc.image(imagePath, {
            fit: [400, 300],
            align: 'center'
          });

          doc.moveDown(0.5)
             .fontSize(9)
             .font('Helvetica-Oblique')
             .text(`Frame ${reportData.frameIndex || 0}`, { align: 'center' })
             .font('Helvetica')
             .moveDown(1);
        }
      } catch (error) {
        console.warn('Could not add image to PDF:', error.message);
      }
    }
  }

  /**
   * Add report sections
   */
  addReportSections(doc, reportData) {
    const sections = reportData.sections || {};

    Object.entries(sections).forEach(([sectionName, sectionContent]) => {
      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(sectionName)
         .moveDown(0.5);

      doc.fontSize(10)
         .font('Helvetica')
         .text(sectionContent || 'No content', {
           align: 'justify',
           lineGap: 2
         })
         .moveDown(1);
    });
  }

  /**
   * Add key findings table
   */
  addKeyFindings(doc, reportData) {
    const findings = reportData.keyFindings || [];

    if (findings.length === 0) return;

    // Check if we need a new page
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('KEY FINDINGS')
       .moveDown(0.5);

    findings.forEach((finding, index) => {
      const severity = finding.severity || 'UNKNOWN';
      const confidence = ((finding.confidence || 0) * 100).toFixed(1);

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${finding.finding}`, { continued: true })
         .font('Helvetica')
         .text(` (${confidence}% confidence)`)
         .fontSize(9)
         .text(`   Category: ${finding.category || 'N/A'} | Severity: ${severity}`)
         .moveDown(0.5);
    });

    doc.moveDown(0.5);
  }

  /**
   * Add AI detections
   */
  addDetections(doc, reportData) {
    const detections = reportData.detections?.detections || [];

    if (detections.length === 0) return;

    // Check if we need a new page
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('AI DETECTED ABNORMALITIES')
       .moveDown(0.5);

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Total Detections: ${detections.length}`)
       .moveDown(0.5);

    detections.forEach((detection, index) => {
      // Check if we need a new page
      if (doc.y > 680) {
        doc.addPage();
      }

      const confidence = ((detection.confidence || 0) * 100).toFixed(1);
      const bbox = detection.boundingBox || {};

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text(`Detection ${index + 1}: ${detection.label}`)
         .fontSize(10)
         .font('Helvetica')
         .text(`Confidence: ${confidence}% | Severity: ${detection.severity}`)
         .text(`Location: (${(bbox.x * 100).toFixed(0)}%, ${(bbox.y * 100).toFixed(0)}%)`)
         .moveDown(0.3);

      if (detection.description) {
        doc.fontSize(9)
           .text(detection.description, { align: 'justify' })
           .moveDown(0.3);
      }

      if (detection.measurements && Object.keys(detection.measurements).length > 0) {
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('Measurements:', { continued: true })
           .font('Helvetica');
        
        Object.entries(detection.measurements).forEach(([key, value]) => {
          doc.text(` ${key}: ${value}`, { continued: true });
        });
        doc.text('').moveDown(0.3);
      }

      if (detection.recommendations && detection.recommendations.length > 0) {
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('Recommendations:')
           .font('Helvetica');
        
        detection.recommendations.forEach(rec => {
          doc.text(`  • ${rec}`);
        });
      }

      doc.moveDown(0.5);
    });

    doc.moveDown(0.5);
  }

  /**
   * Add quality metrics
   */
  addQualityMetrics(doc, reportData) {
    const metrics = reportData.qualityMetrics || {};

    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
    }

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('QUALITY METRICS')
       .moveDown(0.5);

    doc.fontSize(10)
       .font('Helvetica');

    const metricsData = [
      ['Overall Confidence:', `${((metrics.overallConfidence || 0) * 100).toFixed(1)}%`],
      ['Image Quality:', metrics.imageQuality || 'N/A'],
      ['Report Completeness:', `${((metrics.completeness || 0) * 100).toFixed(0)}%`],
      ['Reliability Score:', `${((metrics.reliability || 0) * 100).toFixed(0)}%`]
    ];

    metricsData.forEach(([label, value]) => {
      doc.text(`${label} `, { continued: true, width: 200 })
         .font('Helvetica-Bold')
         .text(value)
         .font('Helvetica');
    });

    doc.moveDown(1);
  }

  /**
   * Add footer with disclaimer
   */
  addFooter(doc, reportData) {
    // Check if we need a new page
    if (doc.y > 680) {
      doc.addPage();
    }

    // Add line separator
    doc.moveTo(this.pageMargin, doc.y)
       .lineTo(this.pageMargin + this.contentWidth, doc.y)
       .stroke()
       .moveDown(0.5);

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('IMPORTANT DISCLAIMER', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(9)
       .font('Helvetica')
       .text(
         'This report is generated by AI-assisted analysis and is intended for use as a clinical decision support tool only. ' +
         'All findings must be verified by a qualified radiologist. AI systems are assistive tools and should not replace ' +
         'clinical judgment or professional medical expertise. This analysis requires radiologist review and approval.',
         { align: 'justify', lineGap: 2 }
       )
       .moveDown(0.5);

    // Add AI models used
    const models = reportData.metadata?.aiModelsUsed || [];
    if (models.length > 0) {
      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .text(`AI Models Used: ${models.join(', ')}`, { align: 'center' })
         .font('Helvetica');
    }

    // Add page numbers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .text(
           `Page ${i + 1} of ${pages.count}`,
           this.pageMargin,
           doc.page.height - 30,
           { align: 'center' }
         );
    }
  }
}

// Singleton instance
let pdfGenerator = null;

function getAIReportPDFGenerator() {
  if (!pdfGenerator) {
    pdfGenerator = new AIReportPDFGenerator();
  }
  return pdfGenerator;
}

module.exports = { AIReportPDFGenerator, getAIReportPDFGenerator };
