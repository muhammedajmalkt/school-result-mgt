import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../../Firebase/config'; // Adjust the path as needed

export const Mycontext = createContext();

const Context = ({ children }) => {
  const [result, setResult] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("result")) || null;
    } catch (error) {
      console.error('Error parsing sessionStorage result:', error);
      return null;
    }
  });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user is admin
          const adminDocRef = doc(firestore, 'admin', firebaseUser.uid);
          const adminDoc = await getDoc(adminDocRef);
          
          if (adminDoc.exists() && adminDoc.data().role === 'admin') {
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'admin',
              loginTime: new Date().toISOString()
            };
            
            setUser(userData);
            sessionStorage.setItem('user', JSON.stringify(userData));
          } else {
            // Not an admin, clear everything
            setUser(null);
            // setResult(null);
            sessionStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setUser(null);
          setResult(null);
          sessionStorage.removeItem('user');
        }
      } else {
        // User is not authenticated
        setUser(null);
        setResult(null);
        sessionStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update sessionStorage when result changes
  // useEffect(() => {
  //   if (result) {
  //     sessionStorage.setItem('result', JSON.stringify(result));
  //   } else {
  //     sessionStorage.removeItem('result');
  //   }
  // }, [result]);

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setResult(null);
      sessionStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Mycontext.Provider value={{ 
      result, 
      setResult, 
      user, 
      setUser, 
      loading, 
      logout 
    }}>
      {children}
    </Mycontext.Provider>
  );
};

export default Context;