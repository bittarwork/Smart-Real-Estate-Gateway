const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // تسجيل الخطأ
  console.error('خطأ في الخادم:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // خطأ التحقق من صحة Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message: `خطأ في التحقق من البيانات: ${message}`,
      statusCode: 400,
      type: 'ValidationError'
    };
  }

  // خطأ ObjectId غير صحيح في Mongoose
  if (err.name === 'CastError') {
    const message = 'المعرف المرسل غير صحيح';
    error = {
      message,
      statusCode: 400,
      type: 'CastError'
    };
  }

  // خطأ التكرار في Mongoose
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field} "${value}" موجود مسبقاً`;
    error = {
      message,
      statusCode: 400,
      type: 'DuplicateError'
    };
  }

  // خطأ JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'رمز المصادقة غير صحيح';
    error = {
      message,
      statusCode: 401,
      type: 'TokenError'
    };
  }

  // خطأ انتهاء صلاحية JWT
  if (err.name === 'TokenExpiredError') {
    const message = 'انتهت صلاحية رمز المصادقة';
    error = {
      message,
      statusCode: 401,
      type: 'TokenExpiredError'
    };
  }

  // خطأ تضارب المواعيد
  if (err.name === 'ConflictError') {
    error = {
      message: err.message,
      statusCode: 409,
      type: 'ConflictError'
    };
  }

  // خطأ الملف كبير جداً
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: 'حجم الملف كبير جداً',
      statusCode: 413,
      type: 'FileSizeError'
    };
  }

  // خطأ نوع الملف غير مدعوم
  if (err.code === 'UNSUPPORTED_FILE_TYPE') {
    error = {
      message: 'نوع الملف غير مدعوم',
      statusCode: 400,
      type: 'FileTypeError'
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'خطأ في الخادم',
      type: error.type || 'ServerError',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err 
      })
    }
  });
};

module.exports = errorHandler;