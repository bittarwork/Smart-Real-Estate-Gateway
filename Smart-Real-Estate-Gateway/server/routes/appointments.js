const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Appointment = require('../models/Appointment');
const Property = require('../models/Property');
const User = require('../models/User');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// حجز موعد جديد
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('الاسم يجب أن يكون على الأقل حرفين'),
  body('email').isEmail().normalizeEmail().withMessage('البريد الإلكتروني غير صحيح'),
  body('phone').isMobilePhone('ar-SA').withMessage('رقم الهاتف غير صحيح'),
  body('propertyId').isMongoId().withMessage('معرف العقار غير صحيح'),
  body('appointmentDate').isISO8601().toDate().withMessage('تاريخ الموعد غير صحيح'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('وقت الموعد غير صحيح'),
  body('type').optional().isIn(['زيارة شخصية', 'زيارة افتراضية', 'استشارة', 'تقييم عقار']).withMessage('نوع الموعد غير صحيح'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('الملاحظات طويلة جداً')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات الموعد غير صحيحة',
        errors: errors.array()
      });
    }

    const { name, email, phone, propertyId, appointmentDate, appointmentTime, type = 'زيارة شخصية', notes } = req.body;

    // التحقق من وجود العقار
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'العقار المحدد غير موجود'
      });
    }

    // التحقق من أن التاريخ في المستقبل
    const appointmentDateTime = new Date(`${appointmentDate.toDateString()} ${appointmentTime}`);
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حجز موعد في الماضي'
      });
    }

    // إنشاء الموعد
    const appointment = new Appointment({
      name,
      email,
      phone,
      propertyId,
      appointmentDate,
      appointmentTime,
      type,
      notes,
      status: 'معلق',
      priority: 'متوسط'
    });

    await appointment.save();

    // جلب الموعد مع معلومات العقار
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('propertyId', 'title type price images address');

    res.status(201).json({
      success: true,
      message: 'تم حجز الموعد بنجاح، سنتواصل معك لتأكيد الموعد',
      data: {
        appointment: populatedAppointment
      }
    });
  } catch (error) {
    if (error.name === 'ConflictError') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('خطأ في حجز الموعد:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حجز الموعد'
    });
  }
});

// الحصول على جميع المواعيد (للمشرفين)
router.get('/', [
  authenticate,
  requireAdmin,
  query('page').optional().isInt({ min: 1 }).withMessage('رقم الصفحة غير صحيح'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('حد العرض غير صحيح'),
  query('search').optional().trim(),
  query('status').optional().isIn(['معلق', 'مؤكد', 'مكتمل', 'ملغي', 'لم يحضر']).withMessage('حالة الموعد غير صحيحة'),
  query('type').optional().isIn(['زيارة شخصية', 'زيارة افتراضية', 'استشارة', 'تقييم عقار']).withMessage('نوع الموعد غير صحيح'),
  query('priority').optional().isIn(['منخفض', 'متوسط', 'عالي']).withMessage('أولوية الموعد غير صحيحة'),
  query('startDate').optional().isISO8601().toDate().withMessage('تاريخ البداية غير صحيح'),
  query('endDate').optional().isISO8601().toDate().withMessage('تاريخ النهاية غير صحيح'),
  query('sortBy').optional().isIn(['appointmentDate', 'createdAt', 'status', 'priority']).withMessage('نوع الترتيب غير صحيح'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('اتجاه الترتيب غير صحيح')
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
      status,
      type,
      priority,
      startDate,
      endDate,
      sortBy = 'appointmentDate',
      sortOrder = 'asc'
    } = req.query;

    // بناء فلتر البحث
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    
    // فلترة التاريخ
    if (startDate || endDate) {
      filter.appointmentDate = {};
      if (startDate) filter.appointmentDate.$gte = startDate;
      if (endDate) filter.appointmentDate.$lte = endDate;
    }
    
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

    const [appointments, totalAppointments] = await Promise.all([
      Appointment.find(filter)
        .populate('propertyId', 'title type price images address')
        .populate('assignedAgent', 'name email phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Appointment.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalAppointments / parseInt(limit));

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalAppointments,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب المواعيد:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المواعيد'
    });
  }
});

// الحصول على موعد محدد (للمشرفين)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('propertyId', 'title type price images address agent')
      .populate('assignedAgent', 'name email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'الموعد غير موجود'
      });
    }

    res.json({
      success: true,
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('خطأ في جلب الموعد:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الموعد'
    });
  }
});

// تحديث حالة الموعد (للمشرفين)
router.put('/:id/status', [
  authenticate,
  requireAdmin,
  body('status').isIn(['معلق', 'مؤكد', 'مكتمل', 'ملغي', 'لم يحضر']).withMessage('حالة الموعد غير صحيحة'),
  body('cancellationReason').optional().trim().isLength({ min: 5, max: 200 }).withMessage('سبب الإلغاء يجب أن يكون بين 5 و 200 حرف')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات التحديث غير صحيحة',
        errors: errors.array()
      });
    }

    const { status, cancellationReason } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'الموعد غير موجود'
      });
    }

    const updateData = { status };
    
    // إضافة الطوابع الزمنية حسب الحالة
    if (status === 'مؤكد') {
      updateData.confirmedAt = new Date();
    } else if (status === 'مكتمل') {
      updateData.completedAt = new Date();
    } else if (status === 'ملغي') {
      updateData.cancelledAt = new Date();
      if (cancellationReason) {
        updateData.cancellationReason = cancellationReason;
      }
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('propertyId', 'title type price')
     .populate('assignedAgent', 'name email');

    res.json({
      success: true,
      message: 'تم تحديث حالة الموعد بنجاح',
      data: {
        appointment: updatedAppointment
      }
    });
  } catch (error) {
    console.error('خطأ في تحديث حالة الموعد:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الموعد'
    });
  }
});

// تعيين الموعد لوكيل (للمشرفين)
router.put('/:id/assign', [
  authenticate,
  requireAdmin,
  body('assignedAgent').isMongoId().withMessage('معرف الوكيل غير صحيح')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'معرف الوكيل غير صحيح',
        errors: errors.array()
      });
    }

    const { assignedAgent } = req.body;

    // التحقق من وجود المستخدم (الوكيل)
    const agent = await User.findById(assignedAgent);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'الوكيل المحدد غير موجود'
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'الموعد غير موجود'
      });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        assignedAgent,
        status: appointment.status === 'معلق' ? 'مؤكد' : appointment.status
      },
      { new: true }
    ).populate('assignedAgent', 'name email phone')
     .populate('propertyId', 'title type price');

    res.json({
      success: true,
      message: 'تم تعيين الموعد بنجاح',
      data: {
        appointment: updatedAppointment
      }
    });
  } catch (error) {
    console.error('خطأ في تعيين الموعد:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تعيين الموعد'
    });
  }
});

// إضافة تقييم للموعد المكتمل
router.post('/:id/feedback', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5'),
  body('comment').optional().trim().isLength({ min: 5, max: 500 }).withMessage('التعليق يجب أن يكون بين 5 و 500 حرف')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات التقييم غير صحيحة',
        errors: errors.array()
      });
    }

    const { rating, comment } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'الموعد غير موجود'
      });
    }

    if (appointment.status !== 'مكتمل') {
      return res.status(400).json({
        success: false,
        message: 'يمكن تقييم المواعيد المكتملة فقط'
      });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        feedback: {
          rating,
          comment,
          submittedAt: new Date()
        }
      },
      { new: true }
    ).populate('propertyId', 'title type price');

    res.json({
      success: true,
      message: 'تم إضافة التقييم بنجاح',
      data: {
        appointment: updatedAppointment
      }
    });
  } catch (error) {
    console.error('خطأ في إضافة التقييم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة التقييم'
    });
  }
});

// إعادة جدولة الموعد (للمشرفين)
router.put('/:id/reschedule', [
  authenticate,
  requireAdmin,
  body('appointmentDate').isISO8601().toDate().withMessage('تاريخ الموعد غير صحيح'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('وقت الموعد غير صحيح')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات إعادة الجدولة غير صحيحة',
        errors: errors.array()
      });
    }

    const { appointmentDate, appointmentTime } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'الموعد غير موجود'
      });
    }

    // التحقق من أن التاريخ الجديد في المستقبل
    const newDateTime = new Date(`${appointmentDate.toDateString()} ${appointmentTime}`);
    if (newDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن جدولة موعد في الماضي'
      });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        appointmentDate,
        appointmentTime,
        status: 'معلق' // إعادة تعيين الحالة إلى معلق
      },
      { new: true, runValidators: true }
    ).populate('propertyId', 'title type price')
     .populate('assignedAgent', 'name email');

    res.json({
      success: true,
      message: 'تم إعادة جدولة الموعد بنجاح',
      data: {
        appointment: updatedAppointment
      }
    });
  } catch (error) {
    if (error.name === 'ConflictError') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('خطأ في إعادة جدولة الموعد:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إعادة جدولة الموعد'
    });
  }
});

// حذف موعد (للمشرفين)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'الموعد غير موجود'
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف الموعد بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف الموعد:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الموعد'
    });
  }
});

// الحصول على المواعيد اليومية (للمشرفين)
router.get('/daily/:date', authenticate, requireAdmin, async (req, res) => {
  try {
    const { date } = req.params;
    const appointmentDate = new Date(date);
    
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'تاريخ غير صحيح'
      });
    }

    const startOfDay = new Date(appointmentDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(appointmentDate.setHours(23, 59, 59, 999));

    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate('propertyId', 'title type price address')
    .populate('assignedAgent', 'name email phone')
    .sort({ appointmentTime: 1 });

    // تجميع المواعيد حسب الحالة
    const appointmentsByStatus = appointments.reduce((acc, appointment) => {
      const status = appointment.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(appointment);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        date: appointmentDate.toISOString().split('T')[0],
        total: appointments.length,
        appointments,
        appointmentsByStatus
      }
    });
  } catch (error) {
    console.error('خطأ في جلب المواعيد اليومية:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المواعيد اليومية'
    });
  }
});

// الحصول على إحصائيات المواعيد (للمشرفين)
router.get('/stats/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const [
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      todayAppointments,
      thisWeekAppointments
    ] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'معلق' }),
      Appointment.countDocuments({ status: 'مؤكد' }),
      Appointment.countDocuments({ status: 'مكتمل' }),
      Appointment.countDocuments({ status: 'ملغي' }),
      Appointment.countDocuments({
        appointmentDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      Appointment.countDocuments({
        appointmentDate: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    // إحصائيات حسب النوع
    const appointmentsByType = await Appointment.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // إحصائيات حسب الأولوية
    const appointmentsByPriority = await Appointment.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // متوسط التقييم
    const avgRating = await Appointment.aggregate([
      { $match: { 'feedback.rating': { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$feedback.rating' } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total: totalAppointments,
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          today: todayAppointments,
          thisWeek: thisWeekAppointments
        },
        distributions: {
          byType: appointmentsByType,
          byPriority: appointmentsByPriority
        },
        feedback: {
          averageRating: avgRating.length > 0 ? avgRating[0].avgRating : 0
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات المواعيد:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات المواعيد'
    });
  }
});

module.exports = router;