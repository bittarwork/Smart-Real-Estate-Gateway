# موقع الشركة العقارية - وثائق المشروع الشاملة

## 📋 نظرة عامة على المشروع

### اسم المشروع

**بوابة العقارات الذكية - Smart Real Estate Gateway**

### الوصف

موقع إلكتروني متكامل لشركة عقارية يخدم فئتين رئيسيتين:

- **الزبائن**: تصفح وبحث واستفسار عن العقارات
- **الإداريين**: إدارة العقارات والمحتوى والاستفسارات

---

## 🎯 الأهداف والميزات

### للزبائن (العملاء)

- ✅ تصفح العقارات بطريقة تفاعلية
- ✅ البحث والتصفية المتقدمة
- ✅ عرض تفاصيل العقار مع الصور والخريطة
- ✅ نظام المفضلة ومقارنة العقارات
- ✅ طلب معاينة وإرسال استفسارات
- ✅ حاسبة التمويل
- ✅ نظام التقييمات والمراجعات
- ✅ مشاركة العقارات على وسائل التواصل

### للإداريين

- ✅ لوحة تحكم شاملة مع الإحصائيات
- ✅ إدارة العقارات (إضافة/تعديل/حذف)
- ✅ إدارة الاستفسارات والردود
- ✅ إدارة محتوى الموقع والمدونة
- ✅ تقارير مفصلة عن الأداء

---

## 🛠 التقنيات المستخدمة

### Frontend

- **React.js 18** - مكتبة واجهة المستخدم
- **React Router** - التنقل بين الصفحات
- **Axios** - طلبات HTTP
- **Bootstrap 5** - تصميم واجهة المستخدم
- **React Icons** - الأيقونات
- **Chart.js** - الرسوم البيانية
- **Google Maps API** - عرض الخرائط

### Backend

- **Node.js** - بيئة تشغيل JavaScript
- **Express.js** - إطار عمل الخادم
- **MongoDB** - قاعدة البيانات
- **Mongoose** - ODM لـ MongoDB
- **JWT** - التوثيق والأمان
- **Multer** - رفع الملفات
- **Nodemailer** - إرسال البريد الإلكتروني
- **bcrypt** - تشفير كلمات المرور

### أدوات التطوير

- **VS Code** - محرر الكود
- **Postman** - اختبار APIs
- **Git/GitHub** - إدارة الإصدارات
- **npm** - إدارة الحزم

---

## 🏗 هيكل المشروع

### Frontend Structure

```
client/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.js
│   │   │   ├── Footer.js
│   │   │   ├── Loading.js
│   │   │   └── Pagination.js
│   │   ├── property/
│   │   │   ├── PropertyCard.js
│   │   │   ├── PropertyList.js
│   │   │   ├── PropertyDetails.js
│   │   │   ├── PropertyGallery.js
│   │   │   ├── PropertySearch.js
│   │   │   └── PropertyFilter.js
│   │   ├── forms/
│   │   │   ├── ContactForm.js
│   │   │   ├── InquiryForm.js
│   │   │   └── ViewingRequest.js
│   │   └── admin/
│   │       ├── AdminLayout.js
│   │       ├── PropertyForm.js
│   │       └── Dashboard.js
│   ├── pages/
│   │   ├── client/
│   │   │   ├── Home.js
│   │   │   ├── Properties.js
│   │   │   ├── PropertyDetail.js
│   │   │   ├── About.js
│   │   │   └── Contact.js
│   │   └── admin/
│   │       ├── AdminDashboard.js
│   │       ├── ManageProperties.js
│   │       └── ManageInquiries.js
│   ├── utils/
│   │   ├── api.js
│   │   ├── auth.js
│   │   └── helpers.js
│   ├── styles/
│   │   └── main.css
│   └── App.js
└── package.json
```

### Backend Structure

```
server/
├── models/
│   ├── Property.js
│   ├── Inquiry.js
│   ├── User.js
│   └── Review.js
├── routes/
│   ├── auth.js
│   ├── properties.js
│   ├── inquiries.js
│   └── admin.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── controllers/
│   ├── propertyController.js
│   └── inquiryController.js
├── utils/
│   ├── email.js
│   └── validation.js
├── config/
│   └── database.js
├── uploads/
└── server.js
```

---

## 💾 تصميم قاعدة البيانات

### Property Schema

