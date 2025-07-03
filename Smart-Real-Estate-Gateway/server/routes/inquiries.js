const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Inquiry = require('../models/Inquiry');
const Property = require('../models/Property');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// إنشاء استفسار جديد
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('الاسم يجب أن يكون على الأقل حرفين'),
  body('email').isEmail().normalizeEmail().withMessage('البريد الإلكتروني غير صحيح'),
  body('phone').isMobilePhone('ar-SA').withMessage('رقم الهاتف غير صحيح'),
  body('subject').trim().isLength({ min: 5 }).withMessage('الموضوع يجب أن يكون على الأقل 5 أحرف'),
  body('message').trim().isLength({ min: 10 }).withMessage('الرسالة يجب أن تكون على الأقل 10 أحرف'),
  body('propertyId').optional().isMongoId().withMessage('معرف العقار غير صحيح'),
  body('inquiryType').optional().isIn(['عام', 'استفسار عن عقار', 'طلب زيارة', 'شكوى', 'اقتراح']).withMessage('نوع الاستفسار غير صحيح')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات الاستفسار غير صحيحة',
        errors: errors.array()
      });
    }

    const { name, email, phone, subject, message, propertyId, inquiryType = 'عام' } = req.body;

    // التحقق من وجود العقار إذا تم تحديده
    if (propertyId) {
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'العقار المحدد غير موجود'
        });
      }
    }

    // إنشاء الاستفسار
    const inquiry = new Inquiry({
      name,
      email,
      phone,
      subject,
      message,
      propertyId: propertyId || null,
      inquiryType,
      status: 'جديد',
      priority: 'متوسط'
    });

    await inquiry.save();

    // جلب الاستفسار مع معلومات العقار
    const populatedInquiry = await Inquiry.findById(inquiry._id)
      .populate('propertyId', 'title type price images');

    res.status(201).json({
      success: true,
      message: 'تم إرسال الاستفسار بنجاح، سنتواصل معك قريباً',
      data: {
        inquiry: populatedInquiry
      }
    });
  } catch (error) {
    console.error('خطأ في إنشاء الاستفسار:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إرسال الاستفسار'
    });
  }
});

// الحصول على جميع الاستفسارات (للمشرفين)
router.get('/', [
  authenticate,
  requireAdmin,
  query('page').optional().isInt({ min: 1 }).withMessage('رقم الصفحة غير صحيح'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('حد العرض غير صحيح'),
  query('search').optional().trim(),
  query('status').optional().isIn(['جديد', 'قيد المراجعة', 'تم الرد', 'مغلق']).withMessage('حالة الاستفسار غير صحيحة'),
  query('priority').optional().isIn(['منخفض', 'متوسط', 'عالي', 'عاجل']).withMessage('أولوية الاستفسار غير صحيحة'),
  query('inquiryType').optional().isIn(['عام', 'استفسار عن عقار', 'طلب زيارة', 'شكوى', 'اقتراح']).withMessage('نوع الاستفسار غير صحيح'),
  query('sortBy').optional().isIn(['createdAt', 'status', 'priority', 'name']).withMessage('نوع الترتيب غير صحيح'),
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
      priority,
      inquiryType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // بناء فلتر البحث
    const filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (inquiryType) filter.inquiryType = inquiryType;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // تحديد الترتيب
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // تنفيذ الاستعلام
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [inquiries, totalInquiries] = await Promise.all([
      Inquiry.find(filter)
        .populate('propertyId', 'title type price images')
        .populate('assignedTo', 'name email')
        .populate('response.respondedBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Inquiry.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalInquiries / parseInt(limit));

    res.json({
      success: true,
      data: {
        inquiries,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalInquiries,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب الاستفسارات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الاستفسارات'
    });
  }
});

// الحصول على استفسار محدد (للمشرفين)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate('propertyId', 'title type price images address')
      .populate('assignedTo', 'name email phone')
      .populate('response.respondedBy', 'name email')
      .populate('notes.addedBy', 'name email');

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'الاستفسار غير موجود'
      });
    }

    res.json({
      success: true,
      data: {
        inquiry
      }
    });
  } catch (error) {
    console.error('خطأ في جلب الاستفسار:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الاستفسار'
    });
  }
});

