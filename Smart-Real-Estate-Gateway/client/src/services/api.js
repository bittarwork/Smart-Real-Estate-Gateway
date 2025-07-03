import axios from 'axios';

// إنشاء instance من axios مع الإعدادات الأساسية
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000, // 30 ثانية
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor للطلبات - إضافة الرمز المميز
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // إضافة timestamp لتجنب cache
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor للاستجابات - معالجة الأخطاء
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // إذا كانت الاستجابة 401 (غير مصرح) قم بتسجيل الخروج
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // إعادة توجيه لصفحة تسجيل الدخول إذا لم نكن بها بالفعل
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    
    // إذا كانت الاستجابة 403 (ممنوع) 
    if (error.response?.status === 403) {
      console.error('ليس لديك صلاحية للوصول لهذا المورد');
    }
    
    // معالجة أخطاء الشبكة
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.error('خطأ في الشبكة - تحقق من الاتصال بالإنترنت');
    }
    
    // معالجة انتهاء المهلة الزمنية
    if (error.code === 'ECONNABORTED') {
      console.error('انتهت المهلة الزمنية للطلب');
    }
    
    return Promise.reject(error);
  }
);

// دوال مساعدة للطلبات الشائعة

// GET request
export const get = async (url, config = {}) => {
  try {
    const response = await api.get(url, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// POST request
export const post = async (url, data = {}, config = {}) => {
  try {
    const response = await api.post(url, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// PUT request
export const put = async (url, data = {}, config = {}) => {
  try {
    const response = await api.put(url, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// DELETE request
export const del = async (url, config = {}) => {
  try {
    const response = await api.delete(url, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// PATCH request
export const patch = async (url, data = {}, config = {}) => {
  try {
    const response = await api.patch(url, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// رفع الملفات
export const uploadFile = async (url, formData, onUploadProgress = null) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    if (onUploadProgress) {
      config.onUploadProgress = onUploadProgress;
    }
    
    const response = await api.post(url, formData, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// تحميل الملفات
export const downloadFile = async (url, filename = 'file') => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    // إنشاء رابط للتحميل
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    return true;
  } catch (error) {
    throw error;
  }
};

// دالة لبناء query string
export const buildQueryString = (params) => {
  const query = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => query.append(key, item));
      } else {
        query.append(key, value);
      }
    }
  });
  
  return query.toString();
};

// دالة لمعالجة الأخطاء
export const handleApiError = (error) => {
  if (error.response) {
    // الخادم رد بحالة خطأ
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data.message || 'طلب غير صحيح';
      case 401:
        return 'غير مصرح - يرجى تسجيل الدخول';
      case 403:
        return 'ممنوع - ليس لديك صلاحية';
      case 404:
        return 'غير موجود';
      case 422:
        return data.message || 'بيانات غير صحيحة';
      case 500:
        return 'خطأ في الخادم';
      default:
        return data.message || `خطأ ${status}`;
    }
  } else if (error.request) {
    // الطلب تم إرساله ولكن لم تأت استجابة
    return 'خطأ في الشبكة - تحقق من الاتصال';
  } else {
    // خطأ في إعداد الطلب
    return error.message || 'خطأ غير معروف';
  }
};

// إعادة تعيين API headers (مفيد عند تسجيل الخروج)
export const resetApiHeaders = () => {
  delete api.defaults.headers.common['Authorization'];
};

// تعيين Authorization header
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;