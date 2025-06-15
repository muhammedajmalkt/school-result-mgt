// import { useState, useEffect } from 'react';
// import { Check, Loader2, Edit, Trash2, X } from 'lucide-react';
// import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
// import { firestore } from '../../Firebase/config';
// import { toast } from 'sonner';
// import Swal from 'sweetalert2';

// const AddExams = () => {
//   const [examName, setExamName] = useState('');
//   const [selectedClass, setSelectedClass] = useState('');
//   const [stream, setStream] = useState('');
//   const [assignedSubjects, setAssignedSubjects] = useState([]);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [exams, setExams] = useState([]);
//   const [editingId, setEditingId] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [fetchingSubjects, setFetchingSubjects] = useState(false);

//   // Fetch exams and initialize component
//   useEffect(() => {
//     const fetchExams = async () => {
//       try {
//         const querySnapshot = await getDocs(collection(firestore, 'exams'));
//         const examsData = querySnapshot.docs.map(doc => {
//           const data = doc.data();
          
//           let createdAt = new Date();
//           if (data.createdAt) {
//             if (typeof data.createdAt.toDate === 'function') {
//               createdAt = data.createdAt.toDate();
//             } else if (typeof data.createdAt === 'string') {
//               createdAt = new Date(data.createdAt);
//             } else if (data.createdAt.seconds) {
//               createdAt = new Date(data.createdAt.seconds * 1000);
//             }
//           }

//           let updatedAt = null;
//           if (data.updatedAt) {
//             if (typeof data.updatedAt.toDate === 'function') {
//               updatedAt = data.updatedAt.toDate();
//             } else if (typeof data.updatedAt === 'string') {
//               updatedAt = new Date(data.updatedAt);
//             } else if (data.updatedAt.seconds) {
//               updatedAt = new Date(data.updatedAt.seconds * 1000);
//             }
//           }

//           return {
//             id: doc.id,
//             ...data,
//             createdAt,
//             updatedAt
//           };
//         });
        
//         examsData.sort((a, b) => b.createdAt - a.createdAt);
//         setExams(examsData);
//         setLoading(false);
//       } catch (err) {
//         console.error('Error fetching exams:', err);
//         toast.error('Failed to load exams');
//         setLoading(true);
//       }
//     };

//     fetchExams();
//   }, []);

//   // Fetch assigned subjects for selected class/stream
//   useEffect(() => {
//     const fetchSubjectsForClass = async () => {
//       if (!selectedClass) {
//         setAssignedSubjects([]);
//         return;
//       }

//       setFetchingSubjects(true);
//       try {
//         const classQuery = query(
//           collection(firestore, 'classSubjects'),
//           where('className', '==', selectedClass),
//           where('isStream', '==', selectedClass === '+1' || selectedClass === '+2'),
//           ...(selectedClass === '+1' || selectedClass === '+2' && stream ? [where('stream', '==', stream.toLowerCase())] : [])
//         );
//         const classSnapshot = await getDocs(classQuery);
//         if (!classSnapshot.empty) {
//           const subjects = classSnapshot.docs[0].data().subjects || [];
//           setAssignedSubjects(subjects.sort());
//         } else {
//           setAssignedSubjects([]);
//         }
//       } catch (error) {
//         console.error('Error fetching subjects:', error);
//         toast.error('Failed to fetch subjects');
//         setError('Failed to fetch subjects');
//       } finally {
//         setFetchingSubjects(false);
//       }
//     };

//     fetchSubjectsForClass();
//   }, [selectedClass, stream]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     if (!examName.trim()) {
//       setError('Exam name is required.');
//       setLoading(false);
//       return;
//     }

//     if (!selectedClass) {
//       setError('Please select a class.');
//       setLoading(false);
//       return;
//     }

//     if ((selectedClass === '+1' || selectedClass === '+2') && !stream) {
//       setError('Please select a stream.');
//       setLoading(false);
//       return;
//     }

//     if (assignedSubjects.length === 0) {
//       setError('No subjects assigned to this class/stream. Please assign subjects first.');
//       setLoading(false);
//       return;
//     }

//     try {
//       const examData = {
//         name: examName,
//         className: selectedClass,
//         isStream: selectedClass === '+1' || selectedClass === '+2',
//         ...(selectedClass === '+1' || selectedClass === '+2' ? { stream: stream.toLowerCase() } : {})
//       };

