import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { School, SchoolLevelConfig, WebsiteContent } from '../types';
import { cleanForFirestore } from '../utils/firestoreHelper';

export const DEFAULT_LEVELS: SchoolLevelConfig[] = [
  { id: 'lvl-pg', name: 'Playgroup', category: 'Early Years', ageRange: '2 - 3 Yrs', order: 1 },
  { id: 'lvl-pp1', name: 'PP1', category: 'Early Years', ageRange: '4 Yrs', order: 2 },
  { id: 'lvl-pp2', name: 'PP2', category: 'Early Years', ageRange: '5 Yrs', order: 3 },
  { id: 'lvl-g1', name: 'Grade 1', category: 'Lower Primary', ageRange: '6 Yrs', order: 4 },
  { id: 'lvl-g2', name: 'Grade 2', category: 'Lower Primary', ageRange: '7 Yrs', order: 5 },
  { id: 'lvl-g3', name: 'Grade 3', category: 'Lower Primary', ageRange: '8 Yrs', order: 6 },
  { id: 'lvl-g4', name: 'Grade 4', category: 'Upper Primary', ageRange: '9 Yrs', order: 7 },
  { id: 'lvl-g5', name: 'Grade 5', category: 'Upper Primary', ageRange: '10 Yrs', order: 8 },
  { id: 'lvl-g6', name: 'Grade 6', category: 'Upper Primary', ageRange: '11 Yrs', order: 9 },
  { id: 'lvl-g7', name: 'Grade 7', category: 'Junior School', ageRange: '12 Yrs', order: 10 },
  { id: 'lvl-g8', name: 'Grade 8', category: 'Junior School', ageRange: '13 Yrs', order: 11 },
  { id: 'lvl-g9', name: 'Grade 9', category: 'Junior School', ageRange: '14 Yrs', order: 12 },
];

export const DEFAULT_SCHOOL_ID = 'primary-school';

export const DEFAULT_SCHOOL: School = {
  id: DEFAULT_SCHOOL_ID,
  name: 'New Primary School',
  code: 'SCHOOL',
  motto: 'Excellence in Learning',
  address: '',
  county: '',
  phone: '',
  email: '',
  website: '',
  currency: 'KES',
  currencySymbol: 'KSh',
  academicYear: '2026',
  currentTerm: 'Term 1',
  status: 'ACTIVE',
  levels: DEFAULT_LEVELS,
  primaryColor: '#1e3a8a', // Deep royal navy
  accentColor: '#ea580c', // Vibrant school orange
  logoUrl: '/school_logo.svg',
  termDates: {
    term1Start: '2026-01-05',
    term1End: '2026-04-03',
    term2Start: '2026-04-27',
    term2End: '2026-07-31',
    term3Start: '2026-08-24',
    term3End: '2026-10-30',
  },
  paymentSettings: {
    mpesaPaybill: '',
    mpesaAccountNumber: '',
    mpesaTill: '',
    bankName: '',
    bankAccountName: 'Primary School ERP Collection A/C',
    bankAccountNumber: '',
    bankBranch: '',
    invoiceDueDays: 14,
    taxRegistrationNumber: '',
  },
  cbcGradingSettings: {
    eeMinScore: 80,
    meMinScore: 50,
    aeMinScore: 30,
    beMinScore: 0,
    eeRemark: 'Exceeding Expectations - Outstanding Mastery & Innovation',
    meRemark: 'Meeting Expectations - Proficient in Key Competencies',
    aeRemark: 'Approaching Expectations - Developing Competence, Needs Practice',
    beRemark: 'Below Expectations - Requires Targeted Teacher Support',
  },
  systemPreferences: {
    enableSmsAlerts: true,
    enableEmailAlerts: true,
    smsSenderId: '',
    autoFeeReminderDays: 7,
    allowOnlineAdmissions: true,
    enableDailyAttendanceSms: true,
    allowParentReportCardDownload: true,
    inactivityTimeoutMinutes: 5,
    enableGoogleAuth: true,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_WEBSITE_CONTENT: WebsiteContent = {
  id: 'cms-main',
  schoolId: DEFAULT_SCHOOL_ID,
  heroTitle: 'Nurturing Young Minds, Building Future Leaders',
  heroSubtitle: 'A modern primary and junior school management platform supporting Playgroup through Grade 9 and CBC learning.',
  heroBannerUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=80',
  logoUrl: '/school_logo.svg',
  heroOverlayOpacity: 20,
  heroOverlayStyle: 'clear-glass',
  heroSlides: [
    {
      id: 'slide-1',
      title: 'Nurturing Young Minds, Building Future Leaders',
      subtitle: 'A modern primary and junior school management platform supporting Playgroup through Grade 9 and CBC learning.',
      imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=80',
      badgeText: 'Leading CBC Competency-Based Education in Kasarani Mwiki',
      buttonText: 'Enroll Your Child (2026 Intake)',
      buttonLink: 'admission',
      order: 1,
      isActive: true,
      overlayOpacity: 20,
    },
    {
      id: 'slide-2',
      title: 'State-of-the-Art Science Labs & Coding Studios',
      subtitle: 'Hands-on experiential learning where young scientists and tech innovators build robotics, automated agriculture, and digital solutions.',
      imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=80',
      badgeText: 'Junior School STEAM & Robotics Hub',
      buttonText: 'Explore Facilities & Labs',
      buttonLink: 'facilities',
      order: 2,
      isActive: true,
      overlayOpacity: 20,
    },
    {
      id: 'slide-3',
      title: 'Nurturing Talent in Arts, Music & Olympic Swimming',
      subtitle: 'Dedicated coaches and certified music tutors developing champion athletes, ballet performers, and musical virtuosos.',
      imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1600&q=80',
      badgeText: 'Holistic Co-Curricular & Sports Excellence',
      buttonText: 'View Co-Curricular Programs',
      buttonLink: 'gallery',
      order: 3,
      isActive: true,
      overlayOpacity: 20,
    },
  ],
  typography: {
    heroTitle: {
      fontSize: '5xl',
      fontWeight: 'black',
      fontStyle: 'normal',
      textAlign: 'left',
      fontFamily: 'sans',
      textColor: '#ffffff',
    },
    heroSubtitle: {
      fontSize: 'lg',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      fontFamily: 'sans',
      textColor: '#cbd5e1',
    },
    heroBadge: {
      fontSize: 'sm',
      fontWeight: 'semibold',
      fontStyle: 'normal',
      textAlign: 'left',
      textColor: '#93c5fd',
    },
  },
  aboutIntro: 'Founded with a dedication to academic excellence and moral grounding, Primary School ERP provides an inspiring and supportive environment in Kenya where every learner from Early Years (Playgroup) through Junior School (Grade 9) thrives through personalized attention, practical CBC science and ICT labs, creative arts, and sports.',
  mission: 'To provide a stimulating, inclusive, and values-centered educational experience that empowers every learner with 21st-century CBC competencies, curiosity, moral integrity, and leadership.',
  vision: 'To be the leading model institution in Nairobi and Kenya for transformative competency-based basic education and youth character development.',
  coreValues: ['Integrity & Discipline', 'Academic Excellence', 'Innovation & Inquiry', 'Empathy & Inclusivity', 'Environmental Stewardship'],
  principalMessage: 'Welcome to Primary School ERP, Kasarani Mwiki. Our commitment is simple yet profound: nurturing the unique potential of every child. With our dedicated TSC-certified faculty, modern CBC learning resources, and rich co-curricular programs, we prepare our learners not just for examinations, but for life.',
  principalName: 'Mr. David M. Mwangi, M.Ed',
  principalPhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  stats: {
    studentsCount: 680,
    teachersCount: 42,
    graduatesCount: 1450,
    yearsOfExcellence: 18,
  },
  facilities: [
    {
      title: 'Modern CBC Science & Discovery Labs',
      description: 'Equipped Integrated Science, Agriculture, and Digital workstations with hands-on apparatus for practical investigations.',
      imageUrl: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Sports Field & Athletics Grounds',
      description: 'Spacious playing grounds for football, athletics, volleyball, netball, and early childhood motor skills development.',
      imageUrl: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'CBC Library & Digital Learning Pods',
      description: 'Curated curriculum readers, reference books, digital audiobooks, and quiet study stations for junior school learners.',
      imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Creative Arts, Music & Performance Room',
      description: 'Traditional percussion, keyboards, drama props, and art materials supporting holistic talent and cultural showcase.',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    },
  ],
  newsPosts: [
    {
      id: 'news-01',
      title: 'Primary School ERP Ranked Top in Regional CBC Science and Talent Fair',
      date: '2026-02-10',
      summary: 'Our Junior School learners clinched 1st position with their innovative agricultural smart irrigation project.',
      content: 'The adjudicators praised our learners for their poise, scientific reasoning, and practical application of CBC learning outcomes.',
      imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'news-02',
      title: 'Admissions Open for Playgroup to Grade 9 for Academic Year 2026',
      date: '2026-01-15',
      summary: 'Limited vacancies available across Early Years, Primary, and Junior School. Apply online today.',
      content: 'Prospective parents are invited for personalized school visits and learner assessments every weekday.',
      imageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80',
    },
  ],
  gallery: [
    { id: 'gal-01', caption: 'Early Years Playgroup Outdoor Learning', category: 'Early Years', imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80' },
    { id: 'gal-02', caption: 'Grade 6 Practical Science Experiments', category: 'Academics', imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80' },
    { id: 'gal-03', caption: 'Inter-House Athletics and Sports Competitions', category: 'Sports', imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80' },
    { id: 'gal-04', caption: 'Music Recital and Cultural Festival', category: 'Arts', imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80' },
  ],
  faqs: [
    {
      question: 'What curriculum does Primary School ERP offer?',
      answer: 'We offer the official Kenya Competency-Based Curriculum (CBC) from Playgroup (Early Childhood) through Grade 9 (Junior Secondary School).',
    },
    {
      question: 'How do you handle Junior School (Grades 7, 8, and 9)?',
      answer: 'Our Junior Secondary School offers dedicated teachers, fully equipped science apparatus, computer labs, home science, and career pathway mentoring.',
    },
    {
      question: 'Are school transport and hot meals provided?',
      answer: 'Yes, we provide reliable and secure school transport routes covering Kasarani, Mwiki, Sunton, Hunters, Clay City, and surrounding estates, as well as fresh, chef-prepared hot lunch and mid-morning snacks.',
    },
    {
      question: 'How do parents monitor their child\'s progress?',
      answer: 'Parents receive dedicated Parent Portal credentials where you can track live attendance roll-call, view term invoices and pay via Lipa na M-Pesa, view CBC rubric evaluations, and download termly report cards.',
    },
  ],
  announcementTag: 'ADMISSIONS OPEN',
  announcementText: 'Admissions Open • Playgroup to Grade 9',
  contactPhone: '',
  contactEmail: '',
  contactAddress: '',
  mpesaPaybill: '',
  bankDetails: '',
  updatedAt: new Date().toISOString(),
};

export const schoolService = {
  async getSchool(schoolId: string = DEFAULT_SCHOOL_ID): Promise<School | null> {
    try {
      const docRef = doc(db, 'schools', schoolId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as School;
        try {
          localStorage.setItem(`school_${schoolId}`, JSON.stringify(data));
        } catch {
          // ignore storage error
        }
        return data;
      }
      // Check local cache
      const cached = localStorage.getItem(`school_${schoolId}`);
      if (cached) {
        return JSON.parse(cached) as School;
      }
      if (schoolId === DEFAULT_SCHOOL_ID) return DEFAULT_SCHOOL;
      return null;
    } catch (err) {
      console.error('Error fetching school from firestore:', err);
      const cached = localStorage.getItem(`school_${schoolId}`);
      if (cached) {
        return JSON.parse(cached) as School;
      }
      if (schoolId === DEFAULT_SCHOOL_ID) return DEFAULT_SCHOOL;
      return null;
    }
  },

  async getAllSchools(): Promise<School[]> {
    try {
      const snap = await getDocs(collection(db, 'schools'));
      return snap.docs.map((d) => d.data() as School);
    } catch (err) {
      console.error('Error fetching all schools:', err);
      return [];
    }
  },

  async updateSchool(schoolId: string, updates: Partial<School>): Promise<void> {
    const docRef = doc(db, 'schools', schoolId);
    const cleanedUpdates = cleanForFirestore({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    try {
      await setDoc(docRef, cleanedUpdates, { merge: true });
    } catch (err) {
      console.warn('Firestore setDoc failed for school, updating local cache:', err);
    }

    try {
      const existing = localStorage.getItem(`school_${schoolId}`);
      const prev = existing ? JSON.parse(existing) : DEFAULT_SCHOOL;
      const merged = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(`school_${schoolId}`, JSON.stringify(merged));
      
      // Dispatch live update event so AuthContext and all components update immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('school_data_updated', { detail: merged }));
      }
    } catch (e) {
      console.warn('Local storage update failed for school:', e);
    }
  },

  async createSchool(school: School): Promise<void> {
    const docRef = doc(db, 'schools', school.id);
    await setDoc(docRef, school);
  },

  async ensureDefaultSchool(): Promise<School> {
    const existing = await this.getSchool(DEFAULT_SCHOOL_ID);
    if (existing) return existing;
    await this.createSchool(DEFAULT_SCHOOL);
    return DEFAULT_SCHOOL;
  },

  async seedRealisticSchoolData(schoolId: string = DEFAULT_SCHOOL_ID): Promise<void> {
    // Clean commercial template: intentionally does not seed school-specific people,
    // learners, payments, grades, inventory, or other customer data.
    const existing = await this.getSchool(schoolId);
    if (!existing) {
      await this.createSchool({ ...DEFAULT_SCHOOL, id: schoolId });
    }
  }
};
