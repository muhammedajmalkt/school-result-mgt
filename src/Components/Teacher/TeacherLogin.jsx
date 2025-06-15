import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../../Firebase/config' 

const TeacherLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      setError('Valid email is required.')
      setLoading(false);
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      // Sign in
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // Fetch user data
      const userDocRef = doc(firestore, 'teachers', user.uid); 
      const userDoc = await getDoc(userDocRef);
      
      console.log(userDoc.exists());
      if (!userDoc.exists()) {
        setError('Teacher account not found. Please contact support or sign up.');
        await signOut(auth);
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      if (userData.role !== 'teacher') {
        setError('Access denied. You are not a teacher.');
        await signOut(auth);
        setLoading(false);
        return;
      }

      setSuccess('Login successful!');
      setTimeout(() => {
        navigate('/teacher-dash', { state: { userData } });
      }, 1000);
    } catch (err) {
      console.error('Login error:', err);
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No teacher found with this email.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password.');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Account temporarily locked.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled.');
          break;
        default:
          setError('Failed to login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col lg:flex-row items-center justify-center">
      <div className="bg-[#93478E] lg:w-3/4 lg:h-screen hidden lg:flex">
        <img
          className="p-32 object-contain h-full w-full"
          alt="teacher illustration"
          src="/teacherr.png"
        />
      </div>
      <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-[#93478E] mb-2">
            Teacher Login
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">Access your teaching dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@example.com"
              className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-sm"
              required
              minLength="6"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full h-10 bg-[#93478E] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg text-sm sm:text-base ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeacherLogin;