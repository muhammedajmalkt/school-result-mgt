import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { auth, firestore } from '../../Firebase/config'

const handleLogout = async (setTeacherAuthenticated, navigate) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      Swal.fire({
        title: 'Error!',
        text: 'No user is currently logged in.',
        icon: 'error',
        confirmButtonColor: '#d33',
      });
      return;
    }

    // Verify the user is a teacher
    const teacherDocRef = doc(firestore, 'teachers', user.uid);
    const teacherDoc = await getDoc(teacherDocRef);

    if (!teacherDoc.exists() || teacherDoc.data().role !== 'teacher') {
      Swal.fire({
        title: 'Error!',
        text: 'You are not authorized to log out as a teacher.',
        icon: 'error',
        confirmButtonColor: '#d33',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Logout Confirmation',
      text: 'Are you sure you want to log out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      await signOut(auth);
      setTeacherAuthenticated(false);
      navigate('/teacher');
    }
  } catch (error) {
    console.error('Error logging out:', error);
    Swal.fire({
      title: 'Logout Failed',
      text: `Failed to log out: ${error.message || 'Please try again.'}`,
      icon: 'error',
      confirmButtonColor: '#d33',
    });
  }
};

export default handleLogout;