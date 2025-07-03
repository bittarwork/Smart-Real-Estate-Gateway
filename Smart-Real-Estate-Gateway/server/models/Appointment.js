const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
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
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['زيارة شخصية', 'زيارة افتراضية', 'استشارة', 'تقييم عقار'],
    default: 'زيارة شخصية'
  },
  status: {
    type: String,
    enum: ['معلق', 'مؤكد', 'مكتمل', 'ملغي', 'لم يحضر'],
    default: 'معلق'
  },
  priority: {
    type: String,
    enum: ['منخفض', 'متوسط', 'عالي'],
    default: 'متوسط'
  },
  notes: {
    type: String,
    trim: true
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  meetingLink: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    default: 60, // بالدقائق
    min: 15,
    max: 240
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    date: Date,
    notes: String
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  completedAt: Date,
  confirmedAt: Date,
  cancelledAt: Date
}, {
  timestamps: true
});

// فهرس للبحث والفرز
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });
appointmentSchema.index({ status: 1, priority: 1 });
appointmentSchema.index({ propertyId: 1, status: 1 });
appointmentSchema.index({ assignedAgent: 1, appointmentDate: 1 });

// التحقق من عدم تضارب المواعيد
appointmentSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('appointmentDate') || this.isModified('appointmentTime')) {
    const startTime = new Date(`${this.appointmentDate.toDateString()} ${this.appointmentTime}`);
    const endTime = new Date(startTime.getTime() + (this.duration * 60000));
    
    const conflictingAppointment = await this.constructor.findOne({
      _id: { $ne: this._id },
      assignedAgent: this.assignedAgent,
      status: { $in: ['معلق', 'مؤكد'] },
      $or: [
        {
          appointmentDate: this.appointmentDate,
          appointmentTime: this.appointmentTime
        }
      ]
    });
    
    if (conflictingAppointment) {
      const error = new Error('يوجد موعد آخر في نفس الوقت المحدد');
      error.name = 'ConflictError';
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);