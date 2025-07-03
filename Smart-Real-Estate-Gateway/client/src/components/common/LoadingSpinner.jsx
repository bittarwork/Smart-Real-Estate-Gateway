import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = null,
  className = '' 
}) => {
  // تحديد أحجام الـ spinner
  const sizes = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  // تحديد ألوان الـ spinner
  const colors = {
    primary: 'border-primary-200 border-t-primary-600',
    secondary: 'border-gray-200 border-t-gray-600',
    success: 'border-success-200 border-t-success-600',
    warning: 'border-warning-200 border-t-warning-600',
    danger: 'border-danger-200 border-t-danger-600',
    white: 'border-gray-300 border-t-white'
  };

  const spinnerClass = `
    ${sizes[size]} 
    ${colors[color]} 
    border-2 
    border-solid 
    rounded-full 
    animate-spin
    ${className}
  `.trim();

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={spinnerClass}></div>
      {text && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

// مكون للتحميل على الصفحة كاملة
export const FullPageSpinner = ({ text = 'جاري التحميل...' }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="large" color="primary" />
        <p className="mt-4 text-lg text-gray-700 font-medium">
          {text}
        </p>
      </div>
    </div>
  );
};

// مكون للتحميل داخل الأزرار
export const ButtonSpinner = ({ size = 'small' }) => {
  return (
    <LoadingSpinner 
      size={size} 
      color="white" 
      className="mr-2"
    />
  );
};

// مكون للتحميل في الجداول
export const TableSpinner = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <LoadingSpinner 
        size="medium" 
        color="primary" 
        text="جاري تحميل البيانات..."
      />
    </div>
  );
};

// مكون للتحميل في البطاقات
export const CardSpinner = ({ text = 'جاري التحميل...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <LoadingSpinner size="large" color="primary" />
      <p className="mt-4 text-gray-600 text-center">
        {text}
      </p>
    </div>
  );
};

export default LoadingSpinner;