//       if (editingId) {
//         await updateDoc(doc(firestore, 'exams', editingId), {
//           ...examData,
//           updatedAt: new Date().toISOString()
//         });

//         setExams(exams.map(exam =>
//           exam.id === editingId ? {
//             ...exam,
//             ...examData,
//             updatedAt: new Date()
//           } : exam
//         ));

//         setSuccess('Exam updated successfully!');
//         toast.success('Exam updated successfully');
//       } else {
//         const examExists = exams.some(exam =>
//           exam.name.toLowerCase() === examName.toLowerCase() &&
//           exam.className === selectedClass &&
//           exam.isStream === (selectedClass === '+1' || selectedClass === '+2') &&
//           (exam.isStream ? exam.stream === stream.toLowerCase() : true)
//         );

//         if (examExists) {
//           setError('Exam with this name already exists for the selected class/stream.');
//           toast.error('Exam already exists');
//           setLoading(false);
//           return;
//         }

//         const docRef = await addDoc(collection(firestore, 'exams'), {
//           ...examData,
//           createdAt: new Date().toISOString()
//         });

//         setExams([{
//           id: docRef.id,
//           ...examData,
//           createdAt: new Date(),
//           updatedAt: null
//         }, ...exams]);

//         setSuccess('Exam added successfully!');
//         toast.success('Exam added successfully');
//       }

//       // Reset form
//       setExamName('');
//       setSelectedClass('');
//       setStream('');
//       setEditingId(null);
//       setError('');
//     } catch (err) {
//       console.error('Error saving exam:', err);
//       setError('Failed to save exam. Please try again.');
//       toast.error('Failed to save exam');
//     } finally {
//       setLoading(false);
//       setTimeout(() => setSuccess(''), 3000);
//     }
//   };

//   const handleEdit = (exam) => {
//     setEditingId(exam.id);
//     setExamName(exam.name);
//     setSelectedClass(exam.className);
//     setStream(exam.isStream ? exam.stream : '');
//     document.getElementById('exam-form')?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const handleCancelEdit = () => {
//     setEditingId(null);
//     setExamName('');
//     setSelectedClass('');
//     setStream('');
//     setError('');
//   };

//   const handleDelete = async (id) => {
//     const result = await Swal.fire({
//       title: 'Are you sure?',
//       text: 'Are you sure you want to delete this exam?',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'Yes, delete it!',
//       cancelButtonText: 'Cancel',
//     });

//     if (result.isConfirmed) {
//       try {
//         await deleteDoc(doc(firestore, 'exams', id));
//         setExams(exams.filter((exam) => exam.id !== id));
//         toast.success('Exam deleted successfully');
//       } catch (err) {
//         console.error('Error deleting exam:', err);
//         toast.error('Failed to delete exam');
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Add/Edit Exam Form */}
//       <div
//         id="exam-form"
//         className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-300 p-6"
//       >
//         <h2 className="text-xl font-semibold text-gray-800 mb-4">
//           {editingId ? 'Edit Exam' : 'Add Exam'}
//         </h2>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Exam Name</label>
//             <input
//               type="text"
//               value={examName}
//               onChange={(e) => setExamName(e.target.value)}
//               placeholder="Midterm Exam 2025"
//               className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Select Class</label>
//             <select
//               value={selectedClass}
//               onChange={(e) => {
//                 setSelectedClass(e.target.value);
//                 setStream('');
//                 setAssignedSubjects([]);
//               }}
//               className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
//             >
//               <option value="">Select a class</option>
//               <optgroup label="Primary (1-4)">
//                 {[1, 2, 3, 4].map(i => (
//                   <option key={i} value={i}>Class {i}</option>
//                 ))}
//               </optgroup>
//               <optgroup label="Middle (5-7)">
//                 {[5, 6, 7].map(i => (
//                   <option key={i} value={i}>Class {i}</option>
//                 ))}
//               </optgroup>
//               <optgroup label="Secondary (8-10)">
//                 {[8, 9, 10].map(i => (
//                   <option key={i} value={i}>Class {i}</option>
//                 ))}
//               </optgroup>
//               <optgroup label="Senior Secondary">
//                 <option value="+1">Class +1</option>
//                 <option value="+2">Class +2</option>
//               </optgroup>
//             </select>
//           </div>

