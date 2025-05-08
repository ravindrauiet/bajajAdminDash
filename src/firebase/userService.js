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
    
    // Validate government ID formats if provided
    const validationErrors = [];
    
    // Validate Aadhar card (should be 12 digits)
    if (userData.aadharCard && userData.aadharCard.trim() !== '') {
      const aadharPattern = /^\d{12}$/;
      if (!aadharPattern.test(userData.aadharCard.replace(/\s/g, ''))) {
        validationErrors.push('Aadhar card should be 12 digits');
      }
    }
    
    // Validate PAN card (should be 10 alphanumeric characters in specific format)
    if (userData.panCard && userData.panCard.trim() !== '') {
      const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panPattern.test(userData.panCard.replace(/\s/g, ''))) {
        validationErrors.push('PAN card should be in format ABCDE1234F (5 letters, 4 digits, 1 letter)');
      }
    }
    
    // Return validation errors if any
    if (validationErrors.length > 0) {
      console.error('❌ Validation errors:', validationErrors);
      return { 
        success: false, 
        error: 'Validation failed', 
        validationErrors 
      };
    }
    
    // Prepare data for update
    const updateData = {
      ...userData,
      updatedAt: serverTimestamp()
    };
    
    // Set proper isAdmin flag based on role
    if (userData.role) {
      updateData.isAdmin = userData.role === 'admin';
    }
    
    // Use enhanced API from firestoreApi
    const result = await import('../api/firestoreApi').then(module => 
      module.updateUserData(userId, updateData)
    );
    
    // Pass through the result
    if (result.success) {
      console.log('✅ User details updated successfully');
      // Check for warnings
      if (result.warnings && result.warnings.length > 0) {
        return { 
          success: true,
          warnings: result.warnings 
        };
      }
      return { success: true };
    } else {
      console.error('❌ Error updating user details:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error in updateUser:', error);
    return { success: false, error: error.message };
  }
}; 