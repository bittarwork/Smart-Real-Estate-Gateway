const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: null
  },
  inquiryType: {
    type: String,
    enum: ['عام', 'استفسار عن عقار', 'طلب زيارة', 'شكوى', 'اقتراح'],
    default: 'عام'
  },
  status: {
    type: String,
    enum: ['جديد', 'قيد المراجعة', 'تم الرد', 'مغلق'],
    default: 'جديد'
  },
  priority: {
    type: String,
    enum: ['منخفض', 'متوسط', 'عالي', 'عاجل'],
    default: 'متوسط'
  },
  source: {
    type: String,
    enum: ['موقع', 'هاتف', 'إيميل', 'واتساب', 'زيارة'],
    default: 'موقع'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  response: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  }],
  followUpDate: Date,
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedAt: Date
  }
}, {
  timestamps: true
});

// إنشاء فهرس للبحث
inquirySchema.index({ name: 'text', email: 'text', subject: 'text', message: 'text' });
inquirySchema.index({ status: 1, priority: 1 });
inquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);