// تحديث حالة الاستفسار (للمشرفين)
router.put('/:id/status', [
  authenticate,
  requireAdmin,
  body('status').isIn(['جديد', 'قيد المراجعة', 'تم الرد', 'مغلق']).withMessage('حالة الاستفسار غير صحيحة'),
  body('priority').optional().isIn(['منخفض', 'متوسط', 'عالي', 'عاجل']).withMessage('أولوية الاستفسار غير صحيحة')
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

    const { status, priority } = req.body;

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'الاستفسار غير موجود'
      });
    }

    const updateData = { status };
    if (priority) updateData.priority = priority;

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('propertyId', 'title type price')
     .populate('assignedTo', 'name email');

    res.json({
      success: true,
      message: 'تم تحديث حالة الاستفسار بنجاح',
      data: {
        inquiry: updatedInquiry
      }
    });
  } catch (error) {
    console.error('خطأ في تحديث حالة الاستفسار:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الاستفسار'
    });
  }
});

// الرد على الاستفسار (للمشرفين)
router.post('/:id/respond', [
  authenticate,
  requireAdmin,
  body('message').trim().isLength({ min: 10 }).withMessage('الرد يجب أن يكون على الأقل 10 أحرف')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'نص الرد غير صحيح',
        errors: errors.array()
      });
    }

    const { message } = req.body;

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'الاستفسار غير موجود'
      });
    }

    // إضافة الرد
    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      {
        response: {
          message,
          respondedBy: req.user._id,
          respondedAt: new Date()
        },
        status: 'تم الرد'
      },
      { new: true }
    ).populate('propertyId', 'title type price')
     .populate('response.respondedBy', 'name email');

    res.json({
      success: true,
      message: 'تم إرسال الرد بنجاح',
      data: {
        inquiry: updatedInquiry
      }
    });
  } catch (error) {
    console.error('خطأ في الرد على الاستفسار:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الرد على الاستفسار'
    });
  }
});

// إضافة ملاحظة للاستفسار (للمشرفين)
router.post('/:id/notes', [
  authenticate,
  requireAdmin,
  body('content').trim().isLength({ min: 5 }).withMessage('الملاحظة يجب أن تكون على الأقل 5 أحرف')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'محتوى الملاحظة غير صحيح',
        errors: errors.array()
      });
    }

    const { content } = req.body;

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'الاستفسار غير موجود'
      });
    }

    // إضافة الملاحظة
    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          notes: {
            content,
            addedBy: req.user._id,
            addedAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('notes.addedBy', 'name email');

    res.json({
      success: true,
      message: 'تم إضافة الملاحظة بنجاح',
      data: {
        inquiry: updatedInquiry
      }
    });
  } catch (error) {
    console.error('خطأ في إضافة الملاحظة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة الملاحظة'
    });
  }
});

// تعيين الاستفسار لمشرف (للمشرفين)
router.put('/:id/assign', [
  authenticate,
  requireAdmin,
  body('assignedTo').isMongoId().withMessage('معرف المشرف غير صحيح')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'معرف المشرف غير صحيح',
        errors: errors.array()
      });
    }

    const { assignedTo } = req.body;

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'الاستفسار غير موجود'
      });
    }

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { 
        assignedTo,
        status: inquiry.status === 'جديد' ? 'قيد المراجعة' : inquiry.status
      },
      { new: true }
    ).populate('assignedTo', 'name email')
     .populate('propertyId', 'title type price');

    res.json({
      success: true,
      message: 'تم تعيين الاستفسار بنجاح',
      data: {
        inquiry: updatedInquiry
      }
    });
  } catch (error) {
    console.error('خطأ في تعيين الاستفسار:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تعيين الاستفسار'
    });
  }
});

// حذف استفسار (للمشرفين)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'الاستفسار غير موجود'
      });
    }

    await Inquiry.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف الاستفسار بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف الاستفسار:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الاستفسار'
    });
  }
});

// الحصول على إحصائيات الاستفسارات (للمشرفين)
router.get('/stats/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const [
      totalInquiries,
      newInquiries,
      inProgressInquiries,
      respondedInquiries,
      closedInquiries,
      todayInquiries,
      thisWeekInquiries
    ] = await Promise.all([
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: 'جديد' }),
      Inquiry.countDocuments({ status: 'قيد المراجعة' }),
      Inquiry.countDocuments({ status: 'تم الرد' }),
      Inquiry.countDocuments({ status: 'مغلق' }),
      Inquiry.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      Inquiry.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    // إحصائيات حسب النوع
    const inquiriesByType = await Inquiry.aggregate([
      { $group: { _id: '$inquiryType', count: { $sum: 1 } } }
    ]);

    // إحصائيات حسب الأولوية
    const inquiriesByPriority = await Inquiry.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total: totalInquiries,
          new: newInquiries,
          inProgress: inProgressInquiries,
          responded: respondedInquiries,
          closed: closedInquiries,
          today: todayInquiries,
          thisWeek: thisWeekInquiries
        },
        distributions: {
          byType: inquiriesByType,
          byPriority: inquiriesByPriority
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الاستفسارات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات الاستفسارات'
    });
  }
});

module.exports = router;