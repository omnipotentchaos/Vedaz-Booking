require('dotenv').config();
const mongoose = require('mongoose');
const Expert = require('./models/Expert');

// Generate time slots for a given date
function generateSlots() {
  const slots = [];
  const times = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
  ];
  times.forEach(time => {
    slots.push({ time, isBooked: false });
  });
  return slots;
}

// Generate availability for the next 7 days
function generateAvailability() {
  const availability = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    availability.push({
      date: dateStr,
      slots: generateSlots()
    });
  }
  return availability;
}

const experts = [
  {
    name: 'Dr. Aarav Sharma',
    category: 'Vedic Astrology',
    experience: 15,
    rating: 4.9,
    bio: 'Renowned Vedic astrologer with deep expertise in Kundli analysis, planetary transits, and Dasha predictions. Has helped over 10,000 clients find clarity in their life path through ancient Vedic wisdom.',
    specializations: ['Kundli Analysis', 'Career Guidance', 'Marriage Compatibility', 'Gemstone Recommendations'],
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=aarav&backgroundColor=b6e3f4',
    pricePerSession: 1500,
    availability: generateAvailability()
  },
  {
    name: 'Pandit Rajesh Mishra',
    category: 'Vedic Astrology',
    experience: 22,
    rating: 4.8,
    bio: 'A third-generation astrologer specializing in remedial astrology and Vastu Shastra. Expert in Nadi astrology and predictive techniques passed down through his lineage.',
    specializations: ['Nadi Astrology', 'Vastu Shastra', 'Remedial Measures', 'Muhurat Selection'],
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=rajesh&backgroundColor=c0aede',
    pricePerSession: 2000,
    availability: generateAvailability()
  },
  {
    name: 'Dr. Priya Patel',
    category: 'Numerology',
    experience: 10,
    rating: 4.7,
    bio: 'Expert numerologist combining Chaldean and Pythagorean systems with modern data science. Specializes in name corrections, business naming, and life path analysis.',
    specializations: ['Name Correction', 'Business Numerology', 'Life Path Analysis', 'Lucky Numbers'],
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=priya&backgroundColor=ffd5dc',
    pricePerSession: 1200,
    availability: generateAvailability()
  },
  {
    name: 'Acharya Vikram Desai',
    category: 'Palmistry',
    experience: 18,
    rating: 4.6,
    bio: 'Master palm reader with expertise in both Indian and Western palmistry traditions. Uses advanced pattern recognition to decode life events and potential through palm lines.',
    specializations: ['Hand Analysis', 'Future Prediction', 'Health Indicators', 'Career Mapping'],
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=vikram&backgroundColor=d1d4f9',
    pricePerSession: 1000,
    availability: generateAvailability()
  },
  {
    name: 'Dr. Meera Joshi',
    category: 'Tarot Reading',
    experience: 12,
    rating: 4.9,
    bio: 'Internationally certified tarot reader and intuitive counselor. Combines traditional Rider-Waite tarot with modern psychological insights for transformative readings.',
    specializations: ['Love & Relationships', 'Career Decisions', 'Spiritual Growth', 'Monthly Forecasts'],
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=meera&backgroundColor=ffdfbf',
    pricePerSession: 1800,
    availability: generateAvailability()
  },
  {
    name: 'Guruji Suresh Iyer',
    category: 'Vedic Astrology',
    experience: 30,
    rating: 5.0,
    bio: 'One of India\'s most revered Vedic astrologers with three decades of practice. Presidential award recipient for contributions to astrological sciences. Celebrity astrologer.',
    specializations: ['Prashna Kundli', 'Annual Predictions', 'Political Astrology', 'Stock Market Astrology'],
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=suresh&backgroundColor=c0aede',
    pricePerSession: 5000,
    availability: generateAvailability()
  },
  {
    name: 'Ritu Kapoor',
    category: 'Tarot Reading',
    experience: 8,
    rating: 4.5,
    bio: 'Modern tarot practitioner who blends Oracle cards with Angel therapy. Known for her compassionate approach and accurate predictions in matters of love and relationships.',
    specializations: ['Angel Card Reading', 'Relationship Guidance', 'Past Life Reading', 'Energy Healing'],
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ritu&backgroundColor=ffd5dc',
    pricePerSession: 900,
    availability: generateAvailability()
  },
  {
    name: 'Dr. Arjun Reddy',
    category: 'Numerology',
    experience: 14,
    rating: 4.8,
    bio: 'PhD in Mathematics turned numerologist. Applies statistical modeling to numerological patterns for highly accurate life predictions and business consultations.',
    specializations: ['Corporate Numerology', 'Mobile Number Selection', 'Date Selection', 'Financial Numerology'],
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=arjun&backgroundColor=b6e3f4',
    pricePerSession: 1600,
    availability: generateAvailability()
  },
  {
    name: 'Swami Anand Bharati',
    category: 'Vastu Shastra',
    experience: 25,
    rating: 4.7,
    bio: 'Vastu Shastra grandmaster who has consulted for Fortune 500 companies and political leaders. Expert in commercial and residential Vastu corrections without demolition.',
    specializations: ['Home Vastu', 'Office Vastu', 'Industrial Vastu', 'Vastu Remedies'],
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=anand&backgroundColor=d1d4f9',
    pricePerSession: 3000,
    availability: generateAvailability()
  },
  {
    name: 'Nisha Verma',
    category: 'Feng Shui',
    experience: 11,
    rating: 4.6,
    bio: 'Certified Feng Shui consultant trained in Hong Kong. Specializes in space clearing, energy optimization, and creating harmonious living and work environments.',
    specializations: ['Space Clearing', 'Wealth Corner Activation', 'Color Therapy', 'Crystal Placement'],
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=nisha&backgroundColor=ffdfbf',
    pricePerSession: 2500,
    availability: generateAvailability()
  },
  {
    name: 'Pandit Devendra Shastri',
    category: 'Vedic Astrology',
    experience: 20,
    rating: 4.4,
    bio: 'Classical Vedic astrologer specializing in KP (Krishnamurti Paddhati) system. Known for pinpoint timing of events and accurate sub-lord analysis.',
    specializations: ['KP Astrology', 'Event Timing', 'Lost Object Recovery', 'Electional Astrology'],
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=devendra&backgroundColor=c0aede',
    pricePerSession: 1400,
    availability: generateAvailability()
  },
  {
    name: 'Dr. Kavita Singh',
    category: 'Palmistry',
    experience: 16,
    rating: 4.8,
    bio: 'Research-oriented palmist who has published extensively on dermatoglyphics and personality analysis. Combines medical knowledge with traditional palm reading techniques.',
    specializations: ['Dermatoglyphics', 'Child Talent Mapping', 'Health Palmistry', 'Personality Analysis'],
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=kavita&backgroundColor=ffd5dc',
    pricePerSession: 1300,
    availability: generateAvailability()
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Expert.deleteMany({});
    console.log('🗑️  Cleared existing experts');

    // Insert seed data
    const created = await Expert.insertMany(experts);
    console.log(`🌱 Seeded ${created.length} experts`);

    // Log created expert IDs for reference
    created.forEach(expert => {
      console.log(`   - ${expert.name} (${expert.category}) → ID: ${expert._id}`);
    });

    await mongoose.disconnect();
    console.log('✅ Done! Database seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