```javascript
{
  title: String,              // عنوان العقار
  description: String,        // وصف مفصل
  price: Number,             // السعر
  location: String,          // الموقع
  coordinates: {             // إحداثيات للخريطة
    lat: Number,
    lng: Number
  },
  type: String,              // نوع العقار (شقة، فيلا، مكتب)
  category: String,          // للبيع أو للإيجار
  bedrooms: Number,          // عدد الغرف
  bathrooms: Number,         // عدد الحمامات
  area: Number,              // المساحة بالمتر المربع
  images: [String],          // مسارات الصور
  features: [String],        // المميزات (مسبح، حديقة...)
  isFeatured: Boolean,       // عقار مميز
  isAvailable: Boolean,      // متاح للعرض
  views: Number,             // عدد المشاهدات
  averageRating: Number,     // متوسط التقييم
  ratingsCount: Number,      // عدد التقييمات
  createdAt: Date,
  updatedAt: Date
}
```

### Inquiry Schema

```javascript
{
  name: String,              // اسم المستفسر
  email: String,             // البريد الإلكتروني
  phone: String,             // رقم الهاتف
  message: String,           // رسالة الاستفسار
  propertyId: ObjectId,      // معرف العقار
  type: String,              // نوع الاستفسار
  status: String,            // حالة الاستفسار
  adminReply: String,        // رد الإدارة
  createdAt: Date
}
```

### User Schema (Admin)

```javascript
{
  username: String,
  email: String,
  password: String,          // مشفرة
  role: String,              // admin
  createdAt: Date
}
```

### Review Schema

```javascript
{
  propertyId: ObjectId,
  rating: Number,            // 1-5 نجوم
  comment: String,
  reviewerName: String,
  reviewerEmail: String,
  createdAt: Date
}
```

---

## 🔗 واجهات برمجة التطبيقات (APIs)

### Property APIs

```javascript
GET    /api/properties           // جلب جميع العقارات
GET    /api/properties/:id       // جلب عقار محدد
POST   /api/properties           // إضافة عقار جديد (Admin)
PUT    /api/properties/:id       // تعديل عقار (Admin)
DELETE /api/properties/:id       // حذف عقار (Admin)
GET    /api/properties/search    // البحث والتصفية
GET    /api/properties/featured  // العقارات المميزة
```

### Inquiry APIs

```javascript
GET    /api/inquiries            // جلب الاستفسارات (Admin)
POST   /api/inquiries            // إرسال استفسار
PUT    /api/inquiries/:id        // تحديث حالة الاستفسار (Admin)
DELETE /api/inquiries/:id        // حذف استفسار (Admin)
```

### Auth APIs

```javascript
POST / api / auth / login; // تسجيل دخول المدير
POST / api / auth / logout; // تسجيل خروج
GET / api / auth / verify; // التحقق من صحة الجلسة
```

### Review APIs

```javascript
GET    /api/reviews/:propertyId  // جلب تقييمات العقار
POST   /api/reviews              // إضافة تقييم
```

---

## ⚙️ كيفية عمل النظام

### 1. عرض العقارات للزبائن

```
المستخدم يدخل الموقع
↓
تحميل الصفحة الرئيسية
↓
عرض العقارات المميزة من قاعدة البيانات
↓
إمكانية البحث والتصفية
↓
عرض النتائج مع التصفح
```

### 2. تفاصيل العقار

```
المستخدم ينقر على عقار
↓
جلب تفاصيل العقار من قاعدة البيانات
↓
عرض الصور والمعلومات والخريطة
↓
تحديث عدد المشاهدات
↓
عرض العقارات المشابهة
```

### 3. إدارة العقارات (Admin)

```
المدير يسجل دخول
↓
التحقق من JWT Token
↓
عرض لوحة التحكم
↓
إضافة/تعديل/حذف العقارات
↓
رفع الصور إلى الخادم
↓
حفظ البيانات في قاعدة البيانات
```

### 4. نظام الاستفسارات

```
الزبون يملأ نموذج الاستفسار
↓
إرسال البيانات إلى الخادم
↓
حفظ في قاعدة البيانات
↓
إرسال إشعار للمدير (email)
↓
المدير يرد على الاستفسار
↓
إرسال الرد للزبون (email)
```

---

## 📊 الميزات المتقدمة

### 1. نظام البحث والتصفية

- البحث بالنص في العنوان والوصف
- التصفية حسب النوع (شقة، فيلا...)
- التصفية حسب الفئة (بيع، إيجار)
- التصفية حسب السعر (نطاق)
- التصفية حسب المساحة
- ترتيب النتائج (السعر، التاريخ، المساحة)

