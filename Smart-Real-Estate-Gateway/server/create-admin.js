const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const createAdmin = async () => {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-real-estate', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('تم الاتصال بقاعدة البيانات');

    // التحقق من وجود مشرف
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@realestate.com' });
    
    if (existingAdmin) {
      console.log('المشرف موجود بالفعل:', existingAdmin.email);
      process.exit(0);
    }

    // إنشاء حساب المشرف
    const admin = new User({
      name: process.env.ADMIN_NAME || 'مدير النظام',
      email: process.env.ADMIN_EMAIL || 'admin@realestate.com',
      password: process.env.ADMIN_PASSWORD || 'Admin123!',
      phone: '+966500000000',
      role: 'admin',
      status: 'active'
    });

    await admin.save();
    
    console.log('تم إنشاء حساب المشرف بنجاح:');
    console.log('البريد الإلكتروني:', admin.email);
    console.log('كلمة المرور:', process.env.ADMIN_PASSWORD || 'Admin123!');
    
  } catch (error) {
    console.error('خطأ في إنشاء المشرف:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

createAdmin();