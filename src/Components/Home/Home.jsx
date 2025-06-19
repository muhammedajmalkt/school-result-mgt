import { useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { collection, getDocs, query, where } from "firebase/firestore"
import { firestore } from "../../Firebase/config"
import { Mycontext } from "../Context/Context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { MapPin, Phone, GraduationCap, BookOpen, Award, Users } from "lucide-react"

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
      const maxMarks = marks.length * 5; 
      const total = marks.reduce((sum, { score }) => score > 0 ? sum + score : sum, 0);

      const percentage = maxMarks > 0 ? (total / maxMarks) * 100 : 0;
    
      const resultData = {
        studentName: studentData.name || studentData.studentName || 'Unknown',
        regNo: regNo,
        examName: exams.find(e => e.id === exam)?.name || examMarksData.examName || exam,
        marks: marks, 
        total: total,
        percentage: Number.parseFloat(percentage.toFixed(2)),
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
      <div className="flex justify-center items-center min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="text-center flex gap-3 ">
          <div className="animate-spin rounded-full h-6 w-6 border-t-3 border-b-3 border-white mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Loading Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <>

      <div className="min-h-screen flex flex-col relative overflow-y-scroll  scrollbar-hidden ">
        {/* <div className="absolute inset-0  bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100"> */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
          </div>
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-40 left-20 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 bg-cyan-400/20 rounded-full blur-xl animate-pulse delay-3000"></div>
        </div>

        {/* Header */}
        <div className="relative lg:top-3 ">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12  items-center justify-center ">
                  <img
                    src="/Yaseen Logo.png"
                    alt="School Logo"
                    className="w-10 h-10 ml-2 object-contain"
                  />            
                      </div>
                <div>
                  <h1 className="text-xl font-bold text-white/90">RAZA-UL ULOOM ISLAMIA</h1>
                  <p className="text-blue-200 text-sm">Higher Secondary School</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">Excellence in Education</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-grow flex items-center justify-center px-4 py-8 ">
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center ">
              
              {/* Left Side - Information */}
              <div className="text-center lg:text-left lg:flex flex-col hidden">
                <div className="mb-8">
                  <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                    Term Examination
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                      Result Portal
                    </span>
                  </h2>
                  <p className="text-blue-200 text-lg mb-6">
                    Access your academic achievements instantly and securely
                  </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">5000+</p>
                        <p className="text-blue-200 text-sm">Students</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <GraduationCap   className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">98%</p>
                        <p className="text-blue-200 text-sm">Success Rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Check Your Results
                      </h3>
                      <p className="text-blue-200 text-sm">Enter your details to view examination results</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="exam" className="block text-sm font-medium text-white mb-2">
                          Select Examination
                        </label>
                        <Select
                          onValueChange={(value) => setExam(value)}
                          value={exam}
                          disabled={loadingExams || exams.length === 0}
                        >
                          <SelectTrigger className="w-full h-12 bgs-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20 transition-all ">
                            <SelectValue 
                              placeholder={ loadingExams ? "Loading examinations..." : exams.length === 0 ? "No examinations available" : "Select an examination" } 
                            />
                          </SelectTrigger>
                          <SelectContent className="">
                            {exams.map((examItem) => (
                              <SelectItem 
                                key={examItem.id} 
                                value={examItem.id}
                                className=" hover:bg-slate-700  text-black "
                              >
                                {examItem.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label htmlFor="regNo" className="block text-sm font-medium text-white mb-2">
                          Registration Number
                        </label>
                        <input
                          id="regNo"
                          type="text"
                          value={regNo}
                          onChange={(e) => setRegNo(e.target.value)}
                          placeholder="Enter your registration number"
                          className="w-full h-10 px-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 backdrop-blur-md focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-all"
                        />
                      </div>

                      {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                          <p className="text-red-200 text-sm">{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || loadingExams || exams.length === 0}
                        className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.01] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            View Results
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

            <footer className="text-center py-8 bg-gradient-to-br from-gray-900 to-blue-900 text-white/90 px-4">
       <p className="text-sm font-bold">RAZA-UL ULOOM ISLAMIA HIGHER SECONDARY SCHOOL</p>
         <div className="flex lg:items-center justify-center lg:text-sm mt-1 text-xs items-start">
           <MapPin className="w-4 h-4 mr-1" />
           <span>Parade Ground, Old City, Poonch, Jammu and Kashmir 185101</span>
         </div>
         <div className="flex items-center justify-center text-sm mt-1">
           <Phone className="w-4 h-4 mr-1" />
           <span>Phone:+91 072980 10127</span>
         </div>
         <p className="text-sm mt-2 text-gray-400">© 2025 RAZA-UL ULOOM ISLAMIA HIGHER SECONDARY SCHOOL. All rights reserved.</p>
       </footer>
    </>
  );
};

export default Home;
