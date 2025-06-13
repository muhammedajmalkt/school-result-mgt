import { useState, useMemo, useRef, useEffect } from 'react';
import { usePapaParse } from 'react-papaparse';
import { Search, Filter, Users, User, Hash, BookOpenText, Bookmark, FileX, Edit, Trash2, Check, X, Download, Upload } from 'lucide-react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../Firebase/config';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const Students = () => {
  const { readString } = usePapaParse();
  const fileInputRef = useRef(null);

  const [student, setStudent] = useState({
    name: '',
    regNo: '',
    gender: '',
    className: '',
    section: '',
    rollNo: '',
  });

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    regNo: '',
    gender: '',
    className: '',
    section: '',
    rollNo: '',
  });
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch students and classes from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentsSnapshot = await getDocs(collection(firestore, 'students'));
        const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentsData);

        const classesSnapshot = await getDocs(collection(firestore, 'classes'));
        const classesData = classesSnapshot.docs.map(doc => doc.data());
        setClasses(classesData);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data: ', err);
        setError('Failed to load data');
        toast.error('Failed to load data');
        setLoading(true);
      }
    };

    fetchData();
  }, []);

  const availableSections = useMemo(() => {
    if (!student.className) return [];
    const selectedClass = classes.find(c => c.name === student.className);
    return selectedClass ? selectedClass.sections : [];
  }, [student.className, classes]);

  const uniqueClasses = useMemo(() => {
    const classNames = students.map(s => s.className);
    return ['all', ...new Set(classNames)];
  }, [students]);

  const uniqueSections = useMemo(() => {
    const sections = students.map(s => s.section);
    return ['all', ...new Set(sections)];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.gender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.toString().includes(searchTerm);

      const matchesClass = filterClass === 'all' || student.className === filterClass;
      const matchesSection = filterSection === 'all' || student.section === filterSection;

      return matchesSearch && matchesClass && matchesSection;
    });
  }, [students, searchTerm, filterClass, filterSection]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudent(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'className' ? { section: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, regNo, gender, className, section, rollNo } = student;

    if (!name.trim() || name.trim().length < 3) {
      setError('Name must be at least 3 characters.');
      toast.error('Name must be at least 3 characters.');
      return;
    }
    if (!regNo.trim()) {
      setError('Registration number is required.');
      toast.error('Registration number is required.');
      return;
    }
    if (!gender.trim()) {
      setError('Gender is required.');
      toast.error('Gender is required.');
      return;
    }
    if (!className.trim()) {
      setError('Class is required.');
      toast.error('Class is required.');
      return;
    }
    if (!section.trim()) {
      setError('Section is required.');
      toast.error('Section is required.');
      return;
    }
    if (!rollNo.trim() || isNaN(rollNo) || rollNo <= 0) {
      setError('Valid roll number is required.');
      toast.error('Valid roll number is required.');
      return;
    }

    try {
      const exists = students.some(s => s.regNo === regNo);
      if (exists) {
        setError('Student with this registration number already exists');
        toast.error('Student with this registration number already exists');
        return;
      }

      const selectedClass = classes.find(c => c.name === className);
      if (!selectedClass || !selectedClass.sections.includes(section)) {
        setError(`Section ${section} is not available for ${className}`);
        toast.error(`Section ${section} is not available for ${className}`);
        return;
      }

      const docRef = await addDoc(collection(firestore, 'students'), {
        name: name.trim(),
        regNo: regNo.trim(),
        gender: gender.trim(),
        className: className.trim(),
        section: section.trim(),
        rollNo: parseInt(rollNo)
      });

      setStudents(prev => [...prev, { id: docRef.id, ...student, rollNo: parseInt(rollNo) }]);
      setSuccess('Student added successfully!');
      toast.success('Student added successfully!');
      setError('');
      setStudent({ name: '', regNo: '', gender: '', className: '', section: '', rollNo: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding student: ', err);
      setError('Failed to add student');
      toast.error('Failed to add student');
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setUploadProgress(0);

    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large (max 5MB)');
      toast.error('File size too large (max 5MB)');
      if (fileInputRef.current) fileInputRef.current.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = async ({ target }) => {
      try {
        readString(target.result, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            const requiredColumns = ['name', 'regNo', 'gender', 'className', 'section', 'rollNo'];
            const hasAllColumns = requiredColumns.every(col =>
              results.meta.fields.includes(col)
            );

            if (!hasAllColumns) {
              setError(`CSV missing required columns. Required: ${requiredColumns.join(', ')}`);
              toast.error(`CSV missing required columns. Required: ${requiredColumns.join(', ')}`);
              if (fileInputRef.current) fileInputRef.current.value = null;
              return;
            }

            let parsed = results.data
              .map((row, index) => {
                const name = row.name?.toString().trim();
                const regNo = row.regNo?.toString().trim();
                const gender = row.gender?.toString().trim();
                const className = row.className?.toString().trim();
                const section = row.section?.toString().trim().toUpperCase();
                const rollNo = parseInt(row.rollNo);

                return {
                  name,
                  regNo,
                  gender,
                  className,
                  section,
                  rollNo,
                  rowNumber: index + 2,
                  isValid:
                    !!name && name.length >= 3 &&
                    !!regNo &&
                    !!gender && ['Male', 'Female'].includes(gender) &&
                    !!className &&
                    !!section &&
                    !isNaN(rollNo) && rollNo > 0
                };
              });

            const invalidRows = parsed.filter(row => !row.isValid);
            if (invalidRows.length > 0) {
              setError(
                `CSV contains ${invalidRows.length} invalid rows. ` +
                `First invalid row: #${invalidRows[0].rowNumber}`
              );
              toast.error(`CSV contains ${invalidRows.length} invalid rows`);
              if (fileInputRef.current) fileInputRef.current.value = null;
              return;
            }

            const existingRegNos = students.map(s => s.regNo);
            const regNosInCSV = parsed.map(s => s.regNo);
            const duplicateInCSV = regNosInCSV.filter((regNo, index) =>
              regNosInCSV.indexOf(regNo) !== index
            );

            if (duplicateInCSV.length > 0) {
              setError(`Duplicate registration numbers found in CSV: ${duplicateInCSV.join(', ')}`);
              toast.error(`Duplicate registration numbers found in CSV`);
              if (fileInputRef.current) fileInputRef.current.value = null;
              return;
            }

            const duplicates = parsed.filter(s => existingRegNos.includes(s.regNo));
            if (duplicates.length > 0) {
              setError(`Skipped ${duplicates.length} duplicate students (already exists)`);
              toast.warning(`Skipped ${duplicates.length} duplicate students`);
              parsed = parsed.filter(s => !existingRegNos.includes(s.regNo));

              if (parsed.length === 0) {
                if (fileInputRef.current) fileInputRef.current.value = null;
                return;
              }
            }

            const classSectionMap = {};
            classes.forEach(cls => {
              classSectionMap[cls.name] = cls.sections;
            });

            const batchSize = 500;
            const newStudents = [];
            let processed = 0;

            for (let i = 0; i < parsed.length; i += batchSize) {
              const batch = parsed.slice(i, i + batchSize);
              const batchPromises = batch.map(student =>
                addDoc(collection(firestore, 'students'), {
                  name: student.name,
                  regNo: student.regNo,
                  gender: student.gender,
                  className: student.className,
                  section: student.section,
                  rollNo: student.rollNo
                })
              );

              const batchResults = await Promise.all(batchPromises);
              batchResults.forEach((docRef, index) => {
                newStudents.push({
                  id: docRef.id,
                  ...batch[index]
                });
              });

              processed += batch.length;
              setUploadProgress(Math.round((processed / parsed.length) * 100));
            }

            setStudents(prev => [...prev, ...newStudents]);
            setSuccess(
              `Successfully imported ${parsed.length} students! ` +
              (duplicates.length > 0 ? `(${duplicates.length} duplicates skipped)` : '')
            );
            toast.success(`Imported ${parsed.length} students successfully`);
            setUploadProgress(0);
            setTimeout(() => setSuccess(''), 5000);
            if (fileInputRef.current) fileInputRef.current.value = null;
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            setError('Error parsing CSV file. Please check the format.');
            toast.error('Error parsing CSV file');
            if (fileInputRef.current) fileInputRef.current.value = null;
          }
        });
      } catch (err) {
        console.error('Error during CSV processing:', err);
        setError('An unexpected error occurred while processing the CSV file.');
        toast.error('Error processing CSV file');
        if (fileInputRef.current) fileInputRef.current.value = null;
      }
    };

    reader.readAsText(file);
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setEditFormData({
      name: student.name,
      regNo: student.regNo,
      gender: student.gender,
      className: student.className,
      section: student.section,
      rollNo: student.rollNo,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    const { name, regNo, gender, className, section, rollNo } = editFormData;

    if (!name.trim() || name.trim().length < 3) {
      setError('Name must be at least 3 characters.');
      toast.error('Name must be at least 3 characters.');
      return;
    }
    if (!regNo.trim()) {
      setError('Registration number is required.');
      toast.error('Registration number is required.');
      return;
    }
    if (!gender.trim()) {
      setError('Gender is required.');
      toast.error('Gender is required.');
      return;
    }
    if (!className.trim()) {
      setError('Class is required.');
      toast.error('Class is required.');
      return;
    }
    if (!section.trim()) {
      setError('Section is required.');
      toast.error('Section is required.');
      return;
    }
    if (!rollNo.trim() || isNaN(rollNo) || rollNo <= 0) {
      setError('Valid roll number is required.');
      toast.error('Valid roll number is required.');
      return;
    }

    try {
      const exists = students.some(s => s.regNo === regNo && s.id !== editingId);
      if (exists) {
        setError('Another student with this registration number already exists');
        toast.error('Registration number already exists');
        return;
      }

      const selectedClass = classes.find(c => c.name === className);
      if (!selectedClass || !selectedClass.sections.includes(section)) {
        setError(`Section ${section} is not available for ${className}`);
        toast.error(`Invalid section for ${className}`);
        return;
      }

      await updateDoc(doc(firestore, 'students', editingId), {
        name: name.trim(),
        regNo: regNo.trim(),
        gender: gender.trim(),
        className: className.trim(),
        section: section.trim(),
        rollNo: parseInt(rollNo)
      });

      setStudents(students.map(student =>
        student.id === editingId ? { ...student, ...editFormData, rollNo: parseInt(rollNo) } : student
      ));
      setSuccess('Student updated successfully!');
      toast.success('Student updated successfully!');
      setError('');
      setEditingId(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating student: ', err);
      setError('Failed to update student');
      toast.error('Failed to update student');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this student?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(firestore, 'students', id));
        setStudents(students.filter(student => student.id !== id));
        setSuccess('Student deleted successfully!');
        toast.success('Student deleted successfully!');
        setTimeout(() => setSuccess(''), 1000);
      } catch (err) {
        console.error('Error deleting student: ', err);
        setError('Failed to delete student');
        toast.error('Failed to delete student');
      }
    }
  };

  const generateSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "name,regNo,gender,className,section,rollNo\n" +
      "John Doe,REG001,Male,Class 1,A,1\n" +
      "Jane Smith,REG002,Female,Class 1,B,2\n" +
      "Bob Johnson,REG003,Male,Class 2,A,1";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_students.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Add Student Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-300 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Student</h2>

        {/* CSV Upload Section */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Bulk Import Students (CSV)
            </label>
            <button
              onClick={generateSampleCSV}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Download size={16} />
              Download Sample CSV
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex flex-col items-center justify-center gap-5 h-48 w-72 p-6 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-center text-gray-600">
                <Upload size={48} />
              </div>
              <div className="text-gray-600 font-normal">
                Select CSV File
              </div>
              <input
                type="file"
                className="hidden"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleCSVUpload}
              />
            </label>

            {fileInputRef.current?.files?.[0] && (
              <span className="text-sm text-gray-600">
                {fileInputRef.current.files[0].name}
              </span>
            )}
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <p className="text-xs text-gray-500 mt-1">
                Uploading: {uploadProgress}% complete
              </p>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
            CSV must include columns: name, regNo, gender, className, section, rollNo.
            Max file size: 5MB.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={student.name}
              onChange={handleChange}
              placeholder="Enter student name"
              className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Registration Number</label>
            <input
              type="text"
              name="regNo"
              value={student.regNo}
              onChange={handleChange}
              placeholder="Enter registration number"
              className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <div className="mt-1 flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={student.gender === 'Male'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Male</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={student.gender === 'Female'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Female</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Class</label>
            <select
              name="className"
              value={student.className}
              onChange={handleChange}
              className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            >
              <option value="">Select a class</option>
              {classes.sort((a, b) => a.name.localeCompare(b.name)).map(cls => (
                <option key={cls.name} value={cls.name}>{`class ${cls.name}`}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Section</label>
            <select
              name="section"
              value={student.section}
              onChange={handleChange}
              disabled={!student.className}
              className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              <option value="">Select a section</option>
              {availableSections.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Roll Number</label>
            <input
              type="number"
              name="rollNo"
              value={student.rollNo}
              onChange={handleChange}
              placeholder="Enter roll number"
              className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <button
            type="submit"
            className="w-full h-10 bg-[#3D4577] hover:bg-[#3d4577e5] text-white font-md rounded-lg transition-all duration-300"
          >
            Add Student
          </button>
        </form>
      </div>

      {/* Students List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 lg:mt-20">
        <div className="bg-gradient-to-r text-gray-700 rounded-t-lg px-6 py-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Students List ({filteredStudents.length})
          </h2>
        </div>
        <div className="p-6">
          {students.length > 0 ? (
            <>
              {/* Search and Filter Controls */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-auto sm:flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex lg:flex-wrap gap-2 items-center w-full sm:w-auto">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Filter className="w-4 h-4" />
                    <span>Filter:</span>
                  </div>

                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {uniqueClasses.sort((a, b) => b.localeCompare(a)).map((className) => (
                      <option key={className} value={className}>
                        {className === 'all' ? 'All Classes' : className}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-500"
                  >
                    {uniqueSections.sort().map((section) => (
                      <option key={section} value={section} className='bg-white'>
                        {section === 'all' ? 'All Sections' : section}
                      </option>
                    ))}
                  </select>

                  {(searchTerm || filterClass !== "all" || filterSection !== "all") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterClass("all");
                        setFilterSection("all");
                      }}
                      className="flex items-center gap-1 text-sm px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <FileX className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-[#3D4577]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-300 border-b">
                        <div className="flex items-center gap-1">
                          <Hash className="w-4 h-4" />
                          Reg No
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-300 border-b">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Name
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-300 border-b">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Gender
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-300 border-b">
                        <div className="flex items-center gap-1">
                          <BookOpenText className="w-4 h-4" />
                          Class
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-300 border-b">
                        <div className="flex items-center gap-1">
                          <Bookmark className="w-4 h-4" />
                          Section
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-300 border-b">
                        <div className="flex items-center gap-1">
                          <Hash className="w-4 h-4" />
                          Roll No
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-300 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredStudents.sort((a, b) => a.regNo.localeCompare(b.regNo)).map((student) => (
                      <tr key={student.id} className={`transition-colors border-b border-gray-100 ${editingId === student.id ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                        {editingId === student.id ? (
                          <>
                            <td className="px-4 py-3 text-gray-600">
                              <input
                                type="text"
                                name="regNo"
                                value={editFormData.regNo}
                                onChange={handleEditChange}
                                className="w-full p-1 border-gray-400 border rounded"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                name="name"
                                value={editFormData.name}
                                onChange={handleEditChange}
                                className="w-full p-1 border-gray-400 border rounded"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="gender"
                                    value="Male"
                                    checked={editFormData.gender === 'Male'}
                                    onChange={handleEditChange}
                                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Male</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="gender"
                                    value="Female"
                                    checked={editFormData.gender === 'Female'}
                                    onChange={handleEditChange}
                                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Female</span>
                                </label>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                name="className"
                                value={editFormData.className}
                                onChange={handleEditChange}
                                className="w-full p-1 border-gray-400 border rounded"
                              >
                                {classes.map(cls => (
                                  <option key={cls.name} value={cls.name}>{cls.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                name="section"
                                value={editFormData.section}
                                onChange={handleEditChange}
                                className="w-full p-1 border border-gray-400 rounded"
                              >
                                {classes.find(c => c.name === editFormData.className)?.sections.map(section => (
                                  <option key={section} value={section}>{section}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                name="rollNo"
                                value={editFormData.rollNo}
                                onChange={handleEditChange}
                                className="w-full p-1 border border-gray-400 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 flex gap-2">
                              <button
                                onClick={handleUpdate}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-gray-600">{student.regNo}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                {student.gender}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {student.className}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-purple-200 text-purple-700">
                                {student.section}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-gray-600">{student.rollNo}</td>
                            <td className="px-4 py-3 flex gap-2">
                              <button
                                onClick={() => handleEdit(student)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(student.id)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredStudents.length === 0 && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No students found matching your search criteria.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students added yet</h3>
              <p className="text-gray-500">Start by adding your first student using the form above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Students;