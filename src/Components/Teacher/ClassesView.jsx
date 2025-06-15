// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { collection, query, where, getDocs } from 'firebase/firestore';
// import { onAuthStateChanged } from 'firebase/auth';
// import { firestore, auth } from '../../Firebase/config';

// const ClassesView = () => {
//     const [assignedClasses, setAssignedClasses] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');

//     useEffect(() => {
//         const unsubscribe = onAuthStateChanged(auth, async (user) => {
//             console.log(user);
            
//             if (user) {
//                 try {
//                     const teacherQuery = query(
//                         collection(firestore, 'teachers'),
//                         where('uid', '==', user.uid)
//                     );
//                     const teacherSnapshot = await getDocs(teacherQuery);

//                     if (teacherSnapshot.empty) {
//                         setError('No teacher profile found for this user.');
//                         setLoading(false);
//                         return;
//                     }

//                     const teacherData = teacherSnapshot.docs[0].data();
//                     const { className, section } = teacherData;

//                     const studentsQuery = query(
//                         collection(firestore, 'students'),
//                         where('className', '==', className),
//                         where('section', '==', section)
//                     );
//                     const studentsSnapshot = await getDocs(studentsQuery);

//                     const students = studentsSnapshot.docs.map((doc) => ({
//                         id: doc.id,
//                         ...doc.data(),
//                     }));

//                     // Structure the assigned class data
//                     const classData = {
//                         teacher:`${user.displayName}`,
//                         classId: `${className}-${section}`,
//                         className: `${className} `,
//                         section: `${section}`,
//                         students: students.map((student) => ({
//                             rollNo: student.rollNo,
//                             name: student.name,
//                             regNo: student.regNo, 
//                         })),
//                     };

//                     setAssignedClasses([classData]);
//                     setLoading(false);
//                 } catch (err) {
//                     console.error('Error fetching data:', err);
//                     setError('Failed to load class data. Please try again.');
//                     setLoading(false);
//                 }
//             } else {
//                 setError('Please log in to view your assigned classes.');
//                 setLoading(false);
//             }
//         });

//         return () => unsubscribe();
//     }, []);

//     if (loading) {
//         return (
//             <div className="flex  flex-row justify-center items-center min-h-screen min-w-screen  z-50">
//                 <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-blue-500"></div>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="flex justify-center items-center min-h-screen min-w-screen">
//                 <p className="text-red-500">{error}</p>
//             </div>
//         );
//     }
//     console.log(assignedClasses);
    

//     return (
//         <div className="ml-0 lg:ml-64 pt-28  p-8 w-full mx-auto ">


//             {assignedClasses.length === 0 ? (
//                 <p className="text-gray-500">No classes assigned to you.</p>
//             ) : (
//                 assignedClasses.map((cls) => (
//                     <div key={cls.classId} className="mb-6">
//                         <div className='flex items-center gap-2 mb-1'>
//                         <h2 className="text-xl font-bold text-gray-500  tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }} >
//                             Assigned Class:
//                         </h2>
//                         <h3 className="text-xl font-semibold text-[#3D4577]  tracking-wide" style={{ fontFamily: "'Lora', serif" }} >
//                             {cls.className + cls.section}
//                         </h3>
                        
//                         </div>
//                         <div className="space-y-1 flex items-center ">
//                             <p className="  text-gray-500">Teacher:</p>
//                             <p className=" text-[#3D4577] ml-1">{cls.teacher}</p>
//                         </div>
//                         <div className="space-y-1 flex items-center mb-4">
//                             <p className="  text-gray-500">Students:</p>
//                             <p className="  text-[#3D4577] ml-1">{cls.students.length}</p>
//                         </div>

//                         {cls.students.length === 0 ? (
//                             <p className="text-gray-500">No students in this class.</p>
//                         ) : (
//                             <div className="overflow-x-auto rounded-lg">
//                                 <table className="min-w-full bg-parchment-50 rounded-lg border border-[#3D4577]">
//                                     <thead>
//                                         <tr
//                                             className="bg-[#3D4577] text-cyan-50 font-medium text-base tracking-wide"
//                                             style={{ fontFamily: "'Lora', serif" }}
//                                         >
//                                             <th className="p-4 border-b border-r border-[#3D4577]">Roll No</th>
//                                             <th className="p-4 border-b border-r border-[#3D4577]">Student Name</th>
//                                             <th className="p-4 border-b border-r border-[#3D4577]">Reg.No</th>
//                                             <th className="p-4 border-b border-[#3D4577]">Action</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody >
//                                         {cls.students.sort((a, b) => a.rollNo - b.rollNo).map((student) => (
//                                             <tr
//                                                 key={student.rollNo}
//                                                 className="bg-cream-50 text-[#3D4577] text-sm hover:bg-[#3d457716] transition-colors duration-200 text-center"
//                                             >
//                                                 <td className="p-4 border-b border-r border-[#3D4577]">
//                                                     {student.rollNo}
//                                                 </td>
//                                                 <td className="p-4 border-b border-r border-[#3D4577] ">
//                                                     {student.name}
//                                                 </td>
//                                                 <td className="p-4 border-b border-r border-[#3D4577] ">
//                                                     {student.regNo}
//                                                 </td>
//                                                 <td className="p-4 border-b border-[#3D4577]">
//                                                     <Link
//                                                         to={`exam-entry/${student.regNo}/${cls.className}`} 
//                                                         className="text-[#3D4577] hover:text-blue-900 font-medium tracking-wide underline decoration-1 decoration-[#3D4577] hover:decoration-blue-950 transition-all duration-200"
//                                                         style={{ fontFamily: "'Lora', serif" }}
//                                                     >
//                                                         Enter Exam Scores
//                                                     </Link>
//                                                 </td>
//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         )}
//                     </div>
//                 ))
//             )}
//         </div>
//     );
// };

