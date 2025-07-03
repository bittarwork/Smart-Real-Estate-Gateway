const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// استيراد المتحكمات والمسارات
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const inquiryRoutes = require('./routes/inquiries');
const appointmentRoutes = require('./routes/appointments');
const adminRoutes = require('./routes/admin');

// استيراد المعالجات
const errorHandler = require('./middleware/errorHandler');

const app = express();

// إعدادات الأمان
app.use(helmet());

// إعدادات CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// إعدادات التسجيل
app.use(morgan('combined'));

// معالجة البيانات
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ملفات الرفع الثابتة
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// اتصال قاعدة البيانات
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-real-estate', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB متصل: ${conn.connection.host}`);
  } catch (error) {
    console.error('خطأ في الاتصال بقاعدة البيانات:', error);
    process.exit(1);
  }
};

// اتصال قاعدة البيانات
connectDB();

// المسارات الأساسية
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);

// مسار الصحة
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'الخادم يعمل بشكل طبيعي',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// مسار الإحصائيات العامة
app.get('/api/stats', async (req, res) => {
  try {
    const Property = require('./models/Property');
    const Inquiry = require('./models/Inquiry');
    const Appointment = require('./models/Appointment');
    const User = require('./models/User');

    const [
      totalProperties,
      totalInquiries,
      totalAppointments,
      totalUsers,
      availableProperties,
      pendingInquiries,
      todayAppointments
    ] = await Promise.all([
      Property.countDocuments(),
      Inquiry.countDocuments(),
      Appointment.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Property.countDocuments({ status: 'متاح' }),
      Inquiry.countDocuments({ status: 'جديد' }),
      Appointment.countDocuments({ 
        appointmentDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    ]);

    res.json({
      properties: {
        total: totalProperties,
        available: availableProperties,
        sold: totalProperties - availableProperties
      },
      inquiries: {
        total: totalInquiries,
        pending: pendingInquiries,
        responded: totalInquiries - pendingInquiries
      },
      appointments: {
        total: totalAppointments,
        today: todayAppointments
      },
      users: {
        total: totalUsers
      }
    });
  } catch (error) {
    console.error('خطأ في جلب الإحصائيات:', error);
    res.status(500).json({ message: 'خطأ في جلب الإحصائيات' });
  }
});

// معالج الأخطاء 404
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'المسار غير موجود',
    path: req.originalUrl
  });
});

// معالج الأخطاء العام
app.use(errorHandler);

// إعدادات الخادم
const PORT = process.env.PORT || 5000;

// معالجة الإغلاق الآمن
process.on('SIGTERM', () => {
  console.log('تم استلام إشارة SIGTERM، جاري إغلاق الخادم بأمان...');
  mongoose.connection.close(() => {
    console.log('تم إغلاق اتصال قاعدة البيانات');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('تم استلام إشارة SIGINT، جاري إغلاق الخادم بأمان...');
  mongoose.connection.close(() => {
    console.log('تم إغلاق اتصال قاعدة البيانات');
    process.exit(0);
  });
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
  console.log(`البيئة: ${process.env.NODE_ENV || 'development'}`);
});