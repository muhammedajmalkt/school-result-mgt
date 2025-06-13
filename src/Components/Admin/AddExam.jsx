import { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, Check, Loader2 } from 'lucide-react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../Firebase/config'; 
import { toast } from 'sonner';
import Swal from 'sweetalert2';


const AddExams = () => {
  const [examName, setExamName] = useState('');
  const [subjects, setSubjects] = useState([{ name: '' }]);
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
        
        examsData.sort((a, b) => b.createdAt - a.createdAt);
        setExams(examsData);
        setLoading(false)
      } catch (err) {
        console.error('Error fetching exams: ', err);
        toast.error('Failed to load exams');
        setLoading(true)
      }
    };

    fetchExams();
  }, []);

  const addSubject = () => {
    setSubjects([...subjects, { name: '' }]);
  };

  const removeSubject = (index) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index));
    }
  };

  const updateSubject = (index, value) => {
    const newSubjects = [...subjects];
    newSubjects[index].name = value;
    setSubjects(newSubjects);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!examName.trim()) {
      setError('Exam name is required.');
      setLoading(false);
      return;
    }

    if (subjects.some((sub) => !sub.name.trim())) {
      setError('All subject names must be filled.');
      setLoading(false);
      return;
    }

    try {
      const filteredSubjects = subjects.filter(sub => sub.name.trim());
      
      if (editingId) {
        await updateDoc(doc(firestore, 'exams', editingId), {
          name: examName,
          subjects: filteredSubjects,
          updatedAt: new Date().toISOString()
        });

        setExams(exams.map(exam => 
          exam.id === editingId ? { 
            ...exam, 
            name: examName,
            subjects: filteredSubjects,
            updatedAt: new Date()
          } : exam
        ));

        setSuccess('Exam updated successfully!');
        toast.success('Exam updated successfully');
      } else {
        const examExists = exams.some(exam => 
          exam.name.toLowerCase() === examName.toLowerCase()
        );
        
        if (examExists) {
          setError('Exam with this name already exists');
          toast.error('Exam already exists');
          setLoading(false);
          return;
        }

        const docRef = await addDoc(collection(firestore, 'exams'), {
          name: examName,
          subjects: filteredSubjects,
          createdAt: new Date().toISOString()
        });

        setExams([{
          id: docRef.id,
          name: examName,
          subjects: filteredSubjects,
          createdAt: new Date(),
          updatedAt: null
        }, ...exams]);

        setSuccess('Exam added successfully!');
        toast.success('Exam added successfully');
      }

      // Reset form
      setExamName('');
      setSubjects([{ name: '' }]);
      setEditingId(null);
      setError('');
    } catch (err) {
      console.error('Error saving exam: ', err);
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
    setSubjects(exam.subjects.length > 0 ? exam.subjects : [{ name: '' }]);
    // Scroll to form
    document.getElementById('exam-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setExamName('');
    setSubjects([{ name: '' }]);
    setError('');
  };
                
        
  

const handleDelete = async (id) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'Are you sure you want to delete this exam?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
  });

  if (result.isConfirmed) {
    try {
      await deleteDoc(doc(firestore, 'exams', id));
      setExams(exams.filter((exam) => exam.id !== id));
      toast.success('Exam deleted successfully');
    } catch (err) {
      console.error('Error deleting exam: ', err);
      toast.error('Failed to delete exam');
    }
  }
};

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
        className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-300 p-6 "
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {editingId ? 'Edit Exam' : 'Add Exam'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Exam Name</label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="Midterm Exam 2025"
              className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subjects</label>
            {subjects.map((subject, index) => (
              <div key={index} className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={subject.name}
                  onChange={(e) => updateSubject(index, e.target.value)}
                  placeholder="Math"
                  className="block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
                {subjects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSubject(index)} 
                    className="text-red-600 hover:text-red-800 h-7 w-7 bg-red-50 rounded flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addSubject}
              className="mt-2 flex items-center text-blue-600 hover:text-blue-800 text-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Subject
            </button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 h-10 bg-[#3D4577] hover:bg-[#3d4577e5] text-white font-md rounded-lg transition-all duration-300 flex items-center justify-center ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
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
                className="flex-1 h-10 border border-gray-300 text-gray-700 font-md rounded-lg transition-all duration-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Exams List Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Exam List</h2>
          
          {exams.length === 0 ? (
            <p className="text-gray-500">No exams added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left font-semibold text-gray-700 border-b">Exam Name</th>
                    <th className="p-3 text-left font-semibold text-gray-700 border-b">Subjects</th>
                    <th className="p-3 text-left font-semibold text-gray-700 border-b">Created At</th>
                    <th className="p-3 text-left font-semibold text-gray-700 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{exam.name}</td>
                      <td className="p-3">
                        <ul className="list-disc sm:list-outside sm:pl-8">
                          {exam.subjects.map((subject, index) => (
                            <li key={index} className="sm:pl-2">{subject.name}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3 text-gray-500 text-sm">
                        {exam.createdAt.toLocaleDateString()}
                        {exam.updatedAt && (
                          <span className="text-xs text-gray-400 block">Updated: {exam.updatedAt.toLocaleDateString()}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(exam)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default AddExams;