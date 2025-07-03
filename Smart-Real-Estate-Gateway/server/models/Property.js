const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['شقة', 'فيلا', 'بيت', 'مكتب', 'محل', 'أرض', 'استوديو']
  },
  category: {
    type: String,
    required: true,
    enum: ['للبيع', 'للإيجار']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  area: {
    type: Number,
    required: true,
    min: 0
  },
  rooms: {
    type: Number,
    required: true,
    min: 0
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 0
  },
  address: {
    street: String,
    city: {
      type: String,
      required: true
    },
    district: String,
    country: {
      type: String,
      default: 'السعودية'
    }
  },
  location: {
    lat: Number,
    lng: Number
  },
  images: [{
    type: String
  }],
  features: [{
    type: String
  }],
  furnished: {
    type: Boolean,
    default: false
  },
  parking: {
    type: Boolean,
    default: false
  },
  garden: {
    type: Boolean,
    default: false
  },
  elevator: {
    type: Boolean,
    default: false
  },
  security: {
    type: Boolean,
    default: false
  },
  agent: {
    name: String,
    phone: String,
    email: String
  },
  status: {
    type: String,
    enum: ['متاح', 'محجوز', 'مباع', 'مؤجر'],
    default: 'متاح'
  },
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// إنشاء فهرس للبحث النصي
propertySchema.index({
  title: 'text',
  description: 'text',
  'address.city': 'text',
  'address.district': 'text'
});

// إنشاء فهرس للموقع الجغرافي
propertySchema.index({ 'location.lat': 1, 'location.lng': 1 });

module.exports = mongoose.model('Property', propertySchema);