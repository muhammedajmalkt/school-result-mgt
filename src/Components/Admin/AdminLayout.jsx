import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Book, UserPlus, Users, Layers, LogOut, LayoutDashboard } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../Firebase/config';
import Swal from 'sweetalert2';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminAuthenticated, setAdminAuthenticated] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (admin) => {
      if (admin) {
        setAdminAuthenticated(true);
      } else {
        setAdminAuthenticated(false);
        navigate('/admin'); 
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const menuItems = [
    { name: 'Dashboard', path: '', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Add Exams', path: 'add-exam', icon: <Book className="w-5 h-5" /> },
    { name: 'Add Teacher', path: 'add-teacher', icon: <UserPlus className="w-5 h-5" /> },
    { name: 'Add Students', path: 'add-students', icon: <Users className="w-5 h-5" /> },
    { name: 'Class & Section', path: 'class-section', icon: <Layers className="w-5 h-5" /> },
  ];


const handleLogout = async () => {
  try {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out from the admin panel.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!'
    });

    if (result.isConfirmed) {
      await signOut(auth);
      setAdminAuthenticated(false);
   Swal.fire({ title: 'Logged Out!', text: 'You have been successfully logged out.', icon: 'success', timer:2000})
      .then(() => { navigate('/admin'); }); }
  } catch (error) {
    Swal.fire( 'Error!', `Logout failed: ${error.message}`, 'error' );
    console.error('Logout failed:', error.message);
  }
};


  // Render nothing while authentication state is being determined
  // if (isAdminAuthenticated === null) {
  //   return null;
  // }

  if (!isAdminAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FEFFFE]">
      {/* Header */}
      <header className="bg-[#FEFFFE] p-4 flex items-center justify-between border-b border-gray-300 fixed w-full z-10 top-0">
        <button onClick={toggleSidebar} className="lg:hidden">
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold md:text-2xl text-gray-700">
          School Management
        </h1>
        <button
          onClick={() => navigate("/")}
          className="text-gray-700 px-4 py-2 rounded-lg border border-gray-300 transition"
        >
          Back to Home
        </button>
      </header>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 top-[74px] bg-gray-50 text-gray-100 shadow-lg transform border-gray-300 border-t border-r ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between lg:hidden">
          <button onClick={toggleSidebar}>
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 flex flex-col justify-between text-sm font-medium text-black/90">
          <div className="mt-4">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                onClick={() => setIsSidebarOpen(false)}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="mb-4">
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Render nested child components */}
      <div className="ml-0 lg:ml-64 lg:p-10 lg:pt-28 pt-28  p-5 ">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;