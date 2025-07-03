const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Property = require('../models/Property');
const Inquiry = require('../models/Inquiry');
const Appointment = require('../models/Appointment');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// تطبيق المصادقة وصلاحيات المشرف على جميع المسارات
router.use(authenticate);
router.use(requireAdmin);

// ====== إدارة المستخدمين ======

// الحصول على جميع المستخدمين مع الفلترة والبحث
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('رقم الصفحة يجب أن يكون رقم صحيح أكبر من 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('حد العرض يجب أن يكون بين 1 و 100'),
  query('search').optional().trim(),
  query('role').optional().isIn(['user', 'admin']).withMessage('نوع المستخدم غير صحيح'),
  query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('حالة المستخدم غير صحيحة'),
  query('sortBy').optional().isIn(['name', 'email', 'createdAt', 'lastLogin']).withMessage('ترتيب غير صحيح'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('نوع الترتيب غير صحيح')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'معاملات البحث غير صحيحة',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      search = '',
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // بناء فلتر البحث
    const filter = {};
    
    if (role) filter.role = role;
    if (status) filter.status = status;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // تحديد الترتيب
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // تنفيذ الاستعلام
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المستخدمين'
    });
  }
});

// الحصول على تفاصيل مستخدم محدد
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // إحصائيات المستخدم
    const [userProperties, userInquiries, userAppointments] = await Promise.all([
      Property.countDocuments({ 'agent.email': user.email }),
      Inquiry.countDocuments({ email: user.email }),
      Appointment.countDocuments({ email: user.email })
    ]);

    res.json({
      success: true,
      data: {
        user,
        stats: {
          properties: userProperties,
          inquiries: userInquiries,
          appointments: userAppointments
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب تفاصيل المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب تفاصيل المستخدم'
    });
  }
});

// تحديث معلومات المستخدم
router.put('/users/:id', [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('الاسم يجب أن يكون على الأقل حرفين'),
  body('email').optional().isEmail().normalizeEmail().withMessage('البريد الإلكتروني غير صحيح'),
  body('phone').optional().isMobilePhone('ar-SA').withMessage('رقم الهاتف غير صحيح'),
  body('role').optional().isIn(['user', 'admin']).withMessage('نوع المستخدم غير صحيح'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('حالة المستخدم غير صحيحة')
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

    const { name, email, phone, role, status } = req.body;
    
    // التحقق من وجود المستخدم
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // منع المشرف من تعديل نفسه إلى مستخدم عادي
    if (user._id.toString() === req.user._id.toString() && role === 'user') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك تغيير صلاحياتك الخاصة'
      });
    }

    // التحقق من تكرار البريد الإلكتروني
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني مستخدم بالفعل'
        });
      }
    }

    // تحديث البيانات
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, role, status },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'تم تحديث المستخدم بنجاح',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('خطأ في تحديث المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث المستخدم'
    });
  }
});

// حذف مستخدم
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // منع المشرف من حذف نفسه
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك حذف حسابك الخاص'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف المستخدم'
    });
  }
});

// ====== التقارير والإحصائيات ======

// الحصول على الإحصائيات الشاملة
router.get('/stats', async (req, res) => {
  try {
    // الإحصائيات الأساسية
    const [
      totalUsers,
      totalProperties,
      totalInquiries,
      totalAppointments,
      activeUsers,
      availableProperties,
      pendingInquiries,
      todayAppointments
    ] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Inquiry.countDocuments(),
      Appointment.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Property.countDocuments({ status: 'متاح' }),
      Inquiry.countDocuments({ status: 'جديد' }),
      Appointment.countDocuments({
        appointmentDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    ]);

    // إحصائيات المستخدمين حسب النوع
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // إحصائيات العقارات حسب النوع
    const propertiesByType = await Property.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // إحصائيات العقارات حسب الفئة
    const propertiesByCategory = await Property.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // إحصائيات الاستفسارات حسب الحالة
    const inquiriesByStatus = await Inquiry.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // إحصائيات المواعيد حسب الحالة
    const appointmentsByStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // إحصائيات شهرية للتسجيلات الجديدة
    const monthlyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), 0, 1) // بداية العام الحالي
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProperties,
          totalInquiries,
          totalAppointments,
          activeUsers,
          availableProperties,
          pendingInquiries,
          todayAppointments
        },
        distributions: {
          usersByRole,
          propertiesByType,
          propertiesByCategory,
          inquiriesByStatus,
          appointmentsByStatus
        },
        trends: {
          monthlyRegistrations
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب الإحصائيات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات'
    });
  }
});