### 2. حاسبة التمويل

```javascript
// مثال على حساب القسط الشهري
const calculateMonthlyPayment = (principal, rate, years) => {
  const monthlyRate = rate / 100 / 12;
  const numberOfPayments = years * 12;
  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  return monthlyPayment;
};
```

### 3. نظام المفضلة

- حفظ العقارات المفضلة في Local Storage
- إمكانية إضافة/إزالة من المفضلة
- عرض قائمة المفضلة
- مشاركة قائمة المفضلة

### 4. مقارنة العقارات

- اختيار حتى 3 عقارات للمقارنة
- عرض المقارنة في جدول
- مقارنة السعر، المساحة، المواصفات

---

## 🔒 الأمان والحماية

### 1. تشفير كلمات المرور

```javascript
const bcrypt = require("bcrypt");
const saltRounds = 10;

// تشفير كلمة المرور
const hashedPassword = await bcrypt.hash(password, saltRounds);

// التحقق من كلمة المرور
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 2. JWT Authentication

```javascript
const jwt = require("jsonwebtoken");

// إنشاء Token
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

// التحقق من Token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### 3. حماية من XSS و SQL Injection

- تنظيف المدخلات
- استخدام Mongoose ODM
- تشفير البيانات الحساسة

---

## 📅 خطة التطوير (10 أسابيع)

### المرحلة 1: الأساسيات (3 أسابيع)

**الأسبوع 1:**

- إعداد بيئة العمل
- إنشاء مشروع React و Express
- تصميم قاعدة البيانات

**الأسبوع 2:**

- تطوير الواجهة الأساسية
- إنشاء مكونات Header/Footer
- تصميم الصفحة الرئيسية

**الأسبوع 3:**

- ربط Frontend بـ Backend
- إنشاء APIs الأساسية
- اختبار الاتصال بقاعدة البيانات

### المرحلة 2: وظائف العقارات (3 أسابيع)

**الأسبوع 4:**

- عرض قائمة العقارات
- تطوير PropertyCard و PropertyList
- إضافة Pagination

**الأسبوع 5:**

- صفحة تفاصيل العقار
- معرض الصور
- دمج Google Maps

**الأسبوع 6:**

- نظام البحث والتصفية
- نظام المفضلة
- مقارنة العقارات

### المرحلة 3: لوحة الإدارة (2 أسبوع)

**الأسبوع 7:**

- نظام تسجيل الدخول
- لوحة التحكم الرئيسية
- إدارة العقارات (CRUD)

**الأسبوع 8:**

- إدارة الاستفسارات
- نظام رفع الصور
- إحصائيات وتقارير

### المرحلة 4: الميزات المتقدمة (1 أسبوع)

**الأسبوع 9:**

- حاسبة التمويل
- نظام التقييمات
- تكامل وسائل التواصل
- نظام المراسلة الإلكترونية

### المرحلة 5: الاختبار والنشر (1 أسبوع)

**الأسبوع 10:**

- اختبار شامل للنظام
- إصلاح الأخطاء
- تحسين الأداء
- النشر على الخادم

---

## 🚀 النشر والاستضافة

### خيارات النشر

1. **Heroku** - سهل ومجاني للمشاريع الصغيرة
2. **Vercel** - ممتاز لـ React Applications
3. **AWS** - خيار متقدم ومرن
4. **DigitalOcean** - VPS مع تحكم كامل

### متطلبات النشر

- MongoDB Atlas (قاعدة بيانات سحابية)
- Cloudinary أو AWS S3 (تخزين الصور)
- Domain name
- SSL Certificate

---

## 📈 تحسينات مستقبلية

### المرحلة الثانية (اختيارية)

- تطبيق موبايل React Native
- نظام الإحالات والعمولات
- تكامل مع أنظمة CRM
- خدمة العملاء المباشرة (Live Chat)
- نظام إدارة المواعيد
- تقارير مالية متقدمة

---

## 📞 الدعم والصيانة

### وثائق المطور

- كود مُعلق ومنظم
- دليل المستخدم
- دليل الإدارة
- دليل النشر والصيانة

### النسخ الاحتياطية

- نسخ احتياطية يومية لقاعدة البيانات
- نسخ احتياطية للصور والملفات
- خطة استرداد في حالة الطوارئ

---

_تم إعداد هذا المستند كدليل شامل لمشروع موقع الشركة العقارية_
_للتحديثات والاستفسارات، يرجى مراجعة فريق التطوير_
