import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserByEmail, createOrUpdateUser } from './firestoreApi';
import { serverTimestamp } from 'firebase/firestore';

// Admin credentials (for demo purposes - should use environment variables in production)
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = '123456';

// Sample sub-admin emails (for demo purposes)
const SUB_ADMIN_EMAILS = ['mayank@gmail.com', 'rahul@gmail.com'];

export const loginWithEmailAndPassword = async (email, password) => {
  try {
    console.log('🔑 Attempting login with:', { email });
    
    // First authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Firebase authentication successful');
    
    // Get user data from Firestore
    const { success, user: userData, error } = await getUserByEmail(email);
    
    if (success) {
      console.log('📊 User data from Firestore:', userData);
      
      // Check user role
      const isSuperAdmin = email === ADMIN_EMAIL || userData?.isSuperAdmin === true;
      const isSubAdmin = SUB_ADMIN_EMAILS.includes(email) || userData?.role === 'subAdmin';
      const isAdmin = isSuperAdmin || isSubAdmin;
      
      if (isAdmin) {
        console.log('👑 Admin user verified:', { isSuperAdmin, isSubAdmin });
        
        // Ensure user has a complete profile in Firestore with proper role
        const userRole = isSuperAdmin ? 'admin' : 'subAdmin';
        await createOrUpdateUser(userCredential.user.uid, {
          email: userCredential.user.email,
          displayName: userData?.displayName || email.split('@')[0],
          isAdmin: true,
          isSuperAdmin: isSuperAdmin,
          role: userRole,
          createdAt: userData?.createdAt || serverTimestamp(),
          lastLogin: serverTimestamp()
        });
        
        return {
          success: true,
          user: {
            ...userCredential.user,
            isAdmin: true
          }
        };
      } else {
        console.log('❌ Non-admin user');
        // Sign out if not admin
        await firebaseSignOut(auth);
        return {
          success: false,
          error: 'Only admin access is allowed'
        };
      }
    } else {
      console.error('❌ Error fetching user data:', error);
      // Sign out if can't get user data
      await firebaseSignOut(auth);
      return {
        success: false,
        error: 'Error verifying user data'
      };
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const logout = async () => {
  try {
    console.log('🚪 Attempting logout');
    await firebaseSignOut(auth);
    console.log('✅ Logout successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const onAuthStateChange = (callback) => {
  console.log('👀 Setting up auth state listener');
  return onAuthStateChanged(auth, async (user) => {
    console.log('🔄 Auth state changed:', { 
      isAuthenticated: !!user,
      email: user?.email 
    });
    
    if (user) {
      // Get user data from Firestore
      const { success, user: userData } = await getUserByEmail(user.email);
      console.log('📊 User data from Firestore:', { success, userData });
      
      // Check user role
      const isSuperAdmin = user.email === ADMIN_EMAIL || userData?.isSuperAdmin === true;
      const isSubAdmin = SUB_ADMIN_EMAILS.includes(user.email) || userData?.role === 'subAdmin';
      const isAdmin = isSuperAdmin || isSubAdmin;
      
      callback({
        currentUser: user,
        isAdmin,
        userData: {
          ...userData,
          isSuperAdmin,
          role: isSuperAdmin ? 'admin' : (isSubAdmin ? 'subAdmin' : 'user')
        }
      });
    } else {
      callback({
        currentUser: null,
        isAdmin: false,
        userData: null
      });
    }
  });
}; 