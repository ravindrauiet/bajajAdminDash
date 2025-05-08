import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { updatePassword } from 'firebase/auth';
import { auth } from '../firebase/config';

// User Management Functions
export const createOrUpdateUser = async (userId, userData) => {
  try {
    console.log('📝 Creating/Updating user:', { userId, ...userData });
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('✅ User document created/updated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error creating/updating user:', error);
    return { success: false, error: error.message };
  }
};

export const getUserData = async (userId) => {
  try {
    console.log('🔍 Fetching user data for:', userId);
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log('✅ User data found');
      return { 
        success: true, 
        user: { id: userSnap.id, ...userSnap.data() } 
      };
    } else {
      console.log('❌ User document does not exist');
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async (filters = {}) => {
  try {
    console.log('🔍 Fetching all users with filters:', filters);
    const usersRef = collection(db, 'users');
    let q = usersRef;

    // Apply filters if provided
    if (filters.email) {
      q = query(usersRef, where('email', '==', filters.email));
    }

    const querySnapshot = await getDocs(q);
    console.log(`📊 Found ${querySnapshot.size} users`);

    const users = [];
    querySnapshot.forEach((doc) => {
      console.log('📄 User document:', { id: doc.id, ...doc.data() });
      users.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, users };
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserData = async (userId, userData) => {
  try {
    console.log('📝 Updating user:', { userId, ...userData });
    const userRef = doc(db, 'users', userId);
    const updatedData = { ...userData, updatedAt: serverTimestamp() };
    delete updatedData.password; // Remove password from Firestore update
    await updateDoc(userRef, updatedData);

    // If password is provided, update it in Firebase Auth
    if (userData.password) {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, userData.password);
        console.log('✅ User password updated successfully');
      }
    }

    console.log('✅ User updated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating user:', error);
    return { success: false, error: error.message };
  }
};

export const deleteUserData = async (userId) => {
  try {
    console.log('🗑️ Deleting user:', userId);
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    console.log('✅ User deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return { success: false, error: error.message };
  }
};

export const getUserByEmail = async (email) => {
  try {
    console.log('🔍 Fetching user by email:', email);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      console.log('✅ User found:', { id: userDoc.id, ...userDoc.data() });
      return { 
        success: true, 
        user: { id: userDoc.id, ...userDoc.data() } 
      };
    } else {
      console.log('❌ No user found with email:', email);
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('❌ Error fetching user by email:', error);
    return { success: false, error: error.message };
  }
}; 