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
import { db } from './config';

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
    
    // Remove password if it exists (password updates should be handled separately)
    if (updateData.password) {
      delete updateData.password;
    }
    
    await updateDoc(userRef, updateData);
    console.log('✅ User details updated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating user details:', error);
    return { success: false, error: error.message };
  }
}; 