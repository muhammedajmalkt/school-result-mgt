// import { useContext, useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { collection, getDocs, query, where } from 'firebase/firestore';
// import { firestore } from '../../Firebase/config'; 
// import { Mycontext } from '../Context/Context'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select"

// const Home = () => {
//   const { result, setResult } = useContext(Mycontext);
//   const [exam, setExam] = useState('');
//   const [regNo, setRegNo] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [exams, setExams] = useState([]);
//   const [loadingExams, setLoadingExams] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchExams = async () => {
//       try {
//         setLoadingExams(true);
//         const examsSnapshot = await getDocs(collection(firestore, 'exams'));
//         const examsList = examsSnapshot.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data()
//         }));
//         setExams(examsList);
//       } catch (error) {
//         console.error('Error fetching exams:', error);
//         setError('Failed to load exams. Please try again.');
//       } finally {
//         setLoadingExams(false);
//       }
//     };

//     fetchExams();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
    
//     if (!exam || !regNo) {
//       setError('Please select an exam and enter a registration number.');
//       setResult(null);
//       return;
//     }

//     setLoading(true);

//     try {
//       const studentsSnapshot = await getDocs(collection(firestore, 'students'));
//       const student = studentsSnapshot.docs.find(doc => 
//         doc.data().regNo === regNo || doc.data().registrationNumber === regNo
//       );

//       if (!student) {
//         setError('Student not found with this registration number.');
//         setLoading(false);
//         return;
//       }

//       const studentData = student.data();

//       const examMarksQuery = query(
//         collection(firestore, 'examMarks'),
//         where('regNo', '==', regNo),
//         where('examId', '==', exam)
//       );
      
//       const examMarksSnapshot = await getDocs(examMarksQuery);
      
//       if (examMarksSnapshot.empty) {
//         setError('No results found for this student and exam combination.');
//         setLoading(false);
//         return;
//       }

//       const examMarksData = examMarksSnapshot.docs[0].data();
//       const marks = examMarksData.subjects || [];
//       const total = marks.reduce((sum, subject) => sum + (subject.score || 0), 0);
//       const maxMarks = marks.length * 100; 
//       const percentage = maxMarks > 0 ? (total / maxMarks) * 100 : 0;

//       const rr = {studentName: studentData.name || studentData.studentName || 'Unknown',
//         regNo: regNo,
//         examName: exams.find(e => e.id === exam)?.name || exam,
//         marks: marks, 
//         total: total,
//         percentage: parseFloat(percentage.toFixed(2)),
//         studentData: studentData,
//         examData: examMarksData
//       }
//       sessionStorage.setItem("result",JSON.stringify(rr))
      
//       setResult({
//         studentName: studentData.name || studentData.studentName || 'Unknown',
//         regNo: regNo,
//         examName: exams.find(e => e.id === exam)?.name || exam,
//         marks: marks, 
//         total: total,
//         percentage: parseFloat(percentage.toFixed(2)),
//         studentData: studentData,
//         examData: examMarksData
//       });

//       navigate("/result");

//     } catch (error) {
//       console.error('Error fetching student data:', error);
//       setError('Failed to fetch student data. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };
//   if (loadingExams) {
//     return (
//       <div className="flex justify-center items-center min-h-screen w-full">
//         <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-blue-500 bg-transparent"></div> 
//       </div>
//     );
//   }
//   return (
//     <div className="min-h-screen flex flex-col lg:flex-row lg:p-16 p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
//       <div className="w-full lg:w-1/2 h-72 lg:h-auto relative ">
//         <img
//           // src="/result.png"
//           loading='lazy'
//           src="/students.png"
//           alt="Students"
//           className="absolute inset-0 w-full h-full object-cover  p-16 "
//         />
//       </div>
//       <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
//         <div className="rounded-2xl shadow-2xl p-8 w-full max-w-md lg:max-w-lg transition-all duration-300">
//           <div className="text-center mb-12">
//             <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
//               Student Result Portal
//             </h1>
//             <p className="text-gray-600 text-xs">Access your academic results instantly</p>
//           </div>
      
//           <div className="space-y-4">
//             <div >
        
//               <div className="relative">
//                 <label htmlFor="exam" className="block text-sm font-medium text-gray-700 mb-1">
//                   Select Exam
//                 </label>
//                 <Select
//                   onValueChange={(value) => setExam(value)}
//                   value={exam}
//                   disabled={loadingExams}
//                 >
//                   <SelectTrigger className="w-full h-10  border-none shadow-sm ">
//                     <SelectValue placeholder={loadingExams ? "Loading exams..." : "Select an exam"} />
//                   </SelectTrigger>
//                   <SelectContent className="border-none shadow-md bg-blue-50 ">
//                     {exams.map((examItem) => (
//                       <SelectItem className="bg-blue-50  " key={examItem.id} value={examItem.id}>
//                         {examItem.name || examItem.examName || examItem.id}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
              

