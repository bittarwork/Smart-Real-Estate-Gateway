const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult, query } = require('express-validator');
const Property = require('../models/Property');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// إعداد Multer لرفع الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/properties');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'property-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يرجى رفع صور فقط'));
    }
  }
});

// الحصول على جميع العقارات مع الفلترة والبحث
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('رقم الصفحة غير صحيح'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('حد العرض غير صحيح'),
  query('search').optional().trim(),
  query('type').optional().isIn(['شقة', 'فيلا', 'بيت', 'مكتب', 'محل', 'أرض', 'استوديو']).withMessage('نوع العقار غير صحيح'),
  query('category').optional().isIn(['للبيع', 'للإيجار']).withMessage('فئة العقار غير صحيحة'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('السعر الأدنى غير صحيح'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('السعر الأعلى غير صحيح'),
  query('city').optional().trim(),
  query('minRooms').optional().isInt({ min: 0 }).withMessage('عدد الغرف الأدنى غير صحيح'),
  query('maxRooms').optional().isInt({ min: 0 }).withMessage('عدد الغرف الأعلى غير صحيح'),
  query('featured').optional().isBoolean().withMessage('العقارات المميزة يجب أن تكون true أو false'),
  query('sortBy').optional().isIn(['price', 'createdAt', 'views', 'area']).withMessage('نوع الترتيب غير صحيح'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('اتجاه الترتيب غير صحيح')
], optionalAuth, async (req, res) => {
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
      limit = 12,
      search = '',
      type,
      category,
      minPrice,
      maxPrice,
      city,
      minRooms,
      maxRooms,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // بناء فلتر البحث
    const filter = { status: 'متاح' };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (city) filter['address.city'] = { $regex: city, $options: 'i' };
    if (featured !== undefined) filter.featured = featured === 'true';

    // فلترة السعر
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // فلترة عدد الغرف
    if (minRooms || maxRooms) {
      filter.rooms = {};
      if (minRooms) filter.rooms.$gte = parseInt(minRooms);
      if (maxRooms) filter.rooms.$lte = parseInt(maxRooms);
    }

    // البحث النصي
    if (search) {
      filter.$text = { $search: search };
    }

    // تحديد الترتيب
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // تنفيذ الاستعلام
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [properties, totalProperties] = await Promise.all([
      Property.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Property.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalProperties / parseInt(limit));

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProperties,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب العقارات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب العقارات'
    });
  }
});

// الحصول على عقار محدد
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'العقار غير موجود'
      });
    }

    // زيادة عدد المشاهدات
    await Property.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // البحث عن عقارات مشابهة
    const similarProperties = await Property.find({
      _id: { $ne: req.params.id },
      type: property.type,
      'address.city': property.address.city,
      status: 'متاح'
    }).limit(4).select('title price images type address');

    res.json({
      success: true,
      data: {
        property: {
          ...property.toObject(),
          views: property.views + 1
        },
        similarProperties
      }
    });
  } catch (error) {
    console.error('خطأ في جلب العقار:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب العقار'
    });
  }
});

// إنشاء عقار جديد (للمشرفين فقط)
router.post('/', [
  authenticate,
  requireAdmin,
  upload.array('images', 10),
  body('title').trim().isLength({ min: 5 }).withMessage('العنوان يجب أن يكون على الأقل 5 أحرف'),
  body('description').trim().isLength({ min: 20 }).withMessage('الوصف يجب أن يكون على الأقل 20 حرف'),
  body('type').isIn(['شقة', 'فيلا', 'بيت', 'مكتب', 'محل', 'أرض', 'استوديو']).withMessage('نوع العقار غير صحيح'),
  body('category').isIn(['للبيع', 'للإيجار']).withMessage('فئة العقار غير صحيحة'),
  body('price').isFloat({ min: 0 }).withMessage('السعر غير صحيح'),
  body('area').isFloat({ min: 0 }).withMessage('المساحة غير صحيحة'),
  body('rooms').isInt({ min: 0 }).withMessage('عدد الغرف غير صحيح'),
  body('bathrooms').isInt({ min: 0 }).withMessage('عدد الحمامات غير صحيح'),
  body('address.city').trim().notEmpty().withMessage('المدينة مطلوبة'),
  body('features').optional().isArray().withMessage('المميزات يجب أن تكون مصفوفة')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات العقار غير صحيحة',
        errors: errors.array()
      });
    }

    const propertyData = req.body;
    
    // إضافة الصور المرفوعة
    if (req.files && req.files.length > 0) {
      propertyData.images = req.files.map(file => `/uploads/properties/${file.filename}`);
    }

    // تحويل النصوص إلى boolean
    ['furnished', 'parking', 'garden', 'elevator', 'security'].forEach(field => {
      if (propertyData[field]) {
        propertyData[field] = propertyData[field] === 'true';
      }
    });

    // إنشاء العقار
    const property = new Property(propertyData);
    await property.save();

    res.status(201).json({
      success: true,
      message: 'تم إنشاء العقار بنجاح',
      data: {
        property
      }
    });
  } catch (error) {
    console.error('خطأ في إنشاء العقار:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء العقار'
    });
  }
});

