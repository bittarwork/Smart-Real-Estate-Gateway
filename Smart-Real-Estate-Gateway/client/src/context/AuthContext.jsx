import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

// إنشاء السياق
const AuthContext = createContext();

// حالات المصادقة
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    default:
      return state;
  }
};

// الحالة الأولية
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

// مزود السياق
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // التحقق من الرمز المميز عند بدء التطبيق
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // تعيين الرمز المميز في headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // التحقق من صحة الرمز المميز
          const response = await api.get('/auth/me');
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.data.user,
              token
            }
          });
        } catch (error) {
          console.error('خطأ في التحقق من المصادقة:', error);
          // إزالة الرمز المميز غير الصحيح
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  // تسجيل الدخول
  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { user, token } = response.data.data;

      // حفظ الرمز المميز
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });

      toast.success(`مرحباً ${user.name}! تم تسجيل الدخول بنجاح`);
      return { success: true, user };

    } catch (error) {
      const message = error.response?.data?.message || 'خطأ في تسجيل الدخول';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // تسجيل حساب جديد
  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data.data;

      // حفظ الرمز المميز
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });

      toast.success('تم إنشاء الحساب بنجاح! مرحباً بك');
      return { success: true, user };

    } catch (error) {
      const message = error.response?.data?.message || 'خطأ في إنشاء الحساب';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // تسجيل الخروج
  const logout = async () => {
    try {
      // إرسال طلب تسجيل الخروج للخادم
      await api.post('/auth/logout');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    } finally {
      // إزالة البيانات المحلية
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      dispatch({ type: 'LOGOUT' });
      toast.success('تم تسجيل الخروج بنجاح');
    }
  };

  // تحديث الملف الشخصي
  const updateProfile = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await api.put('/auth/profile', userData);
      const updatedUser = response.data.data.user;

      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser
      });

      toast.success('تم تحديث الملف الشخصي بنجاح');
      return { success: true, user: updatedUser };

    } catch (error) {
      const message = error.response?.data?.message || 'خطأ في تحديث الملف الشخصي';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // تغيير كلمة المرور
  const changePassword = async (passwordData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await api.put('/auth/change-password', passwordData);

      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('تم تغيير كلمة المرور بنجاح');
      return { success: true };

    } catch (error) {
      const message = error.response?.data?.message || 'خطأ في تغيير كلمة المرور';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // التحقق من صلاحيات المشرف
  const isAdmin = () => {
    return state.user?.role === 'admin';
  };

  // التحقق من حالة المستخدم النشط
  const isActiveUser = () => {
    return state.user?.status === 'active';
  };

  // قيم السياق
  const value = {
    // الحالة
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    
    // الوظائف
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    
    // المساعدات
    isAdmin,
    isActiveUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook لاستخدام السياق
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth يجب استخدامه داخل AuthProvider');
  }
  return context;
};

export default AuthContext;