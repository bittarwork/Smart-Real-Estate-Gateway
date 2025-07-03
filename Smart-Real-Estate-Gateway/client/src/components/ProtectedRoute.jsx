import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // عرض شاشة التحميل أثناء فحص المصادقة
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // إذا لم يكن المستخدم مسجل دخول
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/admin/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // التحقق من الدور المطلوب
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // التحقق من حالة المستخدم
  if (user?.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-warning-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">الحساب غير مفعل</h3>
            <p className="text-gray-600 mb-4">
              حسابك غير مفعل حالياً. يرجى التواصل مع الإدارة لتفعيل حسابك.
            </p>
            <button
              onClick={() => window.location.href = '/admin/login'}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  // إذا تم تمرير جميع الفحوصات، عرض المحتوى
  return children;
};

export default ProtectedRoute;