import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../../Firebase/config';
import { toast } from 'sonner';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!email.trim()) {
      setError('Email is required.');
      setLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    if (!password.trim()) {
      setError('Password is required.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verify admin role in Firestore
      const adminDocRef = doc(firestore, 'admin', user.uid);
      const adminDoc = await getDoc(adminDocRef);

      console.log('User UID:', user.uid);
      console.log('Admin Doc Exists:', adminDoc.exists());

      if (adminDoc.exists()) {
        console.log('Admin Doc Data:', adminDoc.data());
        console.log('Role:', adminDoc.data().role);
      }

      if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
        
        await auth.signOut();
        setError('You are not authorized to log in as an admin.');
        toast.error('Access denied. Not an admin account.');
        setLoading(false);
        return;
      }

      setSuccess('Login successful!');
      toast.success('Welcome, Admin!');
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      console.error('Login error:', error);
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email format.');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later.');
          break;
        default:
          setError('Failed to login. Please try again.');
      }
      toast.error(error.message || 'Login failed.');
      toast.error(error.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row lg:justify-center lg:p-16 p-8">
      {/* Left Side - Image */}
      <div className="w-full lg:w-1/2 h-72 lg:h-auto relative">
        <img
          src="/admin.jpg"
          alt="Students"
          className="absolute inset-0 w-full h-full object-cover p-14"
        />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center">
        <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md animate-in slide-in-from-right duration-500 h-fit">
          <div className="text-center mb-8">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Admin Login
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm">
              Access the school management dashboard
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-sm"
                disabled={loading}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
            <button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg text-sm sm:text-base disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Back to{' '}
            Back to{' '}
            <Link to="/" className="text-blue-600 hover:underline">
              Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;