//           {(selectedClass === '+1' || selectedClass === '+2') && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Select Stream</label>
//               <div className="mt-2 flex flex-wrap gap-4">
//                 {['Science', 'Commerce'].map(str => (
//                   <label key={str} className="inline-flex items-center">
//                     <input
//                       type="radio"
//                       name="stream"
//                       value={str.toLowerCase()}
//                       checked={stream === str.toLowerCase()}
//                       onChange={() => setStream(str.toLowerCase())}
//                       className="h-4 w-4 text-blue-600 focus:ring-blue-500"
//                     />
//                     <span className="ml-2 text-gray-700">{str}</span>
//                   </label>
//                 ))}
//               </div>
//             </div>
//           )}

//           {selectedClass && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Assigned Subjects</label>
//               {fetchingSubjects ? (
//                 <div className="flex items-center mt-2">
//                   <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
//                 </div>
//               ) : assignedSubjects.length > 0 ? (
//                 <ul className="mt-2 list-disc pl-6 space-y-1 text-gray-600">
//                   {assignedSubjects.sort().map(subject => (
//                     <li key={subject}>{subject}</li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="mt-2 text-red-500 text-sm">No subjects assigned to this class/stream.</p>
//               )}
//             </div>
//           )}

//           {error && <p className="text-red-500 text-sm">{error}</p>}
//           {success && <p className="text-green-500 text-sm">{success}</p>}
          
//           <div className="flex gap-3">
//             <button
//               type="submit"
//               disabled={loading}
//               className={`flex-1 h-10 flex items-center justify-center gap-2 bg-[#3D4577] hover:bg-[#3d59e7e5] text-white font-semibold rounded-lg transition-all duration-300 ${
//                 loading ? 'opacity-70 cursor-not-allowed':"" }`}
//             >
//               {loading ? (
//                 <Loader2 className="w-5 h-5 animate-spin" />
//               ) : editingId ? (
//                 <>
//                   <Check className="w-5 h-5 mr-1" /> Update Exam
//                 </>
//               ) : (
//                 'Add Exam'
//               )}
//             </button>
//             {editingId && (
//               <button
//                 type="button"
//                 onClick={() => 'handleCancelEdit'}
//                 className="flex justify-1 h-10  items-center gap-2 border border-gray-300 text-gray-700 font-semibold rounded-lg rounded-all duration-300"
//               >
//                 <X className="w-2 h-5 mr-2" /> Cancel
//               </button>
//             )}
//           </div>
//         </form>
//       </div>

//       {/* Exams List Table */}
//       <div className="bg-white rounded-md border-lg border-gray-200">
//         <div className="p-6">
//           <h2 className="text-xl font-semibold text-gray-800 mb-4">Exam List</h2>
          
//           {exams.length > 0 === 0 ? (
//             <p className="text-gray-500">No exams assigned yet.</p>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full border-collapse">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b">Exam Name</th>
//                     <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b">Class</th>
//                     <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b">Created At</th>
//                     <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {exams.map((exam) => (
//                     <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50">
//                       <td className="px-3 py-3 font-medium text-gray-900">{exam.name}</td>
//                       <td className="px-3 py-3 text-gray-600">
//                         {exam.isStream ? `Class ${exam.className} ${exam.stream.charAt(0).toUpperCase() + exam.stream.slice(1)}` : `Class ${exam.className}`}
//                       </td>
//                       <td className="px-3 py-3 text-gray-500 text-sm">
//                         {exam.createdAt.toLocaleDateString()}
//                         {exam.updatedAt && (
//                           <span className="text-xs text-gray-400 block">Updated: {exam.updatedAt.toLocaleDateString()}</span>
//                         )}
//                       </td>
//                       <td className="px-3 py-3">
//                         <div className="flex gap-2">
//                           <button
//                             onClick={() => handleEdit(exam)}
//                             className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
//                             title="Edit"
//                           >
//                             <Edit className="w-4 h-4" />
//                           </button>
//                           <button
//                             onClick={() => handleDelete(exam.id)}
//                             className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
//                             title="Delete"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddExams;


import { useState, useEffect } from 'react';
import { Check, Loader2, Edit, Trash2, X } from 'lucide-react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { firestore } from '../../Firebase/config';
import { toast } from 'sonner';
import { Fragment } from 'react';
import Swal from 'sweetalert2';

