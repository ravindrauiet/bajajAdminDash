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
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  updatePassword, 
  updateEmail, 
  getAuth, 
  signInWithEmailAndPassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential 
} from 'firebase/auth';
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
    
    // Get current user data to compare changes
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      console.error('❌ User document not found');
      return { success: false, error: 'User not found' };
    }
    
    const currentUserData = userSnap.data();
    const updatedData = { ...userData, updatedAt: serverTimestamp() };
    
    // Remove sensitive fields from Firestore update
    const { password, ...firestoreData } = updatedData;
    
    // Track operations
    const operations = [];
    
    // Handle password update if provided
    if (password && password.trim() !== '') {
      try {
        console.log('🔑 Password update requested for user:', userId);
        // In a real admin scenario, this would be handled by Firebase Admin SDK
        // on a secure server. For this frontend implementation, we'll just
        // update the Firestore document and note the limitation.
        operations.push({
          type: 'password',
          success: false,
          message: 'Password updates for other users require Firebase Admin SDK on a backend server'
        });
      } catch (passwordError) {
        console.error('❌ Error with password update:', passwordError);
        operations.push({
          type: 'password',
          success: false,
          error: passwordError.message
        });
      }
    }
    
    // Handle identity document updates
    if (firestoreData.aadharCard !== currentUserData.aadharCard) {
      console.log('📋 Aadhar card update detected');
      operations.push({
        type: 'aadharCard',
        success: true,
        message: 'Aadhar card information updated'
      });
    }
    
    if (firestoreData.panCard !== currentUserData.panCard) {
      console.log('📋 PAN card update detected');
      operations.push({
        type: 'panCard',
        success: true,
        message: 'PAN card information updated'
      });
    }
    
    // Update Firestore document
    await updateDoc(userRef, firestoreData);
    console.log('✅ User data updated in Firestore');
    operations.push({
      type: 'firestoreData',
      success: true,
      message: 'User profile data updated successfully'
    });
    
    // Prepare response
    const hasWarnings = operations.some(op => !op.success);
    
    return { 
      success: true, 
      operations,
      warnings: hasWarnings ? operations.filter(op => !op.success).map(op => op.message || op.error) : null
    };
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

// Sub-admin management functions
export const assignUserToSubAdmin = async (userId, subAdminId) => {
  try {
    console.log('📝 Assigning user to sub-admin:', { userId, subAdminId });
    const userRef = doc(db, 'users', userId);
    
    // Update user document with assigned sub-admin
    await updateDoc(userRef, {
      assignedTo: subAdminId,
      updatedAt: serverTimestamp()
    });
    
    // Log this assignment action
    const assignmentLogRef = collection(db, 'assignmentLogs');
    await addDoc(assignmentLogRef, {
      userId,
      subAdminId,
      assignedBy: auth.currentUser.uid,
      assignedAt: serverTimestamp()
    });
    
    console.log('✅ User assigned to sub-admin successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error assigning user to sub-admin:', error);
    return { success: false, error: error.message };
  }
};

export const unassignUserFromSubAdmin = async (userId) => {
  try {
    console.log('🔄 Unassigning user from sub-admin:', userId);
    const userRef = doc(db, 'users', userId);
    
    // Remove sub-admin assignment
    await updateDoc(userRef, {
      assignedTo: null,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ User unassigned successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error unassigning user:', error);
    return { success: false, error: error.message };
  }
};

export const getSubAdmins = async () => {
  try {
    console.log('🔍 Fetching all sub-admins');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'subAdmin'));
    const querySnapshot = await getDocs(q);
    
    const subAdmins = [];
    querySnapshot.forEach((doc) => {
      subAdmins.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`📊 Found ${subAdmins.length} sub-admins`);
    return { success: true, subAdmins };
  } catch (error) {
    console.error('❌ Error fetching sub-admins:', error);
    return { success: false, error: error.message };
  }
};

export const getUsersBySubAdmin = async (subAdminId) => {
  try {
    console.log('🔍 Fetching users assigned to sub-admin:', subAdminId);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('assignedTo', '==', subAdminId));
    const querySnapshot = await getDocs(q);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`📊 Found ${users.length} users assigned to sub-admin`);
    return { success: true, users };
  } catch (error) {
    console.error('❌ Error fetching users by sub-admin:', error);
    return { success: false, error: error.message };
  }
};

// Alias for updateUserData to maintain compatibility
export const updateUser = updateUserData; 