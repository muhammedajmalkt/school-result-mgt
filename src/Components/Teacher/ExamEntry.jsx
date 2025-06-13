import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, X, Loader2, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { firestore } from '../../Firebase/config';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const ExamEntry = () => {
  const { regNo } = useParams();
  const navigate = useNavigate();

  const [selectedExam, setSelectedExam] = useState('');
  const [availableExams, setAvailableExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [scores, setScores] = useState({});
  const [examResults, setExamResults] = useState([]);
  const [editingResultId, setEditingResultId] = useState(null);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rollNoError, setRollNoError] = useState('');

  // Validate rollNo
  // useEffect(() => {
  //   if (!rollNo || !/^[a-zA-Z0-9]{5,10}$/.test(rollNo)) {
  //     setRollNoError('Invalid registration number. It should be 5-10 alphanumeric characters.');
  //     setLoadingExams(false);
  //     setLoadingResults(false);
  //   }
  // }, [rollNo]);

  // Fetch exams and results

  useEffect(() => {
    if (rollNoError) return;

    const fetchExams = async () => {
      try {
        const examsSnapshot = await getDocs(collection(firestore, 'exams'));
        const examsData = examsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAvailableExams(examsData);
        setLoadingExams(false);
      } catch (err) {
        console.error('Error fetching exams:', err);
        toast.error('Failed to load exams');
        setError('Failed to load exams.');
        setLoadingExams(false);
      }
    };

    const fetchResults = async () => {
      try {
        const resultsQuery = query(
          collection(firestore, 'examMarks'),
          where('regNo', '==', regNo)
        );
        const resultsSnapshot = await getDocs(resultsQuery);
        const resultsData = resultsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date ? new Date( typeof doc.data().date === 'string' ? doc.data().date : doc.data().date.seconds * 1000
              ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : 'N/A',
        }));
        setExamResults(resultsData.sort((a, b) => new Date(b.date) - new Date(a.date)));
        setLoadingResults(false);
      } catch (err) {
        console.error('Error fetching results:', err);
        toast.error('Failed to load exam results');
        setError('Failed to load exam results.');
        setLoadingResults(false);
      }
    };

    fetchExams();
    fetchResults();
  }, [regNo, rollNoError]);

  useEffect(() => {
    if (selectedExam && !editingResultId) {
      const exam = availableExams.find((e) => e.id === selectedExam);
      if (exam) {
        setSubjects(exam.subjects || []);
        const initialScores = {};
        (exam.subjects || []).forEach((subject) => {
          initialScores[subject.name] = '';
        });
        setScores(initialScores);
      }
    } else if (!selectedExam) {
      setSubjects([]);
      setScores({});
    }
  }, [selectedExam, availableExams, editingResultId]);

  const handleScoreChange = (subjectName, value) => {
    if (value === '' || (/^\d*$/.test(value) && Number(value) <= 5)) {
      setScores((prev) => ({
        ...prev,
        [subjectName]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!selectedExam) {
      setError('Please select an exam');
      setSaving(false);
      return;
    }

    for (const subject of subjects) {
      const score = scores[subject.name];
      if (score === '' || score === undefined) {
        setError(`Please enter a score for ${subject.name}`);
        setSaving(false);
        return;
      }
      if ( score < 0 || score > 5) {
        setError(`Score for ${subject.name} must be between 0 and 5`);
        setSaving(false);
        return;
      }
    }

    try {
      const exam = availableExams.find((e) => e.id === selectedExam);
      if (!exam) {
        setError('Selected exam not found.');
        setSaving(false);
        return;
      }

      const markId = `${selectedExam}_${regNo}`;
      const examData = {
        examId: selectedExam,
        examName: exam.name,
        regNo: regNo,
        subjects: subjects.map((subject) => ({
          name: subject.name,
          score: Number(scores[subject.name]),
        })),
        date: new Date().toISOString(),
      };

      await setDoc(doc(firestore, 'examMarks', markId), examData, { merge: true });

      if (editingResultId) {
        setExamResults((prev) =>
          prev.map((result) =>
            result.id === markId
              ? { ...examData, id: markId, date: new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }) }
              : result
          )
        );
        setEditingResultId(null);
      } else {
        setExamResults((prev) => [
          { ...examData, id: markId, date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }) },
          ...prev,
        ]);
      }

      toast.success(`Exam scores ${editingResultId ? 'updated' : 'saved'} successfully!`);
      setSelectedExam('');
      setSubjects([]);
      setScores({});
    } catch (err) {
      console.error('Error saving exam scores:', err);
      setError('Failed to save exam scores. Please try again.');
      toast.error('Failed to save exam scores');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (result) => {
    setEditingResultId(result.id);
    setSelectedExam(result.examId);
    setSubjects(result.subjects);
    const editScores = {};
    result.subjects.forEach((subject) => {
      editScores[subject.name] = subject.score.toString();
    });
    setScores(editScores);
    document.getElementById('exam-form')?.scrollIntoView({ behavior: 'smooth' });
  };

const handleDelete = async (markId) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'Are you sure you want to delete these exam scores?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
  });

  if (result.isConfirmed) {
    try {
      await deleteDoc(doc(firestore, 'examMarks', markId));
      setExamResults((prev) => prev.filter((result) => result.id !== markId));
      toast.success('Exam scores deleted successfully');
    } catch (err) {
      console.error('Error deleting exam scores:', err);
      toast.error('Failed to delete exam scores');
    }
  }
};

  const handleCancelEdit = () => {
    setEditingResultId(null);
    setSelectedExam('');
    setSubjects([]);
    setScores({});
    setError('');
  };

  if (rollNoError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="p-6 bg-red-100 text-red-700 rounded-lg">
          {rollNoError}
          <button
            onClick={() => navigate('/teacher-dash')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="absolute w-full max-w-4xl mx-auto mt-18 p-6 bg-blue-50 backdrop-blur-md rounded-lg shadow-lg sm:relative "
    >
      <button
        onClick={() => navigate('/teacher-dash')}
        className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Enter Exam Scores for Reg No: <span className="text-blue-700">{regNo}</span>
      </h2>

      <div id="exam-form" className="mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Exam
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              disabled={editingResultId !== null || loadingExams}
              className="w-full p-2 rounded-md border border-gray-300 shadow-sm focus:ring-[#3D4577] focus:border-[#3D4577] text-sm disabled:opacity-50"
            >
              <option value="">-- Select an exam --</option>
              {loadingExams ? (
                <option disabled>Loading exams...</option>
              ) : (
                availableExams
                  .filter(
                    (exam) =>
                      !examResults.some((result) => result.examId === exam.id) ||
                      exam.id === editingResultId
                  )
                  .map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))
              )}
            </select>
          </div>

          {selectedExam && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Scores
              </label>
              <div className="space-y-3">
                {subjects.map((subject) => (
                  <div key={subject.name} className="grid grid-cols-12 gap-2 items-center">
                    <label className="col-span-5 sm:col-span-4 text-sm text-gray-700">
                      {subject.name}
                    </label>
                    <input
                      type="number"
                      value={scores[subject.name] || ''}
                      onChange={(e) => handleScoreChange(subject.name, e.target.value)}
                      placeholder="0-5"
                      min="0"
                      max="5"
                      className="col-span-5 sm:col-span-4 p-2 rounded-md border border-gray-300 text-sm focus:ring-[#3D4577] focus:border-[#3D4577]"
                    />
                    <span className="col-span-2 sm:col-span-1 text-sm text-gray-500">
                      /5
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!selectedExam || saving || loadingExams}
              className={`flex-1 h-10 bg-[#3D4577] text-white font-semibold rounded-md shadow-md hover:bg-[#3d4577d7] transition flex items-center justify-center gap-2 ${
                !selectedExam || saving || loadingExams ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" /> {editingResultId ? 'Update Scores' : 'Save Scores'}
                </>
              )}
            </button>
            {editingResultId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 h-10 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Exam Results</h2>
          {loadingResults ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            </div>
          ) : examResults.length === 0 ? (
            <p className="text-gray-500">No exam results recorded for this student.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left font-semibold text-gray-700 border-b">Exam Name</th>
                    <th className="p-3 text-left font-semibold text-gray-700 border-b">Subjects & Scores</th>
                    <th className="p-3 text-left font-semibold text-gray-700 border-b">Date</th>
                    <th className="p-3 text-left font-semibold text-gray-700 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {examResults.map((result) => (
                    <tr key={result.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{result.examName}</td>
                      <td className="p-3">
                        <ul className="list-disc sm:list-outside sm:pl-8">
                          {result.subjects.map((subject, index) => (
                            <li key={index} className="sm:pl-2">
                              {subject.name}: {subject.score}/5
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3 text-gray-500">{result.date}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(result)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(result.id)}
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
    </motion.div>
  );
};

export default ExamEntry;