const AddExams = () => {
  const [examName, setExamName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exams, setExams] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch exams from Firestore
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'exams'));
        const examsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          let createdAt = new Date();
          if (data.createdAt) {
            if (typeof data.createdAt.toDate === 'function') {
              createdAt = data.createdAt.toDate();
            } else if (typeof data.createdAt === 'string') {
              createdAt = new Date(data.createdAt);
            } else if (data.createdAt.seconds) {
              createdAt = new Date(data.createdAt.seconds * 1000);
            }
          }

          let updatedAt = null;
          if (data.updatedAt) {
            if (typeof data.updatedAt.toDate === 'function') {
              updatedAt = data.updatedAt.toDate();
            } else if (typeof data.updatedAt === 'string') {
              updatedAt = new Date(data.updatedAt);
            } else if (data.updatedAt.seconds) {
              updatedAt = new Date(data.updatedAt.seconds * 1000);
            }
          }

          return {
            id: doc.id,
            ...data,
            createdAt,
            updatedAt
          };
        });
        
        setExams(examsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching exams:', err);
        toast.error('Failed to load exams');
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!examName.trim()) {
      setError('Exam name is required.');
      setLoading(false);
      return;
    }

    try {
      // Fetch all available classes/streams from classSubjects
      const classAssignmentsSnapshot = await getDocs(collection(firestore, 'classSubjects'));
      const classAssignments = classAssignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (classAssignments.length === 0) {
        setError('No classes or streams defined. Please add classes in Subject Management.');
        setLoading(false);
        return;
      }

      if (editingId) {
        // Get the original exam name
        const originalExam = exams.find(e => e.id === editingId);
        const originalExamName = originalExam.name;

        // Check if new exam name already exists (excluding the current exam)
        const examExists = exams.some(exam => 
          exam.name.toLowerCase() === examName.toLowerCase() && 
          exam.name.toLowerCase() !== originalExamName.toLowerCase()
        );
        if (examExists) {
          setError('Exam with this name already exists.');
          toast.error('Exam already exists');
          setLoading(false);
          return;
        }

        // Update existing exams with the same name
        const examsToUpdate = exams.filter(exam => exam.name.toLowerCase() === originalExamName.toLowerCase());
        for (const exam of examsToUpdate) {
          await updateDoc(doc(firestore, 'exams', exam.id), {
            name: examName,
            updatedAt: new Date().toISOString()
          });
        }

        // Add exam to new classes/streams not already assigned
        const existingClasses = examsToUpdate.map(exam => ({
          className: exam.className,
          isStream: exam.isStream,
          stream: exam.stream
        }));
        const newClasses = classAssignments.filter(assignment => 
          !existingClasses.some(cls => 
            cls.className === assignment.className &&
            cls.isStream === assignment.isStream &&
            (!cls.isStream || cls.stream === assignment.stream)
          )
        );

        const newExams = [];
        for (const assignment of newClasses) {
          const examData = {
            name: examName,
            className: assignment.className,
            isStream: assignment.isStream,
            ...(assignment.isStream ? { stream: assignment.stream } : {}),
            createdAt: new Date().toISOString()
          };
          const docRef = await addDoc(collection(firestore, 'exams'), examData);
          newExams.push({
            id: docRef.id,
            ...examData,
            createdAt: new Date(),
            updatedAt: null
          });
        }

        // Update local state
        setExams(prevExams => [
          ...newExams,
          ...prevExams.map(exam => 
            examsToUpdate.some(e => e.id === exam.id) ? { 
              ...exam, 
              name: examName,
              updatedAt: new Date()
            } : exam
          )
        ]);

        setSuccess('Exam updated successfully and added to new classes/streams!');
        toast.success('Exam updated successfully');
      } else {
        // Check if exam name already exists
        const examExists = exams.some(exam => exam.name.toLowerCase() === examName.toLowerCase());
        if (examExists) {
          setError('Exam with this name already exists.');
          toast.error('Exam already exists');
          setLoading(false);
          return;
        }

        // Add exam for each class/stream
        const newExams = [];
        for (const assignment of classAssignments) {
          const examData = {
            name: examName,
            className: assignment.className,
            isStream: assignment.isStream,
            ...(assignment.isStream ? { stream: assignment.stream } : {}),
            createdAt: new Date().toISOString()
          };

          const docRef = await addDoc(collection(firestore, 'exams'), examData);
          newExams.push({
            id: docRef.id,
            ...examData,
            createdAt: new Date(),
            updatedAt: null
          });
        }

        setExams([...newExams, ...exams]);
        setSuccess('Exam added successfully for all classes/streams!');
        toast.success('Exam added successfully');
      }

      // Reset form
      setExamName('');
      setEditingId(null);
      setError('');
    } catch (err) {
      console.error('Error saving exam:', err);
      setError('Failed to save exam. Please try again.');
      toast.error('Failed to save exam');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleEdit = (exam) => {
    setEditingId(exam.id);
    setExamName(exam.name);
    document.getElementById('exam-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setExamName('');
    setError('');
  };

  const handleDelete = async (exam) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Are you sure you want to delete the exam "${exam.name}" for ${exam.isStream ? `Class ${exam.className} (${exam.stream})` : `Class ${exam.className}`}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(firestore, 'exams', exam.id));
        setExams(exams.filter((e) => e.id !== exam.id));
        toast.success('Exam deleted successfully');
      } catch (err) {
        console.error('Error deleting exam:', err);
        toast.error('Failed to delete exam');
      }
    }
  };

  const getClassDisplayName = (exam) => {
    if (exam.isStream) {
      return `Class ${exam.className} (${exam.stream.charAt(0).toUpperCase() + exam.stream.slice(1)})`;
    }
    return `Class ${exam.className}`;
  };

  // Group exams by name
  const groupedExams = exams.reduce((acc, exam) => {
    const examName = exam.name.toLowerCase();
    if (!acc[examName]) {
      acc[examName] = { name: exam.name, assignments: [] };
    }
    acc[examName].assignments.push(exam);
    return acc;
  }, {});

  // Sort assignments within each group by class
  Object.values(groupedExams).forEach(group => {
    group.assignments.sort((a, b) => {
      const getSortWeight = (exam) => {
        if (exam.className === '+1') return 11 + (exam.stream === 'commerce' ? 0.1 : 0);
        if (exam.className === '+2') return 12 + (exam.stream === 'commerce' ? 0.1 : 0);
        const num = parseInt(exam.className, 10);
        return isNaN(num) ? 13 : num;
      };
      return getSortWeight(a) - getSortWeight(b);
    });
  });

  // Sort groups by exam name
  const sortedGroupedExams = Object.values(groupedExams).sort((a, b) => a.name.localeCompare(b.name));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Exam Form */}
      <div
        id="exam-form"
        className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-300 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {editingId ? 'Edit Exam' : 'Add Exam'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="examName" className="block text-sm font-medium text-gray-700">Exam Name</label>
            <input
              id="examName"
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="Midterm Exam 2025"
              className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 h-10 flex items-center justify-center gap-2 bg-[#3D4577] hover:bg-[#3d4577e5] text-white font-semibold rounded-lg transition-all duration-300 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin " />
              ) : editingId ? (
                <>
                  <Check className="w-5 h-5 mr-1" /> Update Exam
                </>
              ) : (
                'Add Exam'
              )}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 h-10 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-semibold rounded-lg transition-all duration-300"
              >
                <X className="w-5 h-5 mr-1" /> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Exams List Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Exam List</h2>
        
        {sortedGroupedExams.length === 0 ? (
          <p className="text-gray-500">No exams assigned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Exam Name</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Class/Stream</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Created At</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedGroupedExams.map(group => (
                  <Fragment key={group.name}>
                    <tr className="border-b border-gray-200">
                      <td className="p-3 font-semibold text-gray-800">{group.name}</td>
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(group.assignments[0])}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit Exam Name"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {group.assignments.map((exam, index) => (
                      <tr
                        key={exam.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${index === group.assignments.length - 1 ? 'border-b-2' : ''}`}
                      >
                        <td className="p-3"></td>
                        <td className="p-3 text-gray-600">{getClassDisplayName(exam)}</td>
                        <td className="p-3 text-gray-500 text-sm">
                          {exam.createdAt.toLocaleDateString()}
                          {exam.updatedAt && (
                            <span className="text-xs text-gray-400 block">Updated: {exam.updatedAt.toLocaleDateString()}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(exam)}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                              title="Delete Exam for this Class/Stream"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddExams;