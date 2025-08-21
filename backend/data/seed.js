import mongoose from 'mongoose';
import 'dotenv/config';
import { logger } from '../src/utils/logger.js';
import University from '../src/models/university.model.js';

// Sample university data
const universities = [
  {
    name: "Indian Institute of Technology, Delhi",
    location: {
      city: "New Delhi",
      state: "Delhi"
    },
    courses: [
      {
        name: "B.Tech in Computer Science",
        field: "Engineering",
        annualFee: 220000
      },
      {
        name: "B.Tech in Electrical Engineering",
        field: "Engineering",
        annualFee: 210000
      },
      {
        name: "B.Tech in Mechanical Engineering",
        field: "Engineering",
        annualFee: 200000
      }
    ],
    benchmarks: {
      placementPercentage: 98,
      averageSalary: 2000000,
      ranking: 1
    },
    type: "research-focused",
    keyFeatures: [
      "Top-ranked engineering institute in India",
      "World-class research facilities",
      "Strong industry connections",
      "Vibrant campus life",
      "Distinguished alumni network"
    ],
    campusInfo: {
      description: "Sprawling campus with modern facilities, libraries, and research centers",
      imageUrl: "https://example.com/iit-delhi.jpg"
    }
  },
  {
    name: "Indian Institute of Technology, Bombay",
    location: {
      city: "Mumbai",
      state: "Maharashtra"
    },
    courses: [
      {
        name: "B.Tech in Computer Science",
        field: "Engineering",
        annualFee: 225000
      },
      {
        name: "B.Tech in Electronics",
        field: "Engineering",
        annualFee: 215000
      },
      {
        name: "B.Tech in Civil Engineering",
        field: "Engineering",
        annualFee: 205000
      }
    ],
    benchmarks: {
      placementPercentage: 97,
      averageSalary: 1950000,
      ranking: 2
    },
    type: "research-focused",
    keyFeatures: [
      "Premier technical institute",
      "Excellent placement record",
      "Strong focus on innovation",
      "Cutting-edge research facilities",
      "Diverse student community"
    ],
    campusInfo: {
      description: "Beautiful campus situated in Powai with state-of-the-art infrastructure",
      imageUrl: "https://example.com/iit-bombay.jpg"
    }
  },
  {
    name: "Indian Institute of Technology, Madras",
    location: {
      city: "Chennai",
      state: "Tamil Nadu"
    },
    courses: [
      {
        name: "B.Tech in Computer Science",
        field: "Engineering",
        annualFee: 215000
      },
      {
        name: "B.Tech in Data Science",
        field: "Engineering",
        annualFee: 220000
      },
      {
        name: "B.Tech in Aerospace Engineering",
        field: "Engineering",
        annualFee: 210000
      }
    ],
    benchmarks: {
      placementPercentage: 96,
      averageSalary: 1900000,
      ranking: 3
    },
    type: "research-focused",
    keyFeatures: [
      "Renowned for research excellence",
      "Industry-sponsored projects",
      "Strong entrepreneurship ecosystem",
      "IIT Madras Research Park proximity",
      "Active student technical clubs"
    ],
    campusInfo: {
      description: "Lush green campus with a unique ecosystem including deer park",
      imageUrl: "https://example.com/iit-madras.jpg"
    }
  },
  {
    name: "Delhi University, North Campus",
    location: {
      city: "New Delhi",
      state: "Delhi"
    },
    courses: [
      {
        name: "B.A. Economics (Hons)",
        field: "Arts",
        annualFee: 30000
      },
      {
        name: "B.Com (Hons)",
        field: "Commerce",
        annualFee: 25000
      },
      {
        name: "B.Sc. Physics (Hons)",
        field: "Science",
        annualFee: 28000
      }
    ],
    benchmarks: {
      placementPercentage: 82,
      averageSalary: 800000,
      ranking: 10
    },
    type: "academics-focused",
    keyFeatures: [
      "Prestigious liberal arts education",
      "Diverse course offerings",
      "Rich cultural campus life",
      "Renowned faculty members",
      "Historic campus architecture"
    ],
    campusInfo: {
      description: "Historic campus with colonial architecture and extensive libraries",
      imageUrl: "https://example.com/du-north.jpg"
    }
  },
  {
    name: "St. Stephen's College",
    location: {
      city: "New Delhi",
      state: "Delhi"
    },
    courses: [
      {
        name: "B.A. English (Hons)",
        field: "Arts",
        annualFee: 45000
      },
      {
        name: "B.Sc. Mathematics (Hons)",
        field: "Science",
        annualFee: 40000
      },
      {
        name: "B.A. History (Hons)",
        field: "Arts",
        annualFee: 42000
      }
    ],
    benchmarks: {
      placementPercentage: 85,
      averageSalary: 850000,
      ranking: 5
    },
    type: "academics-focused",
    keyFeatures: [
      "Elite liberal arts education",
      "Heritage institution",
      "Strong alumni network",
      "Holistic development focus",
      "Small class sizes with personalized attention"
    ],
    campusInfo: {
      description: "Historic campus with distinctive red brick architecture",
      imageUrl: "https://example.com/stephens.jpg"
    }
  },
  {
    name: "All India Institute of Medical Sciences",
    location: {
      city: "New Delhi",
      state: "Delhi"
    },
    courses: [
      {
        name: "MBBS",
        field: "Medicine",
        annualFee: 150000
      },
      {
        name: "B.Sc. Nursing",
        field: "Medicine",
        annualFee: 95000
      },
      {
        name: "B.Sc. Paramedical",
        field: "Medicine",
        annualFee: 85000
      }
    ],
    benchmarks: {
      placementPercentage: 100,
      averageSalary: 1800000,
      ranking: 1
    },
    type: "research-focused",
    keyFeatures: [
      "Premier medical education institute",
      "Cutting-edge medical research",
      "State-of-the-art hospital facilities",
      "World-renowned faculty",
      "Top NEET scores required for admission"
    ],
    campusInfo: {
      description: "Comprehensive medical campus with attached teaching hospital",
      imageUrl: "https://example.com/aiims.jpg"
    }
  },
  {
    name: "National Law School of India University",
    location: {
      city: "Bangalore",
      state: "Karnataka"
    },
    courses: [
      {
        name: "B.A. LL.B. (Hons)",
        field: "Law",
        annualFee: 220000
      },
      {
        name: "LL.M.",
        field: "Law",
        annualFee: 180000
      }
    ],
    benchmarks: {
      placementPercentage: 95,
      averageSalary: 1500000,
      ranking: 1
    },
    type: "academics-focused",
    keyFeatures: [
      "Top law school in India",
      "Rigorous legal education",
      "Excellent moot court facilities",
      "Distinguished legal faculty",
      "Strong placement in top law firms"
    ],
    campusInfo: {
      description: "Modern campus dedicated to legal education with extensive library",
      imageUrl: "https://example.com/nlsiu.jpg"
    }
  },
  {
    name: "Indian Institute of Management, Ahmedabad",
    location: {
      city: "Ahmedabad",
      state: "Gujarat"
    },
    courses: [
      {
        name: "MBA",
        field: "Commerce",
        annualFee: 2300000
      },
      {
        name: "Executive MBA",
        field: "Commerce",
        annualFee: 2800000
      }
    ],
    benchmarks: {
      placementPercentage: 100,
      averageSalary: 2800000,
      ranking: 1
    },
    type: "placement-focused",
    keyFeatures: [
      "Premier management institute",
      "Case-based teaching methodology",
      "Industry-leading placements",
      "Distinguished alumni network",
      "Iconic campus architecture"
    ],
    campusInfo: {
      description: "Iconic red brick campus designed by Louis Kahn",
      imageUrl: "https://example.com/iima.jpg"
    }
  },
  {
    name: "Birla Institute of Technology and Science, Pilani",
    location: {
      city: "Pilani",
      state: "Rajasthan"
    },
    courses: [
      {
        name: "B.Tech in Computer Science",
        field: "Engineering",
        annualFee: 245000
      },
      {
        name: "B.Tech in Electronics",
        field: "Engineering",
        annualFee: 235000
      },
      {
        name: "M.Sc. Economics",
        field: "Arts",
        annualFee: 215000
      }
    ],
    benchmarks: {
      placementPercentage: 92,
      averageSalary: 1600000,
      ranking: 8
    },
    type: "holistic-development",
    keyFeatures: [
      "No attendance requirement",
      "Flexible curriculum",
      "Practice School program for industry exposure",
      "Strong entrepreneurship culture",
      "Active technical festivals"
    ],
    campusInfo: {
      description: "Self-contained campus in the desert town of Pilani",
      imageUrl: "https://example.com/bits.jpg"
    }
  },
  {
    name: "Chandigarh University",
    location: {
      city: "Chandigarh",
      state: "Punjab"
    },
    courses: [
      {
        name: "B.Tech in Computer Science",
        field: "Engineering",
        annualFee: 180000
      },
      {
        name: "BBA",
        field: "Commerce",
        annualFee: 150000
      },
      {
        name: "B.Pharm",
        field: "Medicine",
        annualFee: 165000
      }
    ],
    benchmarks: {
      placementPercentage: 85,
      averageSalary: 800000,
      ranking: 25
    },
    type: "placement-focused",
    keyFeatures: [
      "Modern campus infrastructure",
      "Strong industry connections",
      "International collaborations",
      "Active placement cell",
      "Emphasis on practical learning"
    ],
    campusInfo: {
      description: "Sprawling 30-acre campus with modern amenities",
      imageUrl: "https://example.com/chandigarh-univ.jpg"
    }
  }
];

const seedDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB connected');
    
    // Clean existing data
    await University.deleteMany({});
    logger.info('Cleared university collection');
    
    // Insert new data
    await University.insertMany(universities);
    logger.info(`Seeded ${universities.length} universities`);
    
    // Disconnect
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error(`Error seeding database: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

seedDB();
