import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../Firebase/config';

const ProtectedRoute = ({ children, role }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      
      if (user) {
        try {
          const collectionName = role === 'teacher' ? 'teachers' : 'admin'; 
          const docRef = doc(firestore, collectionName, user.uid);
          const docSnap = await getDoc(docRef);
          
          console.log(`Checking ${role} role for user:`, user.uid);
          console.log(`Document exists:`, docSnap.exists());
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log(`User data:`, userData);
            console.log(`User role:`, userData.role);
            
            // Check if the user has the correct role
            const hasCorrectRole = userData.role === role;
            setIsAuthenticated(hasCorrectRole);
            
            if (hasCorrectRole) {
              // Store user data in sessionStorage for the Context
              const userInfo = {
                uid: user.uid,
                email: user.email,
                role: userData.role,
                loginTime: new Date().toISOString()
              };
              sessionStorage.setItem('user', JSON.stringify(userInfo));
            }
          } else {
            console.log(`No ${role} document found for user:`, user.uid);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error(`Error verifying ${role} role:`, error);
          setIsAuthenticated(false);
        }
      } else {
        console.log('No user authenticated');
        setIsAuthenticated(false);
        sessionStorage.removeItem('user');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  // Show loading spinner while checking authentication
  if (loading || isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 text-sm">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const loginPath = role === 'teacher' ? '/teacher' : '/admin';
    return <Navigate to={loginPath} replace />;
  }

  // User is authenticated and has correct role
  return children;
};

export default ProtectedRoute;