// تحديث عقار (للمشرفين فقط)
router.put('/:id', [
  authenticate,
  requireAdmin,
  upload.array('images', 10),
  body('title').optional().trim().isLength({ min: 5 }).withMessage('العنوان يجب أن يكون على الأقل 5 أحرف'),
  body('description').optional().trim().isLength({ min: 20 }).withMessage('الوصف يجب أن يكون على الأقل 20 حرف'),
  body('type').optional().isIn(['شقة', 'فيلا', 'بيت', 'مكتب', 'محل', 'أرض', 'استوديو']).withMessage('نوع العقار غير صحيح'),
  body('category').optional().isIn(['للبيع', 'للإيجار']).withMessage('فئة العقار غير صحيحة'),
  body('price').optional().isFloat({ min: 0 }).withMessage('السعر غير صحيح'),
  body('status').optional().isIn(['متاح', 'محجوز', 'مباع', 'مؤجر']).withMessage('حالة العقار غير صحيحة')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات العقار غير صحيحة',
        errors: errors.array()
      });
    }

    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'العقار غير موجود'
      });
    }

    const updateData = req.body;

    // إضافة الصور الجديدة
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/properties/${file.filename}`);
      updateData.images = [...(property.images || []), ...newImages];
    }

    // تحويل النصوص إلى boolean
    ['furnished', 'parking', 'garden', 'elevator', 'security'].forEach(field => {
      if (updateData[field]) {
        updateData[field] = updateData[field] === 'true';
      }
    });

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'تم تحديث العقار بنجاح',
      data: {
        property: updatedProperty
      }
    });
  } catch (error) {
    console.error('خطأ في تحديث العقار:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث العقار'
    });
  }
});

// حذف عقار (للمشرفين فقط)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'العقار غير موجود'
      });
    }

    // حذف صور العقار من الخادم
    if (property.images && property.images.length > 0) {
      property.images.forEach(image => {
        const imagePath = path.join(__dirname, '..', image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف العقار بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف العقار:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف العقار'
    });
  }
});

// إعجاب/إلغاء إعجاب بعقار
router.post('/:id/like', optionalAuth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'العقار غير موجود'
      });
    }

    // زيادة عدد الإعجابات
    await Property.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } });

    res.json({
      success: true,
      message: 'تم إضافة الإعجاب بنجاح',
      data: {
        likes: property.likes + 1
      }
    });
  } catch (error) {
    console.error('خطأ في إضافة الإعجاب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة الإعجاب'
    });
  }
});

// الحصول على العقارات المميزة
router.get('/featured/list', async (req, res) => {
  try {
    const featuredProperties = await Property.find({
      featured: true,
      status: 'متاح'
    }).limit(8).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        properties: featuredProperties
      }
    });
  } catch (error) {
    console.error('خطأ في جلب العقارات المميزة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب العقارات المميزة'
    });
  }
});

// البحث المتقدم
router.post('/search/advanced', [
  body('filters').isObject().withMessage('المرشحات يجب أن تكون كائن'),
  body('location').optional().isObject().withMessage('الموقع يجب أن يكون كائن')
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

    const { filters, location, sort = { createdAt: -1 } } = req.body;
    
    // بناء الاستعلام
    const query = { status: 'متاح', ...filters };

    // البحث الجغرافي إذا تم توفير الموقع
    if (location && location.lat && location.lng && location.radius) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          $maxDistance: location.radius * 1000 // تحويل من كيلومتر إلى متر
        }
      };
    }

    const properties = await Property.find(query)
      .sort(sort)
      .limit(50);

    res.json({
      success: true,
      data: {
        properties,
        count: properties.length
      }
    });
  } catch (error) {
    console.error('خطأ في البحث المتقدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في البحث المتقدم'
    });
  }
});

module.exports = router;