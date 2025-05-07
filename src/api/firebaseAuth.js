import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserByEmail, createOrUpdateUser } from './firestoreApi';
import { serverTimestamp } from 'firebase/firestore';

// Admin credentials
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = '123456';

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
      
      // Check if user is admin
      const isAdmin = userData?.isAdmin || email === ADMIN_EMAIL;
      
      if (isAdmin) {
        console.log('👑 Admin user verified');
        
        // Ensure admin user has a complete profile in Firestore
        await createOrUpdateUser(userCredential.user.uid, {
          email: userCredential.user.email,
          displayName: 'Admin User',
          isAdmin: true,
          role: 'admin',
          createdAt: serverTimestamp(),
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
      console.log('📊 User data from Firestore:', { success, isAdmin: userData?.isAdmin });
      
      // Check if user is admin
      const isAdmin = userData?.isAdmin || user.email === ADMIN_EMAIL;
      
      callback({
        currentUser: user,
        isAdmin,
        userData: userData || null
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