import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, GraduationCap, Calendar, User, Hash } from 'lucide-react';
import { Mycontext } from '../Context/Context';
import PDFDownloadButton from './Pdf';

const Result = () => {
  const navigate = useNavigate();
  const { result } = useContext(Mycontext);

  useEffect(() => {
    if (!result) {
      navigate('/');
    }
  }, [result, navigate]);

  // Updated grade calculation for marks out of 5
  const getGrade = (score) => {
    if (score >= 4.5) return 'A+';
    if (score >= 4.0) return 'A';
    if (score >= 3.5) return 'B+';
    if (score >= 3.0) return 'B';
    if (score >= 2.5) return 'C+';
    if (score >= 2.0) return 'C';
    if (score >= 1.5) return 'D';
    return 'F';
  };

  // Updated percentage calculation for marks out of 5
  const calculatePercentage = (marks) => {
    const totalMarks = marks.reduce((sum, subject) => sum + subject.score, 0);
    const maxMarks = marks.length * 5;
    return ((totalMarks / maxMarks) * 100).toFixed(2);
  };

  // Check if student has failed in any subject (grade F or D)
  const hasFailedSubject = (marks) => {
    return marks.some(subject => subject.score < 2.0); // Fail if any subject score is below 2.0
  };

  const enhancedResult = result
    ? {
        ...result,
        gender: result.studentData?.gender || 'Unknown',
        school: result.studentData?.school || 'RAZA-UL ULOOM ISLAMIA HIGHER SECONDARY SCHOOL',
        subjects: result.marks.map(subject => ({
          subject: subject.name,
          mark: subject.score,
          grade: getGrade(subject.score),
        })),
        percentage: calculatePercentage(result.marks),
        total: result.marks.reduce((sum, subject) => sum + subject.score, 0),
        maxTotal: result.marks.length * 5,
        grade: getGrade(result.marks.reduce((sum, subject) => sum + subject.score, 0) / result.marks.length),
        status: hasFailedSubject(result.marks) ? 'Fail' : 'Pass',
        resultStatus: hasFailedSubject(result.marks) ? 'NOT ELIGIBLE FOR HIGHER STUDIES' : 'ELIGIBLE FOR HIGHER STUDIES',
      }
    : null;

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+': return 'text-emerald-600 bg-emerald-50';
      case 'A': return 'text-green-600 bg-green-50';
      case 'B+': return 'text-blue-600 bg-blue-50';
      case 'B': return 'text-indigo-600 bg-indigo-50';
      case 'C+': return 'text-yellow-600 bg-yellow-50';
      case 'C': return 'text-orange-600 bg-orange-50';
      case 'D': return 'text-red-500 bg-red-50';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const getStatusColor = (status) => {
    return status === 'Pass' 
      ? 'text-emerald-700 bg-emerald-100 border-emerald-200' 
      : 'text-red-700 bg-red-100 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {enhancedResult && (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-100">
          {/* Header with School Branding */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* School Logo Placeholder */}
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">{enhancedResult.school}</h1>
                  <p className="text-blue-100 text-sm">Excellence in Education</p>
                </div>
              </div>
              <div className="text-right text-white">
                <p className="text-sm text-blue-100">Academic Session</p>
                <p className="font-semibold">2024-2025</p>
              </div>
            </div>
          </div>

          {/* Examination Details */}
          <div className="bg-gray-50 px-8 py-4 border-b">
            <div className="flex items-center justify-center space-x-6 text-gray-700">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-lg">{enhancedResult.examName}</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Result Declaration</span>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Student Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Student Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Registration No:</span>
                    <span className="font-bold text-gray-800">{enhancedResult.regNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Name:</span>
                    <span className="font-bold text-gray-800">{enhancedResult.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Gender:</span>
                    <span className="font-bold text-gray-800">{enhancedResult.gender}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <Hash className="w-5 h-5 mr-2 text-purple-600" />
                  Result Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Total Marks:</span>
                    <span className="font-bold text-gray-800">{enhancedResult.total}/{enhancedResult.maxTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Percentage:</span>
                    <span className="font-bold text-gray-800">{enhancedResult.percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Overall Grade:</span>
                    <span className={`px-3 py-1 rounded-full font-bold text-sm ${getGradeColor(enhancedResult.grade)}`}>
                      {enhancedResult.grade}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject-wise Results */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Subject-wise Performance</h3>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-4 bg-gradient-to-r from-gray-800 to-gray-700 text-white font-semibold">
                  <div className="p-4 border-r border-gray-600">Subject</div>
                  <div className="p-4 border-r border-gray-600 text-center">Marks Obtained</div>
                  <div className="p-4 border-r border-gray-600 text-center">Maximum Marks</div>
                  <div className="p-4 text-center">Grade</div>
                </div>
                {enhancedResult.subjects.map(({ subject, mark, grade }, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-4 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors duration-200`}
                  >
                    <div className="p-4 border-r border-gray-200 font-medium text-gray-800">
                      {subject.toUpperCase()}
                    </div>
                    <div className="p-4 border-r border-gray-200 text-center font-semibold text-gray-700">
                      {mark}
                    </div>
                    <div className="p-4 border-r border-gray-200 text-center text-gray-600">
                      5
                    </div>
                    <div className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full font-bold text-sm ${getGradeColor(grade)}`}>
                        {grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Result Status */}
            <div className={`rounded-xl p-6 border-2 ${getStatusColor(enhancedResult.status)}`}>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Award className="w-8 h-8 mr-3" />
                  <span className="text-2xl font-bold">
                    RESULT: {enhancedResult.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {enhancedResult.resultStatus}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <PDFDownloadButton enhancedResult={enhancedResult} />
              <button
                onClick={() => {
                  sessionStorage.removeItem("result");
                  navigate('/');
                }}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-3"
              >
                <ArrowLeft className="w-5 h-5" />
                Check Another Result
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 rounded-b-2xl border-t">
            <div className="text-center text-gray-600 text-sm">
              <p>This is an official result document generated by {enhancedResult.school}</p>
              <p className="text-xs mt-1">For verification, please contact the school administration</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Result;