import './App.css';
import Home from './Components/Home/Home';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Result from './Components/Home/Result';
import Context from './Components/Context/Context';
import AddExams from './Components/Admin/AddExam';
import Teachers from './Components/Admin/Teachers';
import Students from './Components/Admin/Students';
import ClassSectionManagement from './Components/Admin/ClassSectionMgt';
import AdminLogin from './Components/Admin/AdminLogin';
import TeacherLogin from './Components/Teacher/TeacherLogin';
import TeacherDashboard from './Components/Teacher/TeacherDashboard';
import ExamEntry from './Components/Teacher/ExamEntry';
import Dashboard from './Components/Admin/Dashboard';
import AdminLayout from './Components/Admin/AdminLayout';
import { Toaster } from 'sonner';
import NotFound from './Components/NotFound/NotFound';
import ProtectedRoute from './Components/ProtectedRoute';

function App() {
  return (
    <>
      <Context>
        <Toaster position="top-right" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/result" element={<Result />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/teacher" element={<TeacherLogin />} />
            
            <Route path="/admin/dashboard" element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="add-exam" element={<AddExams />} />
              <Route path="add-teacher" element={<Teachers />} />
              <Route path="add-students" element={<Students />} />
              <Route path="class-section" element={<ClassSectionManagement />} />
            </Route>
            
            {/* Fixed: Separate routes for teacher dashboard and exam entry */}
            <Route path="/teacher-dash" element={
              <ProtectedRoute role="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/teacher-dash/exam-entry/:regNo" element={
              <ProtectedRoute role="teacher">
                <ExamEntry />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </Context>
    </>
  );
}

export default App;