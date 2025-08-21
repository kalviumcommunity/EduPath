import mongoose from 'mongoose';

const universitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'University name is required'],
    trim: true,
    index: true
  },
  location: {
    city: {
      type: String,
      required: false
    },
    state: {
      type: String,
      required: false,
      index: true
    },
    country: {
      type: String,
      index: true
    }
  },
  courses: [{
    name: {
      type: String,
      required: [true, 'Course name is required']
    },
    field: {
      type: String,
      required: [true, 'Field is required'],
      index: true
    },
    annualFee: {
      type: Number,
      required: [true, 'Annual fee is required'],
      index: true
    }
  }],
  benchmarks: {
    placementPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    averageSalary: {
      type: Number,
      min: 0
    },
    ranking: {
      type: Number,
      min: 1
    }
  },
  type: {
    type: String,
    enum: ['research-focused', 'academics-focused', 'placement-focused', 'holistic-development', 'other'],
    default: 'other'
  },
  keyFeatures: [String],
  campusInfo: {
    description: String,
    imageUrl: String
  }
}, {
  timestamps: true
});

// Text index for search
universitySchema.index({ name: 'text', keyFeatures: 'text' });

const University = mongoose.model('University', universitySchema);

export default University;
