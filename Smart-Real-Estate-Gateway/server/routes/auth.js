const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, updateLastLogin } = require('../middleware/auth');

const router = express.Router();

// إنشاء رمز JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'smart-real-estate-secret', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// تسجيل مستخدم جديد
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('الاسم يجب أن يكون على الأقل حرفين'),
  body('email').isEmail().normalizeEmail().withMessage('البريد الإلكتروني غير صحيح'),
  body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون على الأقل 6 أحرف'),
  body('phone').optional().isMobilePhone('ar-SA').withMessage('رقم الهاتف غير صحيح')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: errors.array()
      });
    }

    const { name, email, password, phone } = req.body;

    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل'
      });
    }

    // إنشاء المستخدم
    const user = new User({
      name,
      email,
      password,
      phone,
      role: 'user'
    });

    await user.save();

    // إنشاء الرمز المميز
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status
        },
        token
      }
    });
  } catch (error) {
    console.error('خطأ في التسجيل:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم أثناء إنشاء الحساب'
    });
  }
});

// تسجيل الدخول
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('البريد الإلكتروني غير صحيح'),
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // البحث عن المستخدم
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    // التحقق من حالة المستخدم
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'الحساب غير مفعل أو محظور'
      });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    // تحديث وقت آخر دخول
    user.lastLogin = new Date();
    await user.save();

    // إنشاء الرمز المميز
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم أثناء تسجيل الدخول'
    });
  }
});

// الحصول على معلومات المستخدم الحالي
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('خطأ في جلب معلومات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب معلومات المستخدم'
    });
  }
});

// تحديث الملف الشخصي
router.put('/profile', [
  authenticate,
  body('name').optional().trim().isLength({ min: 2 }).withMessage('الاسم يجب أن يكون على الأقل حرفين'),
  body('phone').optional().isMobilePhone('ar-SA').withMessage('رقم الهاتف غير صحيح')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: errors.array()
      });
    }

    const { name, phone } = req.body;
    const allowedUpdates = { name, phone };

    // إزالة القيم الفارغة
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الملف الشخصي'
    });
  }
});

// تغيير كلمة المرور
router.put('/change-password', [
  authenticate,
  body('currentPassword').notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),
  body('newPassword').isLength({ min: 6 }).withMessage('كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('تأكيد كلمة المرور لا يطابق كلمة المرور الجديدة');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // الحصول على المستخدم مع كلمة المرور
    const user = await User.findById(req.user._id).select('+password');

    // التحقق من كلمة المرور الحالية
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    // تحديث كلمة المرور
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تغيير كلمة المرور'
    });
  }
});

// تسجيل الخروج (إبطال الرمز المميز - في الواقع يتم التعامل معه من جانب العميل)
router.post('/logout', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الخروج'
    });
  }
});

// التحقق من صحة الرمز المميز
router.get('/verify-token', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'الرمز المميز صحيح',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('خطأ في التحقق من الرمز المميز:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في التحقق من الرمز المميز'
    });
  }
});

module.exports = router;