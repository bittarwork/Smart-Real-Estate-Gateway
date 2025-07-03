const jwt = require('jsonwebtoken');
const User = require('../models/User');

// التحقق من صحة الرمز المميز
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح، لا يوجد رمز مصادقة'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart-real-estate-secret');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح، المستخدم غير موجود'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'الحساب غير مفعل أو محظور'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'انتهت صلاحية رمز المصادقة'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'رمز المصادقة غير صحيح'
      });
    }

    console.error('خطأ في المصادقة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في المصادقة'
    });
  }
};

// التحقق من صلاحيات المشرف
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح، يجب تسجيل الدخول أولاً'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح، صلاحيات المشرف مطلوبة'
    });
  }

  next();
};

// التحقق من ملكية المورد أو صلاحيات المشرف
const requireOwnershipOrAdmin = (resourceField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح، يجب تسجيل الدخول أولاً'
      });
    }

    // المشرف يمكنه الوصول لجميع الموارد
    if (req.user.role === 'admin') {
      return next();
    }

    // التحقق من الملكية (سيتم التحقق في المتحكم)
    req.requireOwnership = true;
    req.ownershipField = resourceField;
    next();
  };
};

// middleware للتحقق من الصلاحيات المتعددة
const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح، يجب تسجيل الدخول أولاً'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح، صلاحيات غير كافية'
      });
    }

    next();
  };
};

// middleware اختياري للمصادقة (للمسارات التي تقبل المستخدمين المسجلين وغير المسجلين)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart-real-estate-secret');
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // تجاهل الأخطاء في المصادقة الاختيارية
    next();
  }
};

// معالجة تحديث وقت آخر دخول
const updateLastLogin = async (req, res, next) => {
  if (req.user) {
    try {
      await User.findByIdAndUpdate(req.user._id, { lastLogin: new Date() });
    } catch (error) {
      console.error('خطأ في تحديث وقت آخر دخول:', error);
    }
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireOwnershipOrAdmin,
  requireRoles,
  optionalAuth,
  updateLastLogin
};