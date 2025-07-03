import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// مكونات العامة
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';

// صفحات العميل
import ClientLayout from './components/layout/ClientLayout';
import Home from './pages/client/Home';
import Properties from './pages/client/Properties';
import PropertyDetail from './pages/client/PropertyDetail';
import About from './pages/client/About';
import Contact from './pages/client/Contact';

// صفحات الإدارة
import AdminLayout from './components/admin/layout/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import PropertyManagement from './pages/admin/PropertyManagement';
import PropertyForm from './pages/admin/PropertyForm';
import InquiryManagement from './pages/admin/InquiryManagement';
import AppointmentManagement from './pages/admin/AppointmentManagement';
import UserManagement from './pages/admin/UserManagement';

// صفحة عدم التصريح
import Unauthorized from './pages/Unauthorized';

function App() {
  const { loading, isAuthenticated, isAdmin } = useAuth();

  // عرض شاشة التحميل أثناء التحقق من المصادقة
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* المسارات العامة للعملاء */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<Home />} />
          <Route path="properties" element={<Properties />} />
          <Route path="properties/:id" element={<PropertyDetail />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
        </Route>

        {/* مسار تسجيل الدخول للإدارة */}
        <Route 
          path="/admin/login" 
          element={
            isAuthenticated && isAdmin() ? 
              <Navigate to="/admin" replace /> : 
              <AdminLogin />
          } 
        />

        {/* مسارات الإدارة المحمية */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          {/* إعادة توجيه من /admin إلى /admin/properties */}
          <Route index element={<Navigate to="properties" replace />} />
          
          {/* إدارة العقارات */}
          <Route path="properties" element={<PropertyManagement />} />
          <Route path="properties/new" element={<PropertyForm />} />
          <Route path="properties/edit/:id" element={<PropertyForm />} />
          
          {/* إدارة الاستفسارات */}
          <Route path="inquiries" element={<InquiryManagement />} />
          
          {/* إدارة المواعيد */}
          <Route path="appointments" element={<AppointmentManagement />} />
          
          {/* إدارة المستخدمين */}
          <Route path="users" element={<UserManagement />} />
        </Route>

        {/* صفحة عدم التصريح */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* مسار افتراضي للصفحات غير الموجودة */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;