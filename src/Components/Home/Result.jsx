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
    if (score < 1.5) return 'F';
    return 'AB';
  };

  // Updated percentage calculation for marks out of 5
  const calculatePercentage = (marks) => {
    const totalMarks = marks.reduce((sum, {score}) => score > 0 ? sum + score :sum , 0);
    const maxMarks = marks.length * 5;
    return ((totalMarks / maxMarks) * 100).toFixed(1);
  };

  // Check if student has failed in any subject (grade F or D)
  const hasFailedSubject = (marks) => {    
    return marks.score == "AB" || marks.score < 1.5 ? false : true
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
        total: result.marks.reduce((sum, subject) => subject.score >0 ? sum + subject.score : sum, 0),
        maxTotal: result.marks.length * 5,
        grade: result.marks.some(subject => subject.score === "AB" || (typeof subject.score === "number" && subject.score < 1.5))
          ? "F" : getGrade( result.marks.reduce( (sum, subject) => typeof subject.score === "number" && subject.score > 0 ? sum + subject.score : sum, 0 ) / result.marks.length ),
        status: hasFailedSubject(result.marks) ? 'Fail' : 'Pass',
        resultStatus: hasFailedSubject(result.marks) ? 'NOT ELIGIBLE FOR HIGHER STUDIES' : 'ELIGIBLE FOR HIGHER STUDIES',
      } : null;
// console.log(enhancedResult);

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
   <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-2">
  {enhancedResult && (
    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl border border-gray-100">
      {/* Header with School Branding */}
      <div className="bg-gradient-to-r from-eblue-600 to-purplee-600 bg-teal-600 rounded-t-xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold">{enhancedResult.school}</h1>
            </div>
          </div>
          <div className="text-right text-white text-sm">
            <p>2024-2025</p>
          </div>
        </div>
      </div>

      {/* Examination Details */}
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="flex items-center justify-center space-x-4 text-gray-700">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-base">{enhancedResult.examName}</span>
          </div>
          <div className="w-px h-5 bg-gray-300"></div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3 text-gray-500" />
            <span className="text-xs">Result Declaration</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Student Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center">
              <User className="w-4 h-4 mr-1 text-blue-600" />
              Student Information
            </h3>
            <div className="space-y-2 text-sm">
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

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center">
              <Hash className="w-4 h-4 mr-1 text-purple-600" />
              Result Summary
            </h3>
            <div className="space-y-2 text-sm">
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
                <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${getGradeColor(enhancedResult.grade)}`}>
                  {enhancedResult.grade}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subject-wise Results */}
        <div>
          <h3 className="font-bold text-gray-800 mb-2 text-base">Subject-wise Performance</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="grid grid-cols-4 bg-gradient-to-r from-gray-800 to-gray-700 text-white font-semibold text-sm">
              <div className="p-3 border-r border-gray-600">Subject</div>
              <div className="p-3 border-r border-gray-600 text-center">Marks Obtained</div>
              <div className="p-3 border-r border-gray-600 text-center">Maximum Marks</div>
              <div className="p-3 text-center">Grade</div>
            </div>
            {enhancedResult.subjects.map(({ subject, mark, grade }, index) => (
              <div
                key={index}
                className={`grid grid-cols-4 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors duration-200`}
              >
                <div className="p-3 border-r border-gray-200 font-medium text-gray-800 text-sm">
                  {subject.toUpperCase()}
                </div>
                <div className="p-3 border-r border-gray-200 text-center font-semibold text-gray-700 text-sm">
                  {mark}
                </div>
                <div className="p-3 border-r border-gray-200 text-center text-gray-600 text-sm">
                  5
                </div>
                <div className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${getGradeColor(grade)}`}>
                    {grade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Result Status */}
        <div className={`rounded-lg p-4 border-2 ${getStatusColor(enhancedResult.status)}`}>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Award className="w-6 h-6 mr-2" />
              <span className="text-xl font-bold">
                RESULT: {enhancedResult.status.toUpperCase()}
              </span>
            </div>
            <p className="text-base font-semibold">
              {enhancedResult.resultStatus}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-5 ">
          <PDFDownloadButton enhancedResult={enhancedResult} />
          <button
            onClick={() => {
              sessionStorage.removeItem("result");
              navigate('/');
            }}
            className="w-full sm:w-1/2 sm:h-12 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-md flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Check Another Result
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-5 rounded-b-xl border-t text-center text-gray-600 text-xs">
        <p>Official result document by {enhancedResult.school}</p>
      </div>
    </div>
  )}
</div>
  );
};

export default Result;