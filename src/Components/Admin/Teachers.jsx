import { useState, useEffect } from 'react';
import { Edit, Trash2, Check, X, Loader2 } from 'lucide-react';
import { collection, addDoc, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { firestore, auth } from '../../Firebase/config'
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const Teachers = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    className: '',
    section: '',
  });

  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    className: '',
    section: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch teachers
        const teachersSnapshot = await getDocs(collection(firestore, 'teachers'));
        const teachersData = teachersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt
            ? new Date(
                typeof doc.data().createdAt === 'string'
                  ? doc.data().createdAt
                  : doc.data().createdAt.seconds * 1000
              ).toLocaleString()
            : 'N/A',
          updatedAt: doc.data().updatedAt
            ? new Date(
                typeof doc.data().updatedAt === 'string'
                  ? doc.data().updatedAt
                  : doc.data().updatedAt.seconds * 1000
              ).toLocaleString()
            : null,
        }));
        setTeachers(teachersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

        // Fetch classes
        const classesSnapshot = await getDocs(collection(firestore, 'classes'));
        const classesData = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClasses(classesData);
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        console.error('Error fetching data:', err);
        toast.error('Failed to fetch data');
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, []);

  const getAvailableSections = (className) => {
    if (!className) return [];
    const selectedClass = classes.find((cls) => cls.name === className);
    return selectedClass ? selectedClass.sections : [];
  };

  const isClassSectionTaken = (className, section, excludeTeacherId = null) => {
    return teachers.some(
      (teacher) =>
        teacher.className === className &&
        teacher.section === section &&
        teacher.id !== excludeTeacherId
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'className' ? { section: '' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, className, section } = formData;

    // Validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Valid email is required.');
      return;
    }
    if (!name.trim() || name.length < 3) {
      setError('Name must be at least 3 characters.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!className) {
      setError('Please select a class.');
      return;
    }
    if (!section) {
      setError('Please select a section.');
      return;
    }
    const availableSections = getAvailableSections(className);
    if (!availableSections.includes(section)) {
      setError(`Section ${section} is not available for ${className}`);
      return;
    }
    if (isClassSectionTaken(className, section)) {
      setError(`Class ${className} Section ${section} is already assigned to another teacher.`);
      toast.error('Class and section already assigned');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Use setDoc to set document ID to user.uid
      await setDoc(doc(firestore, 'teachers', user.uid), {
        uid: user.uid,
        name,
        email,
        className,
        section,
        role: 'teacher',
        createdAt: new Date().toISOString(),
      });

      setTeachers([
        {
          id: user.uid,
          uid: user.uid,
          name,
          email,
          className,
          section,
          role: 'teacher',
          createdAt: new Date().toLocaleString(),
          updatedAt: null,
        },
        ...teachers,
      ]);

      setSuccess('Teacher added successfully!');
      toast.success('Teacher added successfully');
      setFormData({ name: '', email: '', password: '', className: '', section: '' });
    } catch (err) {
      setError(err.message || 'Failed to add teacher. Please try again.');
      toast.error(err.message || 'Failed to add teacher');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleEdit = (teacher) => {
    setEditingId(teacher.id);
    setEditFormData({
      name: teacher.name,
      email: teacher.email,
      className: teacher.className,
      section: teacher.section,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'className' ? { section: '' } : {}),
    }));
  };

  const handleUpdate = async () => {
    const { name, email, className, section } = editFormData;

    // Validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Valid email is required.');
      return;
    }
    if (!name.trim() || name.length < 3) {
      setError('Name must be at least 3 characters.');
      return;
    }
    if (!className) {
      setError('Please select a class.');
      return;
    }
    if (!section) {
      setError('Please select a section.');
      return;
    }
    const availableSections = getAvailableSections(className);
    if (!availableSections.includes(section)) {
      setError(`Section ${section} is not available for ${className}`);
      return;
    }
    if (isClassSectionTaken(className, section, editingId)) {
      setError(`Class ${className} Section ${section} is already assigned to another teacher.`);
      toast.error('Class and section already assigned');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateDoc(doc(firestore, 'teachers', editingId), {
        name,
        email,
        className,
        section,
        updatedAt: new Date().toISOString(),
      });

      setTeachers(
        teachers.map((teacher) =>
          teacher.id === editingId
            ? {
                ...teacher,
                name,
                email,
                className,
                section,
                updatedAt: new Date().toLocaleString(),
              }
            : teacher
        )
      );

      setSuccess('Teacher updated successfully!');
      toast.success('Teacher updated successfully');
      setEditingId(null);
      setEditFormData({ name: '', email: '', className: '', section: '' });
    } catch (err) {
      setError(err.message || 'Failed to update teacher. Please try again.');
      toast.error(err.message || 'Failed to update teacher');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ name: '', email: '', className: '', section: '' });
    setError('');
  };

  const handleDelete = async (teacherId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this teacher?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await deleteDoc(doc(firestore, 'teachers', teacherId));
        setTeachers(teachers.filter((teacher) => teacher.id !== teacherId));
        setSuccess('Teacher deleted successfully!');
        toast.success('Teacher deleted successfully');
        console.warn('Firebase Auth user not deleted. Use Admin SDK or Cloud Function to delete user.');
      } catch (err) {
        setError(err.message || 'Failed to delete teacher. Please try again.');
        toast.error(err.message || 'Failed to delete teacher');
      } finally {
        setLoading(false);
        setTimeout(() => setSuccess(''), 1000);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Teacher Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-300 p-6 animate-in slide-in-from-right duration-500">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Teacher</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              autoComplete="username"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="teacher@example.com"
              className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              autoComplete="new-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              disabled={editingId !== null}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Class</label>
            <select
              name="className"
              value={formData.className}
              onChange={handleChange}
              className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            >
              <option value="">Select Class</option>
              {classes.sort((a, b) => a.name.localeCompare(b.name)).map((cls) => (
                <option key={cls.id} value={cls.name}>
                  Class {cls.name}
                </option>
              ))}
            </select>
          </div>
          {formData.className && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Section</label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              >
                <option value="">Select Section</option>
                {getAvailableSections(formData.className).map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <button
            type="submit"
            disabled={loading || editingId !== null}
            className={`w-full h-10 bg-[#3D4577] hover:bg-[#3d4577e5] text-white font-md rounded-lg transition-all duration-300 flex items-center justify-center ${
              loading || editingId !== null ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Teacher'}
          </button>
        </form>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Teachers List</h2>
          {fetching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
          ) : teachers.length === 0 ? (
            <p className="text-gray-500">No teachers added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left font-semibold text-gray-700 border-b">Name</th>
                    <th className="p-3 text-left font-semibold text-gray-700 border-b">Email</th>
                    <th className="p-3 text-left font-semibold text-gray-700 border-b">Class</th>
                    <th className="p-3 text-left font-semibold text-gray-700 border-b">Section</th>
                    <th className="p-3 text-left font-semibold text-gray-700 border-b">Created At</th>
                    <th className="p-3 text-left font-semibold text-gray-700 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                      {editingId === teacher.id ? (
                        <>
                          <td className="p-3">
                            <input
                              type="text"
                              name="name"
                              value={editFormData.name}
                              onChange={handleEditChange}
                              className="w-full p-2 border rounded border-gray-400"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="email"
                              name="email"
                              value={editFormData.email}
                              onChange={handleEditChange}
                              className="w-full p-2 border rounded border-gray-400"
                            />
                          </td>
                          <td className="p-3">
                            <select
                              name="className"
                              value={editFormData.className}
                              onChange={handleEditChange}
                              className="w-full p-2 border rounded border-gray-400"
                            >
                              <option value="">Select Class</option>
                              {classes.sort((a, b) => a.name.localeCompare(b.name)).map((cls) => (
                                <option key={cls.id} value={cls.name}>
                                  Class {cls.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              name="section"
                              value={editFormData.section}
                              onChange={handleEditChange}
                              className="w-full p-2 border rounded border-gray-400"
                            >
                              <option value="">Select Section</option>
                              {getAvailableSections(editFormData.className).map((sec) => (
                                <option key={sec} value={sec}>
                                  {sec}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 text-gray-500">{teacher.createdAt}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={handleUpdate}
                                disabled={loading}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Save"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={loading}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Cancel"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 font-medium text-gray-900">{teacher.name}</td>
                          <td className="p-3 text-gray-600">{teacher.email}</td>
                          <td className="p-3">{teacher.className}</td>
                          <td className="p-3">{teacher.section}</td>
                          <td className="p-3 text-gray-500">{teacher.createdAt}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(teacher)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(teacher.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
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

export default Teachers;