import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  profileSnapshot: {
    type: Object,
    required: true
  },
  universityIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University'
  }],
  aiCounsellorNote: {
    type: String,
    required: true
  },
  promptVersion: {
    type: String,
    default: 'recommendation.v1'
  },
  modelMeta: {
    model: {
      type: String,
      default: 'gemini-pro'
    },
    tokensIn: {
      type: Number,
      default: 0
    },
    tokensOut: {
      type: Number,
      default: 0
    },
    latencyMs: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

export default Recommendation;
