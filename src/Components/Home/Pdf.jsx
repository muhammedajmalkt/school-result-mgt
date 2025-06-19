import { jsPDF } from 'jspdf';
import { Download } from 'lucide-react';

const PDFDownloadButton = ({ enhancedResult }) => {

  const downloadPDF = () => {
    if (!enhancedResult) return;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = '#1E3A8A'; 
    const accentColor = '#D97706';
    const headerBgColor = '#DBEAFE';
    const rowBgColor = '#F9FAFB'; 
    const textColor = '#111827'; 
    const pageWidth = 210;
    const margin = 20;
    let yPos = 12; 
    const logo = '/Yaseen Logo.png'; 
    doc.addImage(logo, 'PNG', 15, 25, 30, 15);

    doc.setFont('helvetica', 'bold');

    // Blue header background
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 45, 'F'); 

    // Logo placeholder
doc.addImage(logo, 'PNG', 28, 15, 15, 15); 

    // Header text (center-aligned)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    const examName = typeof enhancedResult.examName === 'string' ? enhancedResult.examName.toUpperCase() : 'N/A';
    doc.text('RAZA-UL ULOOM ISLAMIA HIGHER SECONDARY SCHOOL', pageWidth / 2, yPos, { align: 'center' });

    yPos += 6;
    doc.setFontSize(12);
    doc.text(`${examName} EXAMINATION RESULTS`, pageWidth / 2, yPos, { align: 'center' });

    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text('ACADEMIC YEAR 2025-2026', pageWidth / 2, yPos, { align: 'center' });

    yPos += 6;
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('123 Academic Lane, Springfield, USA'+ " | " + 'Email: contact@springfieldschool.org', pageWidth / 2, yPos, { align: 'center' });

    // yPos += 6;
    // doc.text('Email: contact@springfieldschool.org', pageWidth / 2, yPos, { align: 'center' });

    // Student Details
    yPos = 55; 
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 124);
    doc.text('Candidate Details', 20, yPos);

    yPos += 6;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(20, yPos, 190, yPos);

    yPos += 8;

    const detailsFontSize = 10;
    const labelWidth = 35;
    const detailSpacing = 8;
    const details = [
      { label: 'Name:', value: typeof enhancedResult.studentName === 'string' ? enhancedResult.studentName.toUpperCase() : 'N/A', bold: true },
      { label: 'Register No:', value: typeof enhancedResult.regNo === 'string' ? enhancedResult.regNo : 'N/A' },
      { label: 'Class:', value: enhancedResult.examData && typeof enhancedResult.examData.className === 'string' ? enhancedResult.examData.className : 'N/A' }
    ];

    if (enhancedResult.examData && typeof enhancedResult.examData.isStream === 'boolean' && enhancedResult.examData.isStream) {
      details.push({
        label: 'Stream:',
        value: typeof enhancedResult.examData.stream === 'string' ? enhancedResult.examData.stream.toUpperCase() : 'N/A'
      });
    }

    details.push(
      { label: 'Gender:', value: typeof enhancedResult.gender === 'string' ? enhancedResult.gender : 'N/A' },
      { label: 'Examination:', value: typeof enhancedResult.examName === 'string' ? enhancedResult.examName : 'N/A' }
    );

    details.forEach((item) => {
      if (item.value === 'N/A' && item.label !== 'Class:' && item.label !== 'Stream:') {
        console.warn(`Invalid value for ${item.label} using fallback 'N/A'`);
      }
    });

    let currentX = margin;
    let currentY = yPos;
    const columns = 2;
    const columnWidth = (pageWidth - margin * 2) / columns;

    details.forEach((item, index) => {
      doc.setFontSize(detailsFontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(70, 70, 70);
      doc.text(item.label, currentX, currentY);

      doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(item.value, currentX + labelWidth, currentY);

      if ((index + 1) % columns === 0) {
        currentX = margin;
        currentY += detailSpacing;
      } else {
        currentX += columnWidth;
      }
    });

    yPos = currentY + detailSpacing;

    // Subject-wise Results Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 64, 124);
    doc.text('Subject-wise Results', 20, yPos);
    yPos += 6;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(20, yPos, 190, yPos);

    yPos += 8;
    doc.setFillColor(headerBgColor);
    doc.rect(20, yPos, 170, 8, 'F');
    doc.setTextColor(textColor);
    doc.setFontSize(11);
    doc.text('Subject', 22, yPos + 5);
    doc.text('Marks', 100, yPos + 5, { align: 'center' });
    doc.text('Grade', 160, yPos + 5, { align: 'center' });
    doc.setDrawColor(primaryColor);
    doc.line(20, yPos + 8, 190, yPos + 8);

    yPos += 8;
    enhancedResult.subjects.forEach(({ subject, mark, grade }, index) => {
      yPos += 8;
      doc.setFillColor(index % 2 === 0 ? rowBgColor : '#FFFFFF');
      doc.rect(20, yPos - 5, 170, 8, 'F');
      doc.setTextColor(textColor);
      doc.setFont('helvetica', 'normal');
      doc.text(subject.toUpperCase(), 22, yPos);
      doc.text(mark === "AB" ? "AB" : `${mark}/5`, 100, yPos, { align: 'center' });
      doc.setTextColor(grade === 'A+' || grade === 'A' ? '#16A34A' : grade === 'B' ? '#CA8A04' : '#EF4444');
      doc.text(grade, 160, yPos, { align: 'center' });
    });

    doc.setDrawColor(primaryColor);
    doc.line(20, yPos + 3, 190, yPos + 3);

    // Result Summary
    yPos += 13;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 64, 124);
    doc.text('Result Summary', 20, yPos);
    yPos += 6;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(20, yPos, 190, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const summaryItems = [
      { label: 'Total Marks:', value: `${enhancedResult.total}/${enhancedResult.subjects.length * 5}` },
      { label: 'Percentage:', value: `${enhancedResult.percentage}%` },
      { label: 'Overall Grade:', value: enhancedResult.grade, color: enhancedResult.grade === 'A+' || enhancedResult.grade === 'A' ? '#16A34A' : enhancedResult.grade === 'B' ? '#CA8A04' : '#EF4444' },
      { label: 'Status:', value: enhancedResult.status, color: enhancedResult.status === 'Pass' ? '#16A34A' : '#EF4444' },
      { label: 'Result:', value: enhancedResult.resultStatus }
    ];

    summaryItems.forEach((item) => {
      doc.setTextColor(70, 70, 70);
      doc.setFont('helvetica', 'bold');
      doc.text(item.label, 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(item.color || textColor);
      doc.text(item.value, 190, yPos, { align: 'right' });
      yPos += 8;
    });

    // Footer
    doc.setDrawColor(accentColor);
    doc.line(20, 270, 190, 270);
    doc.setFontSize(10);
    doc.setTextColor(textColor);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 190, 275,{ align: 'right' }); 

    // Document Border
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(0.3);
    doc.rect(5, 5, 200, 287);

    // Sanitize student name for file name
    const safeStudentName = (enhancedResult.studentName || 'student').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`${safeStudentName}_result_certificate.pdf`);
  };

  return (
    <button
      onClick={downloadPDF}
      disabled={!enhancedResult}
      className={`w-full sm:w-1/2 h-10 sm:h-12 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base ${!enhancedResult ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Download className="w-4 h-4 sm:w-5 sm:h-5" />
      Print Result
    </button>
  );
};

export default PDFDownloadButton;