//             </div>
//             <div>
//               <label htmlFor="regNo" className="block text-sm font-medium text-gray-700">
//                 Registration Number
//               </label>
//               <input
//                 id="regNo"
//                 type="text"
//                 value={regNo}
//                 onChange={(e) => setRegNo(e.target.value)}
//                 placeholder="Enter registration number"
//                 className="mt-1 block w-full h-10 p-2 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
//               />
//             </div>
//             {error && <p className="text-red-500 text-sm">{error}</p>}
//             <button
//               onClick={handleSubmit}
//               disabled={loading || loadingExams}
//               className="w-full h-10 bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
//             >
//               {loading ? 'Loading...' : 'View Result'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Home;



import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../Firebase/config'; 
import { Mycontext } from '../Context/Context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../ui/select";

const Home = () => {
  const { result, setResult } = useContext(Mycontext);
  const [exam, setExam] = useState('');
  const [regNo, setRegNo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoadingExams(true);
        const examMarksSnapshot = await getDocs(collection(firestore, 'examMarks'));
        // Extract unique exams by examName and retain examId
        const examsMap = new Map();
        examMarksSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.examName && data.examId) {
            examsMap.set(data.examName.toLowerCase(), {
              id: data.examId,
              name: data.examName
            });
          }
        });
        const uniqueExams = Array.from(examsMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setExams(uniqueExams);
      } catch (error) {
        console.error('Error fetching exams:', error);
        setError('Failed to load exams. Please try again.');
      } finally {
        setLoadingExams(false);
      }
    };

    fetchExams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!exam || !regNo) {
      setError('Please select an exam and enter a registration number.');
      setResult(null);
      return;
    }

    setLoading(true);

    try {
      const studentsSnapshot = await getDocs(collection(firestore, 'students'));
      const student = studentsSnapshot.docs.find(doc => 
        doc.data().regNo === regNo || doc.data().registrationNumber === regNo
      );

      if (!student) {
        setError('Student not found with this registration number.');
        setLoading(false);
        return;
      }

      const studentData = student.data();

      const examMarksQuery = query(
        collection(firestore, 'examMarks'),
        where('regNo', '==', regNo),
        where('examId', '==', exam)
      );
      
      const examMarksSnapshot = await getDocs(examMarksQuery);
      
      if (examMarksSnapshot.empty) {
        setError('No results found for this student and exam combination.');
        setLoading(false);
        return;
      }

      const examMarksData = examMarksSnapshot.docs[0].data();
      const marks = examMarksData.subjects || [];
      // Adjust maxMarks based on score range (0-5 as per ExamEntry)
      const maxMarks = marks.length * 5; 
      const total = marks.reduce((sum, subject) => sum + (subject.score || 0), 0);
      const percentage = maxMarks > 0 ? (total / maxMarks) * 100 : 0;

      const resultData = {
        studentName: studentData.name || studentData.studentName || 'Unknown',
        regNo: regNo,
        examName: exams.find(e => e.id === exam)?.name || examMarksData.examName || exam,
        marks: marks, 
        total: total,
        percentage: parseFloat(percentage.toFixed(2)),
        studentData: studentData,
        examData: examMarksData
      };

      sessionStorage.setItem("result", JSON.stringify(resultData));
      setResult(resultData);
      navigate("/result");

    } catch (error) {
      console.error('Error fetching student data:', error);
      setError('Failed to fetch student data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingExams) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full">
        <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-blue-500 bg-transparent"></div> 
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row lg:p-16 p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full lg:w-1/2 h-72 lg:h-auto relative">
        <img
          src="/students.png"
          loading='lazy'
          alt="Students"
          className="absolute inset-0 w-full h-full object-cover p-16"
        />
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="rounded-2xl shadow-2xl p-8 w-full max-w-md lg:max-w-lg transition-all duration-300">
          <div className="text-center mb-12">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Student Result Portal
            </h1>
            <p className="text-gray-600 text-xs">Access your academic results instantly</p>
          </div>
      
          <div className="space-y-4">
            <div>
              <div className="relative">
                <label htmlFor="exam" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Exam
                </label>
                <Select
                  onValueChange={(value) => setExam(value)}
                  value={exam}
                  disabled={loadingExams || exams.length === 0}
                >
                  <SelectTrigger className="w-full h-10 border-none shadow-sm">
                    <SelectValue placeholder={loadingExams ? "Loading exams..." : exams.length === 0 ? "No exams available" : "Select an exam"} />
                  </SelectTrigger>
                  <SelectContent className="border-none shadow-md bg-blue-50">
                    {exams.map((examItem) => (
                      <SelectItem className="bg-blue-50" key={examItem.id} value={examItem.id}>
                        {examItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label htmlFor="regNo" className="block text-sm font-medium text-gray-700">
                Registration Number
              </label>
              <input
                id="regNo"
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="Enter registration number"
                className="mt-1 block w-full h-10 p-2 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading || loadingExams || exams.length === 0}
              className="w-full h-10 bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Loading...' : 'View Result'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
