import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [80, 'Name must be less than 80 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  profile: {
    academics: {
      board: {
        type: String,
        enum: ['CBSE', 'ISC', 'State Board', 'ICSE', 'Other'],
        default: 'Other'
      },
      grade12Score: {
        type: Number,
        min: [0, 'Score must be at least 0'],
        max: [100, 'Score must be at most 100']
      },
      entranceExams: [{
        name: {
          type: String,
          required: true
        },
        score: {
          type: Number,
          required: true
        }
      }]
    },
    interests: {
      fieldOfStudy: {
        type: String,
        enum: ['Engineering', 'Medicine', 'Arts', 'Commerce', 'Science', 'Law', 'Other'],
        default: 'Other'
      },
      courses: [String],
      extracurriculars: [String]
    },
    preferences: {
      locations: [String],
      budget: {
        type: Number,
        min: [10000, 'Budget must be at least 10,000'],
        max: [5000000, 'Budget must be at most 5,000,000']
      },
      universityType: [String],
      priorities: [String]
    }
  },
  recommendCounts: {
    date: {
      type: String,
      default: () => new Date().toISOString().split('T')[0] // YYYY-MM-DD
    },
    count: {
      type: Number,
      default: 0
    }
  },
  chatCounts: {
    date: {
      type: String,
      default: () => new Date().toISOString().split('T')[0] // YYYY-MM-DD
    },
    count: {
      type: Number,
      default: 0
    }
  },
  shortlist: [{
    universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    name: String,
    location: String,
    matchScore: Number,
    addedAt: { type: Date, default: Date.now }
  }],
  refreshTokens: [{
    token: { type: String },
    expiresAt: { type: Date }
  }]
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Reset usage counters if date has changed
userSchema.methods.resetCountersIfNewDay = function() {
  const today = new Date().toISOString().split('T')[0];
  
  if (this.recommendCounts.date !== today) {
    this.recommendCounts = { date: today, count: 0 };
  }
  
  if (this.chatCounts.date !== today) {
    this.chatCounts = { date: today, count: 0 };
  }
};

const User = mongoose.model('User', userSchema);

export default User;
