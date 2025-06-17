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

    doc.setFont('helvetica', 'bold');

    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 45, 'F'); 

    doc.setTextColor('#FFFFFF');
    doc.setFontSize(16);
    doc.text('RAZA UL ULOOM ISLAMIA SCHOOL, POONCH', 105, 15, { align: 'center' }); 
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('123 Academic Lane, Springfield, USA', 105, 22, { align: 'center' }); 
    doc.text('Email: contact@springfieldschool.org', 105, 28, { align: 'center' }); 
    doc.setFontSize(12);
    doc.text('[School Logo]', 10, 15); 
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Examination Result Certificate', 105, 38, { align: 'center' });


    // Student Information
    doc.setTextColor(textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Details', 20, 52);
    doc.setLineWidth(0.3);
    doc.setDrawColor(accentColor);
    doc.line(20, 54, 190, 54); 

    doc.setFont('helvetica', 'normal');
    doc.text(`Registration No: ${enhancedResult.regNo}`, 20, 62);
    doc.text(`Name: ${enhancedResult.studentName.toUpperCase()}`, 20, 70);
    doc.text(`Sex: ${enhancedResult.gender}`, 20, 78);
    doc.text(`School: ${enhancedResult.school}`, 20, 86);
    doc.text(`Examination: ${enhancedResult.examName}`, 20, 94);
    doc.text(`Date: ${enhancedResult.examData?.date ? new Date(enhancedResult.examData.date).toLocaleDateString() : 'N/A'}`, 20, 102);

    // Subject-wise Results Table
    doc.setFont('helvetica', 'bold');
    doc.text('Subject-wise Results', 20, 112);
    doc.line(20, 114, 190, 114); 

    // Table Header
    doc.setFillColor(headerBgColor);
    doc.rect(20, 117, 170, 8, 'F');
    doc.setTextColor(textColor);
    doc.setFontSize(11);
    doc.text('Subject', 22, 122);
    doc.text('Marks', 100, 122, { align: 'center' });
    doc.text('Grade', 160, 122, { align: 'center' });
    doc.setDrawColor(primaryColor);
    doc.line(20, 125, 190, 125); 

    // Table Rows
    let y = 125;
    enhancedResult.subjects.forEach(({ subject, mark, grade }, index) => {
      y += 8;
      doc.setFillColor(index % 2 === 0 ? rowBgColor : '#FFFFFF');
      doc.rect(20, y - 5, 170, 8, 'F');
      doc.setTextColor(textColor);
      doc.setFont('helvetica', 'normal');
      doc.text(subject.toUpperCase(), 22, y);
      doc.text(`${mark}/100`, 100, y, { align: 'center' });
      doc.setTextColor(grade === 'A+' || grade === 'A' ? '#16A34A' : grade === 'B' ? '#CA8A04' : '#EF4444');
      doc.text(grade, 160, y, { align: 'center' });
    });

    // Table Bottom Line
    doc.setDrawColor(primaryColor);
    doc.line(20, y + 3, 190, y + 3);

    // Result Summary
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text('Result Summary', 20, y + 13);
    doc.line(20, y + 15, 190, y + 15); 

    doc.setFont('helvetica', 'normal');
    y += 20;
    doc.text(`Total Marks: ${enhancedResult.total}/${enhancedResult.subjects.length * 100}`, 20, y);
    doc.text(`Percentage: ${enhancedResult.percentage}%`, 20, y + 8);
    doc.setTextColor(enhancedResult.grade === 'A+' || enhancedResult.grade === 'A' ? '#16A34A' : enhancedResult.grade === 'B' ? '#CA8A04' : '#EF4444');
    doc.text(`Overall Grade: ${enhancedResult.grade}`, 20, y + 16);
    doc.setTextColor(enhancedResult.status === 'Pass' ? '#16A34A' : '#EF4444');
    doc.text(`Status: ${enhancedResult.status}`, 20, y + 24);
    doc.setTextColor(textColor);
    doc.text(`Result: ${enhancedResult.resultStatus}`, 20, y + 32);

    // Footer
    doc.setDrawColor(accentColor);
    doc.line(20, 270, 190, 270);
    doc.setFontSize(10);
    doc.setTextColor(textColor);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 275);
    doc.text('Page 1 of 1', 190, 275, { align: 'right' });

    // Document Border
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(0.3);
    doc.rect(5, 5, 200, 287); 

    doc.save('result_certificate.pdf');
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