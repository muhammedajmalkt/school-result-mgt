import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Trash2, Edit, Save, Check, X } from 'lucide-react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { firestore } from '../../Firebase/config';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

const SubjectManagement = () => {
  const [allSubjects, setAllSubjects] = useState([]);
  const [classAssignments, setClassAssignments] = useState({});
  const [newSubject, setNewSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [availableSubjectsForClass, setAvailableSubjectsForClass] = useState([]);
  const [selectedSubjectsToAdd, setSelectedSubjectsToAdd] = useState([]);
  const [showSubjects, setShowSubjects] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stream, setStream] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch subjects
        const subjectsSnapshot = await getDocs(collection(firestore, 'subjects'));
        const subjectsData = subjectsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setAllSubjects(subjectsData.map(subject => subject.name));

        // Fetch class assignments
        const classAssignmentsSnapshot = await getDocs(collection(firestore, 'classSubjects'));
        const classAssignmentsData = {};
        classAssignmentsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const key = data.isStream ? `${data.className} ${data.stream}` : data.className;
          classAssignmentsData[key] = {
            id: doc.id,
            className: data.className,
            subjects: data.subjects,
            isStream: data.isStream,
            ...(data.isStream && { stream: data.stream })
          };
        });
        setClassAssignments(classAssignmentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update available subjects when class/stream selection changes
  useEffect(() => {
    if (selectedClass) {
      let assignedSubjects = [];
      const key = (selectedClass === '+1' || selectedClass === '+2') && stream ? `${selectedClass} ${stream}` : selectedClass;
      if (classAssignments[key]) {
        assignedSubjects = classAssignments[key].subjects || [];
      }
      const available = allSubjects.filter(subject => !assignedSubjects.includes(subject));
      setAvailableSubjectsForClass(available);
      setSelectedSubjectsToAdd([]);
    }
  }, [selectedClass, stream, allSubjects, classAssignments]);

  // Add new subject to Firestore
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      setError('Subject name cannot be empty');
      return;
    }
    if (allSubjects.includes(newSubject.trim())) {
      setError('Subject already exists');
      return;
    }

    try {
      await addDoc(collection(firestore, 'subjects'), { name: newSubject.trim() });
      setAllSubjects([...allSubjects, newSubject.trim()]);
      setNewSubject('');
      setError('');
      setSuccess('Subject added successfully');
      toast.success('Subject added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding subject:', error);
      setError('Failed to add subject');
      toast.error('Failed to add subject');
    }
  };

  // Assign selected subjects to class/stream in Firestore
  const handleAssignSubjects = async () => {
    if (!selectedClass) {
      setError('Please select a class first');
      return;
    }
    if (selectedSubjectsToAdd.length === 0 && !editingId) {
      setError('Please select at least one subject');
      return;
    }
    if ((selectedClass === '+1' || selectedClass === '+2') && !stream) {
      setError('Please select a stream');
      return;
    }

    try {
      const key = (selectedClass === '+1' || selectedClass === '+2') ? `${selectedClass} ${stream}` : selectedClass;
      const existingAssignment = classAssignments[key];

      if (existingAssignment) {
        // Update existing assignment
        await updateDoc(doc(firestore, 'classSubjects', existingAssignment.id), {
          subjects: [...new Set([...existingAssignment.subjects, ...selectedSubjectsToAdd])],
          updatedAt: new Date().toISOString()
        });
        setClassAssignments({
          ...classAssignments,
          [key]: {
            ...existingAssignment,
            subjects: [...new Set([...existingAssignment.subjects, ...selectedSubjectsToAdd])]
          }
        });
      } else {
        const docRef = await addDoc(collection(firestore, 'classSubjects'), {
          className: selectedClass,
          subjects: selectedSubjectsToAdd,
          isStream: selectedClass === '+1' || selectedClass === '+2',
          ...(selectedClass === '+1' || selectedClass === '+2' ? { stream } : {}),
          createdAt: new Date().toISOString()
        });
        setClassAssignments({
          ...classAssignments,
          [key]: {
            id: docRef.id,
            className: selectedClass,
            subjects: selectedSubjectsToAdd,
            isStream: selectedClass === '+1' || selectedClass === '+2',
            ...(selectedClass === '+1' || selectedClass === '+2' ? { stream } : {})
          }
        });
      }

      setSelectedSubjectsToAdd([]);
      setSuccess('Subjects assigned successfully');
      toast.success('Subjects assigned successfully');
      if(success){
         resetForm()
      }
      if (!editingId) {
        setSelectedClass('');
        setStream('');
      }
    } catch (error) {
      console.error('Error assigning subjects:', error);
      setError('Failed to assign subjects');
      toast.error('Failed to assign subjects');
    }
  };

  // Remove subject from assigned subjects in edit mode
  const handleRemoveSubject = async (subjectToRemove) => {
    const key = (selectedClass === '+1' || selectedClass === '+2') ? `${selectedClass} ${stream}` : selectedClass;
    const existingAssignment = classAssignments[key];

    if (!existingAssignment) return;

    try {
      const updatedSubjects = existingAssignment.subjects.filter(subject => subject !== subjectToRemove);
      await updateDoc(doc(firestore, 'classSubjects', existingAssignment.id), {
        subjects: updatedSubjects,
        updatedAt: new Date().toISOString()
      });
      setClassAssignments({
        ...classAssignments,
        [key]: {
          ...existingAssignment,
          subjects: updatedSubjects
        }
      });
      setSuccess('Subject removed successfully');
      // toast.success('Subject removed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error removing subject:', error);
      setError('Failed to remove subject');
      toast.error('Failed to remove subject');
    }
  };

  // Delete subject with confirmation modal
  const handleDeleteSubject = async (subject) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the subject "${subject}"? This will also remove it from all class assignments.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
      try {
        // Delete subject from Firestore
        const subjectsQuery = query(
          collection(firestore, 'subjects'),
          where('name', '==', subject)
        );
        const subjectsSnapshot = await getDocs(subjectsQuery);
        subjectsSnapshot.forEach(async (docSnap) => {
          await deleteDoc(doc(firestore, 'subjects', docSnap.id));
        });

        // Update class assignments
        const updatedAssignments = { ...classAssignments };
        for (const key in updatedAssignments) {
          updatedAssignments[key].subjects = updatedAssignments[key].subjects.filter(s => s !== subject);
          if (updatedAssignments[key].subjects.length > 0) {
            await updateDoc(doc(firestore, 'classSubjects', updatedAssignments[key].id), {
              subjects: updatedAssignments[key].subjects,
              updatedAt: new Date().toISOString()
            });
          } else {
            await deleteDoc(doc(firestore, 'classSubjects', updatedAssignments[key].id));
            delete updatedAssignments[key];
          }
        }

        setAllSubjects(allSubjects.filter(s => s !== subject));
        setClassAssignments(updatedAssignments);
        setSuccess('Subject deleted successfully');
        toast.success('Subject deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting subject:', error);
        setError('Failed to delete subject');
        toast.error('Failed to delete subject');
      }
    }
  };

  // Edit class/stream assignments
  const editClass = (className) => {
    if (className.includes('+')) {
      const [classNum, stream] = className.split(' ');
      setSelectedClass(classNum);
      setStream(stream);
    } else {
      setSelectedClass(className);
      setStream('');
    }
    setEditingId(className);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset form
  const resetForm = () => {
    setSelectedClass('');
    setEditingId(null);
    setSelectedSubjectsToAdd([]);
    setStream('');
    setError('');
  };

  // Get display name for class/stream
  const getClassDisplayName = (cls) => {
    if (cls.includes('+')) {
      const [classNum, stream] = cls.split(' ');
      return `Class ${classNum}  (${stream.charAt(0).toUpperCase() + stream.slice(1)})`;
    }
    return `Class ${cls}`;
  };

  // Sort classes in a logical order
  const sortClasses = (classes) => {
    return classes.sort((a, b) => {
      const getSortWeight = (cls) => {
        if (cls.includes('+1')) return 11;
        if (cls.includes('+2')) return 12;
        const num = parseInt(cls, 10);
        return isNaN(num) ? 13 : num;
      };

      const weightA = getSortWeight(a);
      const weightB = getSortWeight(b);

      return weightA - weightB;
    });
  };

  // Combine regular classes and streams for display
  const getAllClasses = () => {
    return Object.keys(classAssignments);
  };


  const handleDelete = async(cls) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete all subjects for ${getClassDisplayName(cls)}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
         await deleteDoc(doc(firestore, 'classSubjects', classAssignments[cls].id));
        const updatedAssignments = { ...classAssignments };
        delete updatedAssignments[cls];
        setClassAssignments(updatedAssignments);
        if (selectedClass === cls || (cls.includes('+') && selectedClass === cls.split(' ')[0])) {
          resetForm();
        }
        setSuccess('Class subjects deleted successfully');
        toast.success('Class subjects deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting class assignment:', error);
        setError('Failed to delete class assignment');
        toast.error('Failed to delete class assignment');
      }
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Subject Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Manage Subjects</h2>
        <div className="space-y-4">
          <form className="flex gap-2" onSubmit={handleAddSubject}>
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Add new subject (e.g., Psychology)"
              className="flex-1 h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="h-10 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center cursor-pointer"
            >
              Add
            </button>
          </form>

          <div className="border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => setShowSubjects(!showSubjects)}
              className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Available Subjects ({allSubjects.length})</span>
              {showSubjects ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showSubjects && (
              <div className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                {allSubjects.length > 0 ? (
                  allSubjects.sort().map((subject, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                      <span className="font-medium">{subject}</span>
                      <button
                        onClick={() => handleDeleteSubject(subject)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                        title="Remove subject"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-500 text-center">No subjects available</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}

      {/* Class-Subject Assignment */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {editingId ? 'Edit Class Subjects' : 'Assign Subjects to Class'}
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a class</option>
              <optgroup label="Primary (1-4)">
                {[1, 2, 3, 4].map(i => (
                  <option key={i} value={i}>Class {i}</option>
                ))}
              </optgroup>
              <optgroup label="Middle (5-7)">
                {[5, 6, 7].map(i => (
                  <option key={i} value={i}>Class {i}</option>
                ))}
              </optgroup>
              <optgroup label="Secondary (8-10)">
                {[8, 9, 10].map(i => (
                  <option key={i} value={i}>Class {i}</option>
                ))}
              </optgroup>
              <optgroup label="Senior Secondary">
                <option value="+1">Class +1</option>
                <option value="+2">Class +2</option>
              </optgroup>
            </select>
          </div>

          {selectedClass && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Subjects for {stream ? ` (${stream.charAt(0).toUpperCase() + stream.slice(1)})` : ''}
              </label>

              {/* Stream selection for +1/+2 */}
              {(selectedClass === '+1' || selectedClass === '+2') && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Select Stream:</h4>
                  <div className="flex flex-wrap gap-4">
                    {['Science', 'Humanities'].map(str => (
                      <label key={str} className="inline-flex items-center">
                        <input
                          type="radio"
                          name="stream"
                          value={str.toLowerCase()}
                          checked={stream === str.toLowerCase()}
                          onChange={() => setStream(str.toLowerCase())}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">{str}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {allSubjects.length > 0 ? (
                  allSubjects
                    .filter(subject => {
                      const key = (selectedClass === '+1' || selectedClass === '+2') && stream ? `${selectedClass} ${stream}` : selectedClass;
                      const currentSubjects = classAssignments[key]?.subjects || [];
                      return !currentSubjects.includes(subject) || selectedSubjectsToAdd.includes(subject);
                    })
                    .sort()
                    .map(subject => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => {
                          if (selectedSubjectsToAdd.includes(subject)) {
                            setSelectedSubjectsToAdd(selectedSubjectsToAdd.filter(s => s !== subject));
                          } else {
                            setSelectedSubjectsToAdd([...selectedSubjectsToAdd, subject]);
                          }
                        }}
                        className={`h-10 rounded-md border flex items-center justify-center transition-colors ${
                          selectedSubjectsToAdd.includes(subject)
                            ? 'bg-blue-100 border-blue-500 text-blue-800'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {subject}
                      </button>
                    ))
                ) : (
                  <div className="col-span-full text-gray-500 text-center py-4">
                    No subjects available. Please add subjects first.
                  </div>
                )}
              </div>

              {((selectedClass === '+1' || selectedClass === '+2') && stream &&
                (classAssignments[`${selectedClass} ${stream}`]?.subjects?.length > 0 || selectedSubjectsToAdd.length > 0)) ||
                (classAssignments[selectedClass]?.subjects?.length > 0 || selectedSubjectsToAdd.length > 0) ? (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-1">
                    Selected subjects (
                    {((selectedClass === '+1' || selectedClass === '+2') && stream
                      ? (classAssignments[`${selectedClass} ${stream}`]?.subjects?.length || 0)
                      : (classAssignments[selectedClass]?.subjects?.length || 0)) + selectedSubjectsToAdd.length}
                    ):
                  </p>
                  <div className="space-y-1.5 pl-4">
                    {[
                      ...((selectedClass === '+1' || selectedClass === '+2') && stream
                        ? (classAssignments[`${selectedClass} ${stream}`]?.subjects || [])
                        : (classAssignments[selectedClass]?.subjects || [])),
                      ...selectedSubjectsToAdd
                    ]
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .sort()
                      .map(subject => (
                        <div key={subject} className="text-sm text-gray-700 flex items-center">
                          <span className="w-1 h-1 bg-gray-500 rounded-full mr-2"></span>
                          {subject}
                          {((selectedClass === '+1' || selectedClass === '+2') && stream
                            ? classAssignments[`${selectedClass} ${stream}`]?.subjects?.includes(subject)
                            : classAssignments[selectedClass]?.subjects?.includes(subject)) && (
                            <button
                              onClick={() => handleRemoveSubject(subject)}
                              className="ml-2 text-red-500 hover:text-red-700 bg-red-50"
                              title="Remove"
                            >
                              <X size={14}  />
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAssignSubjects}
              disabled={!selectedClass || ((selectedClass === '+1' || selectedClass === '+2') && !stream)}
              className={`flex-1 h-10 flex items-center justify-center gap-2 ${
                editingId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-[#3D4577] hover:bg-[#3d4577e5]'
              } text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              {editingId ? (
                <>
                  <Check size={18} /> Update Class
                </>
              ) : (
                <>
                  <Save size={18} /> Save Class
                </>
              )}
            </button>

            {(editingId || selectedClass) && (
              <button
                onClick={resetForm}
                className="flex-1 h-10 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <X size={18} /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Class Subjects List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Class Subjects List</h2>
        {getAllClasses().length === 0 ? (
          <p className="text-gray-500 italic text-center py-4">No classes have been configured yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-[#3D4577] rounded">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Subjects</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortClasses(getAllClasses()).map(cls => (
                  <tr key={cls} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getClassDisplayName(cls)}
                    </td>
                    <td className="px-6 py-4">
                      <ul className="list-disc pl-5 space-y-1">
                        {classAssignments[cls]?.subjects?.sort().map(subject => (
                          <li key={subject} className="text-sm text-gray-800">
                            {subject}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => editClass(cls)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={()=>handleDelete(cls)}
                          
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete All"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectManagement;