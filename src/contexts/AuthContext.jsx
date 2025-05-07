import { createContext, useContext, useState, useEffect } from 'react';
import { loginWithEmailAndPassword, logout, onAuthStateChange } from '../api/firebaseAuth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('🔄 Setting up auth state listener');
    const unsubscribe = onAuthStateChange(({ currentUser, isAdmin, userData }) => {
      console.log('📊 Auth state updated:', { 
        isAuthenticated: !!currentUser,
        isAdmin,
        hasUserData: !!userData
      });
      
      setCurrentUser(currentUser);
      setUserData(userData);
      setIsAdmin(isAdmin);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    console.log('🔑 Login attempt in AuthContext');
    try {
      setError('');
      setLoading(true);
      
      const { success, user, error } = await loginWithEmailAndPassword(email, password);
      
      if (success) {
        console.log('✅ Login successful in AuthContext');
        setCurrentUser(user);
        setIsAdmin(true);
        return { success: true };
      } else {
        console.error('❌ Login failed in AuthContext:', error);
        setError(error);
        return { success: false, error };
      }
    } catch (error) {
      console.error('❌ Unexpected error in AuthContext login:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    console.log('🚪 Logout attempt in AuthContext');
    try {
      const { success, error } = await logout();
      if (success) {
        console.log('✅ Logout successful in AuthContext');
        setCurrentUser(null);
        setUserData(null);
        setIsAdmin(false);
      } else {
        console.error('❌ Logout failed in AuthContext:', error);
        setError(error);
      }
      return { success, error };
    } catch (error) {
      console.error('❌ Unexpected error in AuthContext logout:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const value = {
    currentUser,
    userData,
    isAdmin,
    loading,
    error,
    login,
    logout: logoutUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 