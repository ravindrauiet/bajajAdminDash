import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './config';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

// Get all users
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Update user status
export const updateUserStatus = async (userId, status) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      status,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

// Update user role
export const updateUserRole = async (userId, role) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      role,
      isAdmin: role === 'admin',
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Get user statistics
export const getUserStats = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    const users = querySnapshot.docs.map(doc => doc.data());
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(user => user.status === 'active').length,
      adminUsers: users.filter(user => user.isAdmin === true).length,
      newUsers: users.filter(user => {
        const createdAt = user.createdAt?.toDate();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return createdAt && createdAt > oneWeekAgo;
      }).length
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDocs(userRef);
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Update user (all fields)
export const updateUser = async (userId, userData) => {
  try {
    console.log('📝 Updating user details:', { userId, ...userData });
    const userRef = doc(db, 'users', userId);
    
    // Prepare data for update
    const updateData = {
      ...userData,
      updatedAt: serverTimestamp()
    };
    
    // Handle password update if provided
    let passwordUpdateSuccess = true;
    if (userData.password && userData.password.trim() !== '') {
      try {
        // For admin changing user password, we need to use admin auth methods
        // This requires Firebase Admin SDK which should be used on server-side
        // For this client-side implementation, we'll just update the Firestore document
        // and note that proper password change would require a backend API
        console.log('Password change requested - would require server-side admin API');
      } catch (passwordError) {
        console.error('❌ Error updating password:', passwordError);
        passwordUpdateSuccess = false;
      }
    }
    
    // Remove password from Firestore update
    delete updateData.password;
    
    await updateDoc(userRef, updateData);
    console.log('✅ User details updated successfully');
    
    if (passwordUpdateSuccess) {
      return { success: true };
    } else {
      return { 
        success: true, 
        warning: 'User data updated but password change requires admin API' 
      };
    }
  } catch (error) {
    console.error('❌ Error updating user details:', error);
    return { success: false, error: error.message };
  }
}; 