// تقرير المستخدمين النشطين
router.get('/reports/active-users', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const activeUsers = await User.find({
      lastLogin: { $gte: daysAgo },
      status: 'active'
    }).select('name email lastLogin role').sort({ lastLogin: -1 });

    res.json({
      success: true,
      data: {
        activeUsers,
        count: activeUsers.length,
        period: `آخر ${days} يوم`
      }
    });
  } catch (error) {
    console.error('خطأ في جلب تقرير المستخدمين النشطين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب تقرير المستخدمين النشطين'
    });
  }
});

// تقرير العقارات الأكثر مشاهدة
router.get('/reports/popular-properties', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const popularProperties = await Property.find()
      .select('title type category price views likes status')
      .sort({ views: -1, likes: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        properties: popularProperties,
        count: popularProperties.length
      }
    });
  } catch (error) {
    console.error('خطأ في جلب تقرير العقارات الشائعة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب تقرير العقارات الشائعة'
    });
  }
});

// تقرير الاستفسارات المعلقة
router.get('/reports/pending-inquiries', async (req, res) => {
  try {
    const pendingInquiries = await Inquiry.find({ status: 'جديد' })
      .populate('propertyId', 'title type')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        inquiries: pendingInquiries,
        count: pendingInquiries.length
      }
    });
  } catch (error) {
    console.error('خطأ في جلب تقرير الاستفسارات المعلقة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب تقرير الاستفسارات المعلقة'
    });
  }
});

// ====== الإعدادات ======

// الحصول على إعدادات النظام (يمكن توسيعها لاحقاً)
router.get('/settings', async (req, res) => {
  try {
    // إعدادات افتراضية - يمكن إنشاء نموذج منفصل للإعدادات
    const settings = {
      system: {
        siteName: 'بوابة العقارات الذكية',
        supportEmail: 'support@realestate.com',
        supportPhone: '+966500000000',
        address: 'الرياض، المملكة العربية السعودية'
      },
      features: {
        allowRegistration: true,
        requireEmailVerification: false,
        allowPropertySubmission: true,
        moderateProperties: true
      },
      limits: {
        maxPropertiesPerUser: 10,
        maxImagesPerProperty: 10,
        maxFileSize: '5MB'
      }
    };

    res.json({
      success: true,
      data: {
        settings
      }
    });
  } catch (error) {
    console.error('خطأ في جلب الإعدادات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإعدادات'
    });
  }
});

// تحديث إعدادات النظام
router.put('/settings', [
  body('system.siteName').optional().trim().isLength({ min: 2 }).withMessage('اسم الموقع يجب أن يكون على الأقل حرفين'),
  body('system.supportEmail').optional().isEmail().withMessage('بريد الدعم غير صحيح'),
  body('system.supportPhone').optional().isMobilePhone('ar-SA').withMessage('هاتف الدعم غير صحيح'),
  body('features.allowRegistration').optional().isBoolean().withMessage('إعداد التسجيل يجب أن يكون true أو false')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات الإعدادات غير صحيحة',
        errors: errors.array()
      });
    }

    // في هذا المثال، نحفظ الإعدادات في الذاكرة فقط
    // في التطبيق الحقيقي، يجب حفظها في قاعدة البيانات
    
    res.json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح',
      data: {
        settings: req.body
      }
    });
  } catch (error) {
    console.error('خطأ في تحديث الإعدادات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الإعدادات'
    });
  }
});

// مسح البيانات (إعادة تعيين جزئية)
router.post('/maintenance/cleanup', [
  body('action').isIn(['clear_old_inquiries', 'clear_completed_appointments', 'clear_inactive_users']).withMessage('نوع التنظيف غير صحيح'),
  body('days').optional().isInt({ min: 1 }).withMessage('عدد الأيام يجب أن يكون رقم صحيح')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'معاملات التنظيف غير صحيحة',
        errors: errors.array()
      });
    }

    const { action, days = 90 } = req.body;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    let result = { deleted: 0 };

    switch (action) {
      case 'clear_old_inquiries':
        result = await Inquiry.deleteMany({
          status: 'مغلق',
          updatedAt: { $lt: daysAgo }
        });
        break;
      
      case 'clear_completed_appointments':
        result = await Appointment.deleteMany({
          status: 'مكتمل',
          completedAt: { $lt: daysAgo }
        });
        break;
      
      case 'clear_inactive_users':
        result = await User.deleteMany({
          status: 'inactive',
          lastLogin: { $lt: daysAgo },
          role: 'user'
        });
        break;
    }

    res.json({
      success: true,
      message: `تم حذف ${result.deletedCount} عنصر بنجاح`,
      data: {
        deletedCount: result.deletedCount,
        action
      }
    });
  } catch (error) {
    console.error('خطأ في تنظيف البيانات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تنظيف البيانات'
    });
  }
});

module.exports = router;