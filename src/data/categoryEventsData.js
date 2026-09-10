/**
 * @file categoryEventsData.js
 * @description Central data repository for Category Events Pages (matching 10times screenshots).
 */

export const CATEGORIES_CONFIG = {
  'it-technology': {
    slug: 'it-technology',
    id: 'it_tech',
    name: 'IT & Technology Events',
    shortName: 'IT & Technology',
    followersCount: '500+ Followers',
    eventsCount: '18,083 Events',
    heroBanner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1600&auto=format&fit=crop',
    description:
      'Explore premier IT, artificial intelligence, telecommunications, cloud computing, cybersecurity, and software exhibitions across India and worldwide. Connect with global tech titans, founders, and enterprise IT procurement teams.',
    events: [
      {
        id: 'infocomm-india',
        slug: 'infocomm-india-2026',
        title: 'InfoComm India',
        dates: 'Wed, 16 - Fri, 18 Sep 2026',
        daysToGo: '6 days to go',
        edition: '9th edition',
        city: 'Mumbai',
        country: 'India',
        venue: 'Jio World Convention Centre',
        description:
          'InfoComm India, a premier exhibition for the professional audiovisual and integrated experience technology industry, will be hosted at the Jio World Convention Centre in Mumbai from September 16 to September 18...',
        format: 'Business Events',
        subFormat: 'Trade Shows',
        category: 'IT & Technology',
        tags: ['Tradeshow', 'IT & Technology', 'Audiovisual', 'Smart Tech'],
        interestedCount: 1916,
        rating: '4.3',
        reviewsCount: 380,
        logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=120&auto=format&fit=crop'
      },
      {
        id: 'hr-tech-mena',
        slug: 'hr-tech-mena-summit',
        title: 'HR Tech Mena Summit',
        dates: 'Wed, 09 - Thu, 10 Sep 2026',
        daysToGo: 'Today',
        edition: '12th edition',
        city: 'Dubai',
        country: 'UAE',
        venue: 'Dubai World Trade Centre',
        description:
          'The HR Tech MENA Summit, organized by QnA International, is set to take place in Dubai, gathering the most prominent CHROs and HR software providers to explore AI-driven talent management...',
        format: 'Business Events',
        subFormat: 'Conferences',
        category: 'IT & Technology',
        tags: ['Conference', 'IT & Technology', 'HR Tech', 'Enterprise'],
        interestedCount: 842,
        rating: '4.5',
        reviewsCount: 190,
        logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=120&auto=format&fit=crop'
      },
      {
        id: 'connected-britain',
        slug: 'connected-britain-2026',
        title: 'Connected Britain',
        dates: 'Wed, 09 - Thu, 10 Sep 2026',
        daysToGo: 'Upcoming',
        edition: '9th edition',
        city: 'London',
        country: 'UK',
        venue: 'ExCeL London',
        description:
          "Connected Britain is the UK's largest digital economy event, dedicated to shaping the future of UK connectivity by gathering leaders from both public and private sectors. Held annually at ExCeL London...",
        format: 'Business Events',
        subFormat: 'Trade Shows',
        category: 'IT & Technology',
        tags: ['Tradeshow', 'IT & Technology', 'Telecommunication', 'Industrial Products'],
        interestedCount: 206,
        rating: '4.3',
        reviewsCount: 145,
        logo: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=120&auto=format&fit=crop'
      },
      {
        id: 'big-data-ai-paris',
        slug: 'big-data-ai-paris-2026',
        title: 'Big Data & AI Paris',
        dates: 'Tue, 15 - Wed, 16 Sep 2026',
        daysToGo: '5 days to go',
        edition: '14th edition',
        city: 'Paris',
        country: 'France',
        venue: 'Palais des Congrès de Paris',
        description:
          'The undisputed meeting place for the French and European big data and artificial intelligence ecosystem. 250+ enterprise workshops, 700+ AI startups, and 15,000 data scientists...',
        format: 'Business Events',
        subFormat: 'Conferences',
        category: 'IT & Technology',
        tags: ['Conference', 'IT & Technology', 'Artificial Intelligence', 'Big Data'],
        interestedCount: 618,
        rating: '4.6',
        reviewsCount: 210,
        logo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=120&auto=format&fit=crop'
      },
      {
        id: 'pt-expo-china',
        slug: 'pt-expo-china-2026',
        title: 'PT Expo China',
        dates: 'Tue, 22 - Thu, 24 Sep 2026',
        daysToGo: '12 days to go',
        edition: '33rd edition',
        city: 'Beijing',
        country: 'China',
        venue: 'China National Convention Center',
        description:
          'The PT Expo China is a premier telecommunications and information technology exhibition taking place at the prestigious China National Convention Center in Beijing from September 22 to September 24...',
        format: 'Business Events',
        subFormat: 'Trade Shows',
        category: 'IT & Technology',
        tags: ['Tradeshow', 'IT & Technology', 'Telecom', '5G Infrastructure'],
        interestedCount: 252,
        rating: '5.0',
        reviewsCount: 180,
        logo: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=120&auto=format&fit=crop'
      },
      {
        id: 'semicon-india',
        slug: 'semicon-india-2026',
        title: 'Semicon India Conclave 2026',
        dates: 'Wed, 07 - Fri, 09 Oct 2026',
        daysToGo: '27 days to go',
        edition: '4th edition',
        city: 'New Delhi',
        country: 'India',
        venue: 'Yashobhoomi Convention Centre',
        description:
          "India's apex semiconductor assembly, testing, and wafer fabrication conclave bringing together global chip design giants, silicon foundries, and cleanroom equipment manufacturers...",
        format: 'Business Events',
        subFormat: 'Conferences',
        category: 'IT & Technology',
        tags: ['Conference', 'IT & Technology', 'Semiconductors', 'Hardware'],
        interestedCount: 1420,
        rating: '4.9',
        reviewsCount: 520,
        logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=120&auto=format&fit=crop'
      }
    ]
  },

  'medical-pharma': {
    slug: 'medical-pharma',
    id: 'medical',
    name: 'Medical & Pharma Events',
    shortName: 'Medical & Pharma',
    followersCount: '420+ Followers',
    eventsCount: '19,600 Events',
    heroBanner: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1600&auto=format&fit=crop',
    description:
      'Connect with hospital procurement leaders, clinical directors, medical device manufacturers, and pharmaceutical formulation experts. Discover medical trade expos across India and globally.',
    events: [
      {
        id: 'medicall-expo',
        slug: 'medicall-hospital-expo-2026',
        title: 'Medicall - Hospital Equipment Expo',
        dates: 'Fri, 25 - Sun, 27 Sep 2026',
        daysToGo: '15 days to go',
        edition: '36th edition',
        city: 'New Delhi',
        country: 'India',
        venue: 'Bharat Mandapam (IECC)',
        description:
          "India's largest B2B hospital equipment, surgical instruments, and medical furniture exhibition. Over 1,000 healthcare suppliers exhibiting diagnostic imaging, ICU ventilators, and surgical tech...",
        format: 'Business Events',
        subFormat: 'Trade Shows',
        category: 'Medical & Pharma',
        tags: ['Tradeshow', 'Medical & Pharma', 'Hospital Tech', 'Diagnostic'],
        interestedCount: 2450,
        rating: '4.8',
        reviewsCount: 410,
        logo: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=120&auto=format&fit=crop'
      },
      {
        id: 'cphi-pmec-india',
        slug: 'cphi-pmec-india-2026',
        title: 'CPHI & PMEC India',
        dates: 'Tue, 24 - Thu, 26 Nov 2026',
        daysToGo: '75 days to go',
        edition: '18th edition',
        city: 'Greater Noida',
        country: 'India',
        venue: 'India Expo Centre & Mart',
        description:
          'South Asia’s leading pharmaceutical ingredients, packaging machinery, cleanroom technology, and contract manufacturing mega-fair connecting 50,000+ pharma decision makers...',
        format: 'Business Events',
        subFormat: 'Trade Shows',
        category: 'Medical & Pharma',
        tags: ['Tradeshow', 'Medical & Pharma', 'Active Ingredients', 'Pharma Machinery'],
        interestedCount: 3100,
        rating: '4.9',
        reviewsCount: 680,
        logo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=120&auto=format&fit=crop'
      },
      {
        id: 'medica-world-forum',
        slug: 'medica-world-forum-2026',
        title: 'Medica - World Forum for Medicine',
        dates: 'Mon, 16 - Thu, 19 Nov 2026',
        daysToGo: '67 days to go',
        edition: '55th edition',
        city: 'Düsseldorf',
        country: 'Germany',
        venue: 'Messe Düsseldorf',
        description:
          'The world’s leading international trade fair for medical technologies, electromedical equipment, laboratory devices, and physiotherapy...',
        format: 'Business Events',
        subFormat: 'Trade Shows',
        category: 'Medical & Pharma',
        tags: ['Tradeshow', 'Medical & Pharma', 'Global Health', 'Biotech'],
        interestedCount: 4890,
        rating: '4.9',
        reviewsCount: 1240,
        logo: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=120&auto=format&fit=crop'
      }
    ]
  },

  'education': {
    slug: 'education',
    id: 'education',
    name: 'Education & Training Events',
    shortName: 'Education & Training',
    followersCount: '800+ Followers',
    eventsCount: '56,100 Events',
    heroBanner: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop',
    description:
      'Discover international university fairs, EdTech summits, academic publishing congresses, and vocational skill conclaves connecting institutions, educators, and students.',
    events: [
      {
        id: 'worlddidac-india',
        slug: 'worlddidac-india-2026',
        title: 'Worlddidac India EdTech Expo',
        dates: 'Thu, 17 - Sat, 19 Sep 2026',
        daysToGo: '7 days to go',
        edition: '14th edition',
        city: 'Bengaluru',
        country: 'India',
        venue: 'Bangalore International Exhibition Centre (BIEC)',
        description:
          "Asia Pacific's leading exhibition and conference for educational supplies, digital learning solutions, smart classroom tech, and STEM educational equipment...",
        format: 'Business Events',
        subFormat: 'Trade Shows',
        category: 'Education & Training',
        tags: ['Tradeshow', 'Education & Training', 'EdTech', 'Smart Classroom'],
        interestedCount: 1650,
        rating: '4.6',
        reviewsCount: 280,
        logo: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=120&auto=format&fit=crop'
      },
      {
        id: 'world-book-fair',
        slug: 'new-delhi-world-book-fair',
        title: 'New Delhi World Book Fair',
        dates: 'Sat, 06 - Sun, 14 Feb 2027',
        daysToGo: 'Upcoming',
        edition: '51st edition',
        city: 'New Delhi',
        country: 'India',
        venue: 'Bharat Mandapam (IECC)',
        description:
          "One of the largest literary and educational publishing trade fairs in Afro-Asian region, organized by National Book Trust India...",
        format: 'Business Events',
        subFormat: 'Trade Shows',
        category: 'Education & Training',
        tags: ['Tradeshow', 'Education & Training', 'Publishing', 'Books'],
        interestedCount: 3820,
        rating: '4.8',
        reviewsCount: 890,
        logo: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=120&auto=format&fit=crop'
      }
    ]
  },

  'banking-finance': {
    slug: 'banking-finance',
    id: 'finance',
    name: 'Banking & Finance Events',
    shortName: 'Banking & Finance',
    followersCount: '350+ Followers',
    eventsCount: '14,000 Events',
    heroBanner: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1600&auto=format&fit=crop',
    description:
      'Join premier fintech summits, global banking conclaves, wealth management expos, and digital payment forums driving modern financial infrastructure.',
    events: [
      {
        id: 'global-fintech-fest',
        slug: 'global-fintech-fest-2026',
        title: 'Global Fintech Fest (GFF)',
        dates: 'Tue, 22 - Thu, 24 Sep 2026',
        daysToGo: '12 days to go',
        edition: '5th edition',
        city: 'Mumbai',
        country: 'India',
        venue: 'Jio World Convention Centre',
        description:
          "The world's largest gathering of fintech entrepreneurs, regulators, central bankers, and global venture funds organized by NPCI, Payments Council of India, and IAMAI...",
        format: 'Business Events',
        subFormat: 'Conferences',
        category: 'Banking & Finance',
        tags: ['Conference', 'Banking & Finance', 'Fintech', 'Digital Banking'],
        interestedCount: 3450,
        rating: '4.9',
        reviewsCount: 710,
        logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=120&auto=format&fit=crop'
      }
    ]
  },

  'building-construction': {
    slug: 'building-construction',
    id: 'construction',
    name: 'Building & Construction Events',
    shortName: 'Building & Construction',
    followersCount: '290+ Followers',
    eventsCount: '6,693 Events',
    heroBanner: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1600&auto=format&fit=crop',
    description:
      'Heavy machinery, architecture, green building technologies, civil infrastructure, and concrete engineering exhibitions across India and worldwide.',
    events: [
      {
        id: 'excon-india',
        slug: 'excon-construction-expo-2026',
        title: 'EXCON - Construction Equipment Expo',
        dates: 'Tue, 08 - Sat, 12 Dec 2026',
        daysToGo: '89 days to go',
        edition: '13th edition',
        city: 'Bengaluru',
        country: 'India',
        venue: 'Bangalore International Exhibition Centre (BIEC)',
        description:
          "South Asia's largest construction equipment and earthmoving machinery exhibition, organized by the Confederation of Indian Industry (CII)...",
        format: 'Business Events',
        subFormat: 'Trade Shows',
        category: 'Building & Construction',
        tags: ['Tradeshow', 'Building & Construction', 'Earthmovers', 'Infrastructure'],
        interestedCount: 2980,
        rating: '4.9',
        reviewsCount: 540,
        logo: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=120&auto=format&fit=crop'
      }
    ]
  },

  'business-services': {
    slug: 'business-services',
    id: 'business',
    name: 'Business Services Events',
    shortName: 'Business Services',
    followersCount: '210+ Followers',
    eventsCount: '10,900 Events',
    heroBanner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop',
    description:
      'B2B trade services, logistics, industrial packaging, supply chain, franchise expos, and corporate conclaves.',
    events: [
      {
        id: 'propak-india',
        slug: 'propak-india-packaging-expo',
        title: 'ProPak India & Food Processing Conclave',
        dates: 'Thu, 22 - Sat, 24 Oct 2026',
        daysToGo: '42 days to go',
        edition: '6th edition',
        city: 'Mumbai',
        country: 'India',
        venue: 'Bombay Exhibition Centre (NESCO)',
        description:
          "India's premier processing and packaging trade event for the food, drink, pharmaceutical, cosmetics, and consumer goods industries...",
        format: 'Business Events',
        subFormat: 'Trade Shows',
        category: 'Business Services',
        tags: ['Tradeshow', 'Business Services', 'Packaging Machinery', 'Supply Chain'],
        interestedCount: 1820,
        rating: '4.7',
        reviewsCount: 310,
        logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=120&auto=format&fit=crop'
      }
    ]
  }
};

/**
 * Get category config by slug or alias
 */
export function getCategoryBySlug(slug) {
  if (!slug) return CATEGORIES_CONFIG['it-technology'];
  const s = String(slug).toLowerCase().trim();

  if (CATEGORIES_CONFIG[s]) return CATEGORIES_CONFIG[s];

  // Aliases
  if (s.includes('tech') || s.includes('it')) return CATEGORIES_CONFIG['it-technology'];
  if (s.includes('med') || s.includes('pharma') || s.includes('health')) return CATEGORIES_CONFIG['medical-pharma'];
  if (s.includes('edu')) return CATEGORIES_CONFIG['education'];
  if (s.includes('fin') || s.includes('bank')) return CATEGORIES_CONFIG['banking-finance'];
  if (s.includes('build') || s.includes('construct')) return CATEGORIES_CONFIG['building-construction'];
  if (s.includes('business') || s.includes('service')) return CATEGORIES_CONFIG['business-services'];

  // Default fallback
  return CATEGORIES_CONFIG['it-technology'];
}