// export default ClassesView;

// ClassesView.jsx



import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { firestore, auth } from '../../Firebase/config';

const ClassesView = () => {
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const teacherQuery = query(
            collection(firestore, 'teachers'),
            where('uid', '==', user.uid)
          );
          const teacherSnapshot = await getDocs(teacherQuery);

          if (teacherSnapshot.empty) {
            setError('No teacher profile found for this user.');
            setLoading(false);
            return;
          }

          const teacherData = teacherSnapshot.docs[0].data();
          const { className, section } = teacherData;

          const studentsQuery = query(
            collection(firestore, 'students'),
            where('className', '==', className),
            where('section', '==', section)
          );
          const studentsSnapshot = await getDocs(studentsQuery);

          const students = studentsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const classData = {
            teacher: `${user.displayName}`,
            classId: `${className}-${section}`,
            className: `${className}`, // Ensure className is stored
            section: `${section}`,
            students: students.map((student) => ({
              rollNo: student.rollNo,
              name: student.name,
              regNo: student.regNo,
            })),
          };

          setAssignedClasses([classData]);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching data:', err);
          setError('Failed to load class data. Please try again.');
          setLoading(false);
        }
      } else {
        setError('Please log in to view your assigned classes.');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-row justify-center items-center min-h-screen min-w-screen z-50">
        <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-blue-500 "></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen min-w-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="ml-0 lg:ml-64 pt-28 p-8 w-full mx-auto">
      {assignedClasses.length === 0 ? (
        <p className="text-gray-500">No classes assigned to you.</p>
      ) : (
        assignedClasses.map((cls) => (
          <div key={cls.classId} className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h2
                className="text-xl font-bold text-gray-500 tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Assigned Class:
              </h2>
              <h3
                className="text-xl font-semibold text-[#3D4577] tracking-wide"
                style={{ fontFamily: "'Lora', serif" }}
              >
                {cls.className  + cls.section}
              </h3>
            </div>
            <div className="space-y-1 flex items-center">
              <p className="text-gray-500">Teacher:</p>
              <p className="text-[#3D4577] ml-1">{cls.teacher}</p>
            </div>
            <div className="space-y-1 flex items-center mb-4">
              <p className="text-gray-500">Students:</p>
              <p className="text-[#3D4577] ml-1">{cls.students.length}</p>
            </div>

            {cls.students.length === 0 ? (
              <p className="text-gray-500">No students in this class.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <table className="min-w-full  bg-parchment-50 rounded-lg border border-[#3D4577]">
                  <thead>
                    <tr
                      className="bg-[#3D4577] text-cyan-50 font-medium text-base tracking-wide"
                      style={{ fontFamily: "'Lora', serif" }}
                    >
                      <th className="p-4 border-b border-r border-[#3D4577]">Roll No</th>
                      <th className="p-4 border-b border-r border-[#3D4577]">Student Name</th>
                      <th className="p-4 border-b border-r border-[#3D4577]">Reg.No</th>
                      <th className="p-4 border-b border-[#3D4577]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cls.students.sort((a, b) => a.rollNo - b.rollNo).map((student) => (
                      <tr
                        key={student.rollNo}
                        className="bg-cream-50 text-[#3D4577] text-sm hover:bg-[#3d457716] transition-colors duration-200 text-center"
                      >
                        <td className="p-4 border-b border-r border-[#3D4577]">{student.rollNo}</td>
                        <td className="p-4 border-b border-r border-[#3D4577]">{student.name}</td>
                        <td className="p-4 border-b border-r border-[#3D4577]">{student.regNo}</td>
                        <td className="p-4 border-b border-[#3D4577]">
                          <Link
                            to={`exam-entry/${student.regNo}/${cls.className}`} 
                            className="text-[# Upgrade ExamEntry to receive and use className
3D4577] hover:text-blue-900 font-medium tracking-wide underline decoration-1 decoration-[#3D4577] hover:decoration-blue-950 transition-all duration-200"
                            style={{ fontFamily: "'Lora', serif" }}
                          >
                            Enter Exam Scores
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ClassesView;