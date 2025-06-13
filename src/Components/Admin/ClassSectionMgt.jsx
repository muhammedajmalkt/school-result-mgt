import { useState, useEffect } from 'react';
import { Save, Edit, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { firestore } from '../../Firebase/config'; 
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const ClassSectionManagement = () => {
  const [allSections, setAllSections] = useState([]);
  const [newSection, setNewSection] = useState('');
  const [showSections, setShowSections] = useState(false);
  const [className, setClassName] = useState('');
  const [selectedSections, setSelectedSections] = useState([]);
  const [savedClasses, setSavedClasses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('' );
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch data from Firestore on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const sectionsSnapshot = await getDocs(collection(firestore, 'sections'));
        const sectionsData = sectionsSnapshot.docs.map(doc => doc.data().name);
        setAllSections(sectionsData);

        const classesSnapshot = await getDocs(collection(firestore, 'classes'));
        const classesData = classesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSavedClasses(classesData);
      } catch (err) {
        setError('Failed to fetch data from server');
        toast('Failed to fetch data from server')
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addSection = async (e) => {
   e.preventDefault()
    if (!newSection.trim()) {
      setError('Section name cannot be empty');
      toast('Section name cannot be empty')
      return;
    }
    
    const section = newSection.trim().toUpperCase();
    if (allSections.includes(section)) {
      setError(`Section ${section} already exists`);
      toast(`Section ${section} already exists`)
      return;
    }

    try {
      const sectionQuery = query(
        collection(firestore, 'sections'),
        where('name', '==', section)
      );
      const querySnapshot = await getDocs(sectionQuery);
      
      if (!querySnapshot.empty) {
        setError(`Section ${section} already exists in database`);
        toast(`Section ${section} already exists in database`)
        return;
      }

      await addDoc(collection(firestore, 'sections'), { name: section });
      
      setAllSections([...allSections, section]);
      setNewSection('');
      setError('');
      setSuccess(`Section ${section} added successfully`);
      toast(`Section ${section} added successfully`)
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add section');
      toast('Failed to add section')
      console.error(err);
    }
  };

  const removeSection = async (section) => {
    const isUsed = savedClasses.some(cls => cls.sections.includes(section));

    if (isUsed) {
      setError(`Cannot remove section ${section} - it's assigned to classes`);
      toast(`Cannot remove section ${section} - it's assigned to classes`,{style:{backgroundColor:"#cc5858" ,color :"white"}})
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const sectionQuery = query(
        collection(firestore, 'sections'),
        where('name', '==', section)
      );
      const querySnapshot = await getDocs(sectionQuery);
      
      if (!querySnapshot.empty) {
        await deleteDoc(doc(firestore, 'sections', querySnapshot.docs[0].id));
      }

      setAllSections(allSections.filter(s => s !== section));
      setSuccess(`Section ${section} removed successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove section');
      toast('Failed to remove section')
      console.error(err);
    }
  };

  // Toggle section selection for current class
  const toggleSection = (section) => {
    setSelectedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const saveClass = async () => {
    if (!className) {
      setError('Please select a class');
      return;
    }

    if (selectedSections.length === 0) {
      setError('Please select at least one section');
      return;
    }

    const classData = {
      name: className,
      sections: [...selectedSections].sort()
    };

    try {
      if (editingId) {
        await updateDoc(doc(firestore, 'classes', editingId), classData);
        
        setSavedClasses(savedClasses.map(cls => 
          cls.id === editingId ? { ...cls, ...classData } : cls
        ));
        setSuccess('Class updated successfully');
      } else {
        const classQuery = query(
          collection(firestore, 'classes'),
          where('name', '==', className)
        );
        const querySnapshot = await getDocs(classQuery);
        
        if (!querySnapshot.empty) {
          toast('This class already exists',{style:{backgroundColor:"#cc5858"  ,color :"white"}})
          setError('This class already exists');
          return;
        }
        
        const docRef = await addDoc(collection(firestore, 'classes'), classData);
        
        setSavedClasses([...savedClasses, { id: docRef.id, ...classData }]);
        setSuccess('Class added successfully');
        toast('Class added successfully',{style:{backgroundColor:"#308051", color:"white"}})
      }

      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      toast('Failed to save class',{style:{backgroundColor:"#cc5858" , color:"white"}})
      setError('Failed to save class');

      console.error(err);
    }
  };

  // Edit existing class
  const editClass = (classId) => {
    const cls = savedClasses.find(c => c.id === classId);
    if (!cls) return;

    setClassName(cls.name);
    setSelectedSections([...cls.sections]);
    setEditingId(classId);
  };
const deleteClass = async (classId) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'Are you sure you want to delete this class?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
  });

  if (result.isConfirmed) {
    try {
      await deleteDoc(doc(firestore, 'classes', classId));
      setSavedClasses(savedClasses.filter(cls => cls.id !== classId));
      if (editingId === classId) resetForm();
      setSuccess('Class deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete class');
      console.error(err);
    }
  }
};

  const resetForm = () => {
    setClassName('');
    setSelectedSections([]);
    setEditingId(null);
    setError('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  console.log(savedClasses);
  

  return (
    <div className=" space-y-8 ">

      
      {/* Section Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Manage Sections
        </h2>
        
        <div className="space-y-4">
          <form className="flex gap-2" onSubmit={addSection}>
            <input
              type="text"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value.toUpperCase())}
              placeholder="Add new section (e.g., F)"
              className="flex-1 h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-500"
              // maxLength="1"
            />
            <button
            type='submit'
              // onClick={addSection}
              className="h-10 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center cursor-pointer"
            >
              Add
            </button>
          </form>

         

          <div className="border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => setShowSections(!showSections)}
              className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Available Sections ({allSections.length})</span>
              {showSections ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            
            {showSections && (
              <div className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                {allSections.length > 0 ? (
                  allSections.sort().map(section => (
                    <div key={section} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                      <span className="font-medium">{section}</span>
                      <button
                        onClick={() => removeSection(section)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                        title="Remove section"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-500 text-center">No sections available</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
       {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}

      {/* Class-Section Assignment */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {editingId ? 'Edit Class Sections' : 'Assign Sections to Class'}
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Class
            </label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a class</option>
              {[...Array(10)].map((_, i) => (
                <option key={i+1} value={i+1}>Class {i+1}</option>
              ))}
              <option value="+1">Class +1</option>
              <option value="+2">Class +2</option>
            </select>
          </div>

          {className && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Sections for {className}
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {allSections.length > 0 ? (
                  allSections.sort().map(section => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => toggleSection(section)}
                      className={`h-10 rounded-md border flex items-center justify-center transition-colors ${
                        selectedSections.includes(section)
                          ? 'bg-blue-100 border-blue-500 text-blue-800'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {section}
                    </button>
                  ))
                ) : (
                  <div className="col-span-full text-gray-500 text-center py-4">
                    No sections available. Please add sections first.
                  </div>
                )}
              </div>

              {selectedSections.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-1">
                    Selected sections ({selectedSections.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSections.sort().map(section => (
                      <span 
                        key={section}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={saveClass}
              disabled={!className || selectedSections.length === 0}
              className={`flex-1 h-10 flex items-center justify-center gap-2 ${
                editingId ? 'bg-yellow-600 hover:bg-yellow-700' :  'bg-[#3D4577] hover:bg-[#3d4577e5]'
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

            {editingId && (
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

      {/* Class Sections List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Class Sections List
        </h2>

        {savedClasses.length === 0 ? (
          <p className="text-gray-500 italic text-center py-4">No classes have been configured yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-[#3D4577] rounded">
              <thead className=" ">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Sections
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {savedClasses.sort((a, b) => a.name.localeCompare(b.name)).map(cls => (
                  <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cls.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {cls.sections.map(section => (
                          <span 
                            key={section} 
                            className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs"
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => editClass(cls.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deleteClass(cls.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete"
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

export default ClassSectionManagement;