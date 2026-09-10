/**
 * @file venuesData.js
 * @description Central data repository for India's and global premier convention & exhibition venues.
 */

export const VENUES_DATA = {
  'bharat-mandapam': {
    id: 'bharat-mandapam',
    slug: 'bharat-mandapam',
    name: 'Bharat Mandapam Exhibition Complex',
    shortName: 'Bharat Mandapam',
    tagline: "India's Apex International Exhibition-cum-Convention Complex (IECC)",
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    address: 'Pragati Maidan, Mathura Road, New Delhi, Delhi 110001',
    metro: 'Supreme Court (Pragati Maidan) Metro Station (Direct Gate 10 Access)',
    airportDistance: '17 km from Indira Gandhi International Airport (DEL)',
    heroBanner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1600&auto=format&fit=crop',
    logoThumbnail: 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?q=80&w=300&auto=format&fit=crop',
    followersCount: '48K+',
    rating: 4.9,
    ratingsCount: 2450,
    bestSuited: 'Tradeshows & Mega B2B Expos',
    eventsHosted: '342+',
    upcomingEventsCount: '88+',
    reputationText: 'Very Good Reputation',
    overviewDescription:
      "Spread over a sprawling 123-acre campus in the heart of the national capital, Bharat Mandapam (IECC) at Pragati Maidan stands as India's premier international exhibition and convention destination. Renovated to world-class architectural standards to host the prestigious G20 Summit, this complex features 14 state-of-the-art exhibition halls, an iconic elliptical plenary convention center with a seating capacity of 7,000 delegates, and an open-air amphitheater. Equipped with subterranean multi-tier vehicular tunnels, smart traffic automation, 5,500+ basement parking bays, and direct concourse connectivity to Delhi Metro, Bharat Mandapam is the flagship venue for flagship national and global trade fairs including IITF, AAHAR, and the World Book Fair.",
    totalArea: '123 Acres (100,000+ sqm Indoor)',
    builtYear: '1972',
    renovatedYear: '2023',
    meetingRooms: '14 Exhibition Halls • 24 Conference Suites',
    ratingsBreakdown: {
      location: 9.8,
      amenities: 9.6,
      cleanliness: 9.8,
      food: 9.3
    },
    gallery: [
      'https://images.unsplash.com/photo-1541971875076-8f970d573be6?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop'
    ],
    leadingEvents: [
      {
        id: 1,
        title: 'India International Trade Fair (IITF) 2026',
        dates: 'Sat, 14 - Fri, 27 Nov 2026',
        category: 'Mega Multi-Sector B2B & B2C Expo',
        turnout: '1.2M+ Visitors',
        daysToGo: '64 days to go'
      },
      {
        id: 2,
        title: 'AAHAR - The International Food & Hospitality Fair',
        dates: 'Tue, 10 - Sat, 14 Mar 2027',
        category: 'Hospitality & Culinary Tech',
        turnout: '65,000+ Trade Buyers',
        daysToGo: 'Upcoming'
      },
      {
        id: 3,
        title: 'World Book Fair New Delhi',
        dates: 'Sat, 06 - Sun, 14 Feb 2027',
        category: 'Publishing & Literature Expo',
        turnout: '450,000+ Readers',
        daysToGo: 'Upcoming'
      },
      {
        id: 4,
        title: 'India MedTech & Healthcare Expo',
        dates: 'Thu, 08 - Sat, 10 Oct 2026',
        category: 'Medical Devices & Diagnostics',
        turnout: '38,000+ Delegates',
        daysToGo: '28 days to go'
      }
    ],
    meetingSpaces: [
      { name: 'Plenary Hall (Level 3)', capacity: '7,000 Delegates', area: '12,500 sqm', type: 'Auditorium' },
      { name: 'Mega Exhibition Hall 14', capacity: '18,000 Footfall', area: '10,000 sqm', type: 'Pillarless Hall' },
      { name: 'Grand Ballroom & Banquet', capacity: '3,000 Guests', area: '4,500 sqm', type: 'Banquet & Gala' },
      { name: 'Amphitheater', capacity: '3,000 Seated', area: 'Open Air', type: 'Cultural & Conclave' }
    ],
    nearbyVenues: [
      { name: 'Yashobhoomi (IICC Dwarka)', location: 'Dwarka, New Delhi', distance: '26 miles', eventsHosted: '229+' },
      { name: 'India Expo Centre & Mart', location: 'Greater Noida, UP', distance: '28 miles', eventsHosted: '390+' },
      { name: 'Vigyan Bhawan Conclave Centre', location: 'Maulana Azad Rd, New Delhi', distance: '3.2 miles', eventsHosted: '180+' }
    ],
    nearbyHotels: [
      { name: 'The Lalit New Delhi', stars: 5, price: 'From ₹11,500 / night', distance: '1.8 km', rating: 4.8 },
      { name: 'Taj Mahal Hotel (Man Singh Road)', stars: 5, price: 'From ₹16,800 / night', distance: '2.9 km', rating: 4.9 },
      { name: 'Le Méridien New Delhi', stars: 5, price: 'From ₹13,200 / night', distance: '2.5 km', rating: 4.8 },
      { name: 'The Hans New Delhi', stars: 4, price: 'From ₹6,400 / night', distance: '2.1 km', rating: 4.3 }
    ]
  },

  'yashobhoomi': {
    id: 'yashobhoomi',
    slug: 'yashobhoomi',
    name: 'Yashobhoomi Convention Centre',
    shortName: 'YASHOBHOOMI (IICC)',
    tagline: "Asia's Largest Indoor Exhibition and Convention Mega-Complex",
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    address: 'Sector 25, Dwarka, New Delhi, Delhi 110077',
    metro: 'Yashobhoomi Dwarka Sector 25 Metro Station (Direct Subterranean Concourses)',
    airportDistance: '11 km from IGI Airport Terminal 3',
    heroBanner: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1600&auto=format&fit=crop',
    logoThumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=300&auto=format&fit=crop',
    followersCount: '36K+',
    rating: 4.9,
    ratingsCount: 1820,
    bestSuited: 'Global Summits & Heavy Machinery Expos',
    eventsHosted: '229+',
    upcomingEventsCount: '57+',
    reputationText: 'Outstanding Global Facility',
    overviewDescription:
      "Yashobhoomi (India International Convention and Expo Centre - IICC) situated in Sector 25 Dwarka is recognized as Asia's largest exhibition and convention complex by indoor footprint, spanning over 221 acres with 300,000 sqm of covered floor area upon full completion. Featuring five colossal pillarless exhibition halls, India's largest plenary auditorium seating 6,000 delegates, an innovative automated underground logistics network, and a dedicated high-speed Airport Metro express concourse arriving directly inside the grand foyer, Yashobhoomi is designed to host mega-scale aviation summits, defense conclaves, telecommunications expos, and clean mobility conventions with zero environmental compromise.",
    totalArea: '221 Acres (300,000 sqm covered)',
    builtYear: '2023',
    renovatedYear: '2024',
    meetingRooms: '5 Mega Pavilions • 15 Conference Suites',
    ratingsBreakdown: {
      location: 9.6,
      amenities: 9.9,
      cleanliness: 9.9,
      food: 9.4
    },
    gallery: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=800&auto=format&fit=crop'
    ],
    leadingEvents: [
      {
        id: 1,
        title: 'Semicon India Global Conclave 2026',
        dates: 'Wed, 07 - Fri, 09 Oct 2026',
        category: 'Semiconductors & Deep Tech',
        turnout: '42,000+ Delegates',
        daysToGo: '27 days to go'
      },
      {
        id: 2,
        title: 'World Telecommunications Standards Assembly',
        dates: 'Tue, 17 - Thu, 19 Nov 2026',
        category: '5G, 6G & Satellite Telecom',
        turnout: '28,000+ Global Dignitaries',
        daysToGo: '68 days to go'
      },
      {
        id: 3,
        title: 'International Mining & Heavy Machinery Expo',
        dates: 'Thu, 03 - Sun, 06 Dec 2026',
        category: 'Heavy Engineering & Earthmovers',
        turnout: '55,000+ Industry Buyers',
        daysToGo: '84 days to go'
      },
      {
        id: 4,
        title: 'Green Hydrogen & Clean Energy Summit',
        dates: 'Fri, 22 - Sun, 24 Jan 2027',
        category: 'CleanTech & Renewables',
        turnout: '35,000+ Stakeholders',
        daysToGo: 'Upcoming'
      }
    ],
    meetingSpaces: [
      { name: 'Grand Plenary Convention Hall', capacity: '6,000 Delegates', area: '14,000 sqm', type: 'Auditorium' },
      { name: 'Exhibition Pavilion 1 (Pillarless)', capacity: '22,000 Attendees', area: '18,000 sqm', type: 'Mega Expo Hall' },
      { name: 'Exhibition Pavilion 2', capacity: '18,000 Attendees', area: '15,000 sqm', type: 'Heavy Machinery Hall' },
      { name: 'VIP Diplomatic Boardroom', capacity: '120 Dignitaries', area: '800 sqm', type: 'VIP Council' }
    ],
    nearbyVenues: [
      { name: 'Bharat Mandapam (IECC)', location: 'Pragati Maidan, New Delhi', distance: '26 miles', eventsHosted: '342+' },
      { name: 'India Expo Centre & Mart', location: 'Greater Noida, UP', distance: '45 miles', eventsHosted: '390+' },
      { name: 'AICC Convention Grounds', location: 'Aerocity, New Delhi', distance: '8.5 miles', eventsHosted: '140+' }
    ],
    nearbyHotels: [
      { name: 'JW Marriott Hotel New Delhi Aerocity', stars: 5, price: 'From ₹14,500 / night', distance: '9 km', rating: 4.9 },
      { name: 'Roseate House New Delhi', stars: 5, price: 'From ₹13,000 / night', distance: '8.8 km', rating: 4.8 },
      { name: 'Vivanta New Delhi Dwarka', stars: 5, price: 'From ₹8,900 / night', distance: '4.2 km', rating: 4.6 },
      { name: 'Aloft New Delhi Aerocity', stars: 4, price: 'From ₹7,800 / night', distance: '9.2 km', rating: 4.5 }
    ]
  },

  'jio-world': {
    id: 'jio-world',
    slug: 'jio-world',
    name: 'Jio World Convention Centre',
    shortName: 'JWCC Mumbai',
    tagline: '5-Star Luxury Trade Venue in Mumbai Financial Epicenter (BKC)',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    address: 'G Block, Bandra Kurla Complex (BKC), Bandra East, Mumbai, Maharashtra 400051',
    metro: 'BKC Metro Station (Line 3 Aqua Line Direct Skywalk)',
    airportDistance: '8 km from Chhatrapati Shivaji Maharaj International Airport (BOM)',
    heroBanner: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=1600&auto=format&fit=crop',
    logoThumbnail: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=300&auto=format&fit=crop',
    followersCount: '52K+',
    rating: 4.9,
    ratingsCount: 3100,
    bestSuited: 'High-End B2B Expos, Fintech & Gems Summits',
    eventsHosted: '285+',
    upcomingEventsCount: '64+',
    reputationText: 'Luxury World-Class Venue',
    overviewDescription:
      "Jio World Convention Centre (JWCC), located in the prestigious Bandra Kurla Complex of Mumbai, is India's most luxurious and technologically sophisticated international convention facility. Spanning over 1 million square feet of multi-format space, JWCC features three modular exhibition halls equipped with heavy floor-load capacities, two luminous ballrooms, 25 high-spec meeting suites, and India's largest 5-star kitchen network capable of serving over 18,000 meals daily. It is the chosen venue for premier global trade shows including the India International Jewellery Show, Global Fintech Fest, and TechSparks.",
    totalArea: '18.5 Acres (1,000,000+ sq ft)',
    builtYear: '2022',
    renovatedYear: '2024',
    meetingRooms: '3 Modular Halls • 25 Meeting Suites',
    ratingsBreakdown: {
      location: 9.9,
      amenities: 9.9,
      cleanliness: 9.9,
      food: 9.8
    },
    gallery: [
      'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800&auto=format&fit=crop'
    ],
    leadingEvents: [
      {
        id: 1,
        title: 'Global Fintech Fest 2026',
        dates: 'Tue, 22 - Thu, 24 Sep 2026',
        category: 'Fintech, Banking & Web3',
        turnout: '65,000+ Delegates',
        daysToGo: '12 days to go'
      },
      {
        id: 2,
        title: 'India International Jewellery Show (IIJS Signature)',
        dates: 'Thu, 07 - Mon, 11 Jan 2027',
        category: 'Gems, Gold & Luxury Jewellery',
        turnout: '48,000+ Global Buyers',
        daysToGo: 'Upcoming'
      },
      {
        id: 3,
        title: 'TechSparks Mumbai Innovation Summit',
        dates: 'Fri, 20 - Sat, 21 Nov 2026',
        category: 'Venture Capital, Startups & AI',
        turnout: '15,000+ Founders',
        daysToGo: '71 days to go'
      },
      {
        id: 4,
        title: 'Pharma & Biotech Conclave Asia',
        dates: 'Wed, 17 - Fri, 19 Feb 2027',
        category: 'Pharmaceutical Formulations',
        turnout: '32,000+ Procurement Heads',
        daysToGo: 'Upcoming'
      }
    ],
    meetingSpaces: [
      { name: 'Pavilion 1 & 2 Combined', capacity: '16,500 Footfall', area: '15,000 sqm', type: 'Modular Expo Hall' },
      { name: 'Lotus Ballroom (Level 5)', capacity: '3,200 Guests', area: '3,000 sqm', type: 'Gala & Plenary' },
      { name: 'Jasmine Meeting Suites', capacity: '450 Delegates', area: '850 sqm', type: 'Breakout Suites' },
      { name: 'Executive VIP Boardroom', capacity: '60 Leaders', area: '300 sqm', type: 'Boardroom' }
    ],
    nearbyVenues: [
      { name: 'Bombay Exhibition Centre (NESCO)', location: 'Goregaon, Mumbai', distance: '12 miles', eventsHosted: '651+' },
      { name: 'Nehru Centre Exhibition Complex', location: 'Worli, Mumbai', distance: '7.5 miles', eventsHosted: '190+' },
      { name: 'CIDCO Exhibition Centre', location: 'Vashi, Navi Mumbai', distance: '14 miles', eventsHosted: '165+' }
    ],
    nearbyHotels: [
      { name: 'Trident Hotel Bandra Kurla', stars: 5, price: 'From ₹15,500 / night', distance: '0.4 km', rating: 4.8 },
      { name: 'Sofitel Mumbai BKC', stars: 5, price: 'From ₹16,200 / night', distance: '0.6 km', rating: 4.8 },
      { name: 'Grand Hyatt Mumbai Hotel & Residences', stars: 5, price: 'From ₹13,000 / night', distance: '3.1 km', rating: 4.7 },
      { name: 'Courtyard by Marriott Mumbai', stars: 4, price: 'From ₹9,500 / night', distance: '6.2 km', rating: 4.4 }
    ]
  },

  'bec-mumbai': {
    id: 'bec-mumbai',
    slug: 'bec-mumbai',
    name: 'Bombay Exhibition Centre (NESCO)',
    shortName: 'NESCO Bombay Exhibition Centre',
    tagline: "Western India's Highest-Traffic Commercial Trade Fair Grounds",
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    address: 'NESCO Complex, Western Express Highway, Goregaon East, Mumbai, Maharashtra 400063',
    metro: 'Ram Mandir Railway Station (200m) & Aarey / Goregaon East Metro (Line 7)',
    airportDistance: '9 km from Mumbai Domestic & International Terminals',
    heroBanner: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1600&auto=format&fit=crop',
    logoThumbnail: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=300&auto=format&fit=crop',
    followersCount: '64K+',
    rating: 4.8,
    ratingsCount: 4200,
    bestSuited: 'Industrial Engineering, Automation & Heavy Machinery',
    eventsHosted: '651+',
    upcomingEventsCount: '105+',
    reputationText: 'Commercial Epicenter of Trade',
    overviewDescription:
      "Bombay Exhibition Centre (BEC), located inside the historic 60-acre NESCO complex in Goregaon East, has been the beating heart of trade exhibitions in Mumbai for over four decades. Offering over 70,000 square meters of indoor air-conditioned display space across six cavernous halls, BEC hosts over 650 exhibitions annually. Its strategic location right on the Western Express Highway, adjacent to Ram Mandir railway station and Metro Line 7, paired with high-capacity cargo bays for heavy equipment unloading, makes it the top venue for industrial automation, engineering, packaging, and commercial retail fairs.",
    totalArea: '60+ Acres (70,000 sqm covered)',
    builtYear: '1991',
    renovatedYear: '2022',
    meetingRooms: '6 Massive Exhibition Halls • 12 Seminar Rooms',
    ratingsBreakdown: {
      location: 9.7,
      amenities: 9.3,
      cleanliness: 9.4,
      food: 9.1
    },
    gallery: [
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop'
    ],
    leadingEvents: [
      {
        id: 1,
        title: 'Automation Expo Asia 2026',
        dates: 'Wed, 16 - Sat, 19 Aug 2026',
        category: 'Robotics, PLC & Smart Automation',
        turnout: '85,000+ Trade Visitors',
        daysToGo: 'Past Event'
      },
      {
        id: 2,
        title: 'ProPak India & Food Ingredients Expo',
        dates: 'Thu, 22 - Sat, 24 Oct 2026',
        category: 'Processing & Packaging Machinery',
        turnout: '42,000+ Buyers',
        daysToGo: '42 days to go'
      },
      {
        id: 3,
        title: 'Index International Furniture & Interiors Conclave',
        dates: 'Fri, 13 - Sun, 15 Nov 2026',
        category: 'Architecture, Furnishings & Hardware',
        turnout: '38,000+ Architects',
        daysToGo: '64 days to go'
      },
      {
        id: 4,
        title: 'Media Expo Mumbai',
        dates: 'Thu, 04 - Sat, 06 Mar 2027',
        category: 'Signage, Printing & OOH Advertising',
        turnout: '28,000+ Printers',
        daysToGo: 'Upcoming'
      }
    ],
    meetingSpaces: [
      { name: 'Hall 1 (Main Grande)', capacity: '25,000 Attendees', area: '18,500 sqm', type: 'Primary Exhibition Hall' },
      { name: 'Hall 2 (Heavy Machinery)', capacity: '15,000 Attendees', area: '12,000 sqm', type: 'High Clearance Cargo Hall' },
      { name: 'Hall 3 (Modular Pavilions)', capacity: '12,000 Attendees', area: '9,500 sqm', type: 'Multi-Product Hall' },
      { name: 'NESCO Center Seminar Hall', capacity: '1,200 Delegates', area: '1,500 sqm', type: 'Conference & B2B' }
    ],
    nearbyVenues: [
      { name: 'Jio World Convention Centre', location: 'BKC, Mumbai', distance: '12 miles', eventsHosted: '285+' },
      { name: 'CIDCO Exhibition Centre', location: 'Vashi, Navi Mumbai', distance: '22 miles', eventsHosted: '165+' },
      { name: 'Nehru Centre Exhibition Complex', location: 'Worli, Mumbai', distance: '16 miles', eventsHosted: '190+' }
    ],
    nearbyHotels: [
      { name: 'The Westin Mumbai Garden City', stars: 5, price: 'From ₹13,500 / night', distance: '1.2 km', rating: 4.8 },
      { name: 'Radisson Mumbai Goregaon', stars: 4, price: 'From ₹7,200 / night', distance: '1.8 km', rating: 4.4 },
      { name: 'The Fern Goregaon', stars: 4, price: 'From ₹6,500 / night', distance: '1.5 km', rating: 4.3 },
      { name: 'Grand Sarovar Premiere', stars: 4, price: 'From ₹5,800 / night', distance: '2.4 km', rating: 4.2 }
    ]
  },

  'biec-bengaluru': {
    id: 'biec-bengaluru',
    slug: 'biec-bengaluru',
    name: 'Bangalore International Exhibition Centre (BIEC)',
    shortName: 'BIEC Bengaluru',
    tagline: "India's Premier LEED Platinum Green Exhibition Complex",
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    address: '10th Mile, Tumkur Road, Madavara Post, Bengaluru, Karnataka 562123',
    metro: 'Madavara (BIEC) Green Line Metro Station (Direct Gate Concourses)',
    airportDistance: '44 km via Outer Ring Road & NH48',
    heroBanner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop',
    logoThumbnail: 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?q=80&w=300&auto=format&fit=crop',
    followersCount: '41K+',
    rating: 4.8,
    ratingsCount: 2190,
    bestSuited: 'Machine Tools, Construction Tech & Aerospace',
    eventsHosted: '312+',
    upcomingEventsCount: '52+',
    reputationText: 'Apex Green Engineering Complex',
    overviewDescription:
      "Owned and operated by the Indian Machine Tool Manufacturers' Association (IMTMA), the Bangalore International Exhibition Centre (BIEC) covers 34 lush green acres on Tumkur Road. As India's first eco-friendly exhibition facility certified with LEED Platinum rating, BIEC boasts 60,000 square meters of covered pillarless exhibition space across five multi-purpose halls. Connected directly by Bengaluru's Namma Metro Green Line to the Madavara Station right at its entrance, BIEC hosts flagship industrial congresses including IMTEX, EXCON, and Bangalore Space Expo.",
    totalArea: '34 Acres (60,000 sqm covered)',
    builtYear: '2007',
    renovatedYear: '2023',
    meetingRooms: '5 Multi-purpose Halls • Conference Centre',
    ratingsBreakdown: {
      location: 9.3,
      amenities: 9.7,
      cleanliness: 9.8,
      food: 9.2
    },
    gallery: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=800&auto=format&fit=crop'
    ],
    leadingEvents: [
      {
        id: 1,
        title: 'IMTEX - International Machine Tool Exhibition 2027',
        dates: 'Thu, 21 - Wed, 27 Jan 2027',
        category: 'Metal Cutting & Advanced Manufacturing',
        turnout: '120,000+ Industrial Engineers',
        daysToGo: 'Upcoming'
      },
      {
        id: 2,
        title: 'EXCON - Construction Equipment & Tech Conclave',
        dates: 'Tue, 08 - Sat, 12 Dec 2026',
        category: 'Heavy Earthmovers & Concrete Tech',
        turnout: '80,000+ Contractors',
        daysToGo: '89 days to go'
      },
      {
        id: 3,
        title: 'Bangalore Space Expo (BSX)',
        dates: 'Thu, 15 - Sat, 17 Oct 2026',
        category: 'Aerospace, Satellites & Defense',
        turnout: '35,000+ Scientists & Vendors',
        daysToGo: '35 days to go'
      },
      {
        id: 4,
        title: 'India Green Building Congress',
        dates: 'Fri, 20 - Sun, 22 Nov 2026',
        category: 'Sustainable Architecture & ESG',
        turnout: '22,000+ Architects',
        daysToGo: '71 days to go'
      }
    ],
    meetingSpaces: [
      { name: 'Hall 4 (IMTEX Pavilion)', capacity: '20,000 Attendees', area: '17,500 sqm', type: 'Pillarless Mega Hall' },
      { name: 'Hall 5 (Tech Center)', capacity: '14,000 Attendees', area: '12,000 sqm', type: 'Heavy Industrial Hall' },
      { name: 'Conference Centre Auditorium', capacity: '1,500 Seated', area: '2,200 sqm', type: 'Auditorium' },
      { name: 'IMTMA VIP Lounge', capacity: '250 Delegates', area: '500 sqm', type: 'Executive VIP Suite' }
    ],
    nearbyVenues: [
      { name: 'Manpho Convention Centre', location: 'Nagavara, Bengaluru', distance: '14 miles', eventsHosted: '140+' },
      { name: 'Gayathri Vihar Palace Grounds', location: 'Mekhri Circle, Bengaluru', distance: '11 miles', eventsHosted: '185+' },
      { name: 'KTPO Trade Centre', location: 'Whitefield, Bengaluru', distance: '24 miles', eventsHosted: '110+' }
    ],
    nearbyHotels: [
      { name: 'Sheraton Grand Bangalore Hotel at Brigade Gateway', stars: 5, price: 'From ₹13,000 / night', distance: '10 km', rating: 4.8 },
      { name: 'Taj Yeshwantpur', stars: 5, price: 'From ₹11,200 / night', distance: '8.5 km', rating: 4.7 },
      { name: 'Holiday Inn Express Bengaluru Yeshwantpur', stars: 3, price: 'From ₹4,200 / night', distance: '8.1 km', rating: 4.2 },
      { name: 'Upar Hotels Nelamangala', stars: 3, price: 'From ₹3,100 / night', distance: '5.2 km', rating: 4.0 }
    ]
  },

  'india-expo-centre': {
    id: 'india-expo-centre',
    slug: 'india-expo-centre',
    name: 'India Expo Centre & Mart',
    shortName: 'India Expo Mart Greater Noida',
    tagline: 'North India Largest Integrated Mart and Exhibition Facility',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    address: 'Plot No. 23 -25 & 27- 29, Knowledge Park II, Greater Noida, Uttar Pradesh 201306',
    metro: 'Knowledge Park II Metro Station (Aqua Line 100m from Gate 1)',
    airportDistance: '48 km from Delhi IGI Airport / 28 km from upcoming Noida Airport (Jewar)',
    heroBanner: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop',
    logoThumbnail: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=300&auto=format&fit=crop',
    followersCount: '45K+',
    rating: 4.8,
    ratingsCount: 3400,
    bestSuited: 'Auto Expo, Renewable Energy & Handicrafts',
    eventsHosted: '390+',
    upcomingEventsCount: '76+',
    reputationText: 'Integrated Exhibition Leader',
    overviewDescription:
      "Spread over 58 acres with an enormous 235,000 square meters of built-up space, the India Expo Centre & Mart in Greater Noida is India's first integrated exhibition-cum-mart complex. Housing 16 multi-functional exhibition halls, 29 meeting and banquet rooms, and 1,800 permanent export mart suites, the venue is globally recognized as the perennial host of the Auto Expo Motor Show, Renewable Energy India (REI), and IHGF Delhi Fair. Positioned right beside the Knowledge Park II Metro Station and Noida-Greater Noida Expressway, with proximity to the upcoming Jewar International Airport, it is a dominant powerhouse for international trade conclaves.",
    totalArea: '58 Acres (235,000 sqm built)',
    builtYear: '2006',
    renovatedYear: '2023',
    meetingRooms: '16 Exhibition Halls • 29 Conference Rooms',
    ratingsBreakdown: {
      location: 9.4,
      amenities: 9.6,
      cleanliness: 9.7,
      food: 9.2
    },
    gallery: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop'
    ],
    leadingEvents: [
      {
        id: 1,
        title: 'Auto Expo - The Motor Show 2027',
        dates: 'Wed, 13 - Mon, 18 Jan 2027',
        category: 'Automotive & EV Mobility',
        turnout: '600,000+ Visitors',
        daysToGo: 'Upcoming'
      },
      {
        id: 2,
        title: 'Renewable Energy India Expo (REI) 2026',
        dates: 'Thu, 01 - Sat, 03 Oct 2026',
        category: 'Solar, Wind & Clean Hydrogen',
        turnout: '45,000+ Trade Buyers',
        daysToGo: '21 days to go'
      },
      {
        id: 3,
        title: 'IHGF Delhi Fair (Autumn) 2026',
        dates: 'Wed, 14 - Sun, 18 Oct 2026',
        category: 'Handicrafts, Fashion & Home Décor',
        turnout: '50,000+ International Buyers',
        daysToGo: '34 days to go'
      },
      {
        id: 4,
        title: 'CPHI & PMEC India 2026',
        dates: 'Tue, 24 - Thu, 26 Nov 2026',
        category: 'Pharma Ingredients & Machinery',
        turnout: '48,000+ Pharma Leaders',
        daysToGo: '75 days to go'
      }
    ],
    meetingSpaces: [
      { name: 'Hall 1, 3 & 5 (Auto Expo Pavilions)', capacity: '35,000 Attendees', area: '25,000 sqm', type: 'Mega Expo Pavilions' },
      { name: 'Grand Ballroom & Convention Center', capacity: '3,000 Seated', area: '3,500 sqm', type: 'Banquet & Plenary' },
      { name: 'Knowledge Park Conclave Rooms', capacity: '800 Delegates', area: '1,200 sqm', type: 'B2B Meeting Suites' },
      { name: 'Permanent Mart Mart Suites', capacity: '1,800 Suites', area: '50,000 sqm', type: 'Permanent Showrooms' }
    ],
    nearbyVenues: [
      { name: 'Bharat Mandapam (IECC)', location: 'New Delhi', distance: '28 miles', eventsHosted: '342+' },
      { name: 'Yashobhoomi (IICC)', location: 'Dwarka, New Delhi', distance: '45 miles', eventsHosted: '229+' },
      { name: 'Noida Indoor Stadium Conclave', location: 'Sector 21A, Noida', distance: '16 miles', eventsHosted: '95+' }
    ],
    nearbyHotels: [
      { name: 'Crowne Plaza Greater Noida', stars: 5, price: 'From ₹10,200 / night', distance: '3.5 km', rating: 4.8 },
      { name: 'Radisson Blu Hotel Greater Noida', stars: 5, price: 'From ₹9,500 / night', distance: '4.1 km', rating: 4.7 },
      { name: 'Savoy Suites Greater Noida', stars: 4, price: 'From ₹5,400 / night', distance: '2.8 km', rating: 4.3 },
      { name: 'Jaypee Greens Golf & Spa Resort', stars: 5, price: 'From ₹14,000 / night', distance: '6.2 km', rating: 4.8 }
    ]
  },

  'excel-london': {
    id: 'excel-london',
    slug: 'excel-london',
    name: 'ExCeL London',
    shortName: 'ExCeL London',
    tagline: 'Premier International Exhibition & Convention Centre on Royal Victoria Dock',
    city: 'London',
    state: 'England',
    country: 'United Kingdom',
    address: 'Royal Victoria Dock, 1 Western Gateway, Royal Docks, London E16 1XL, UK',
    metro: 'Custom House & Prince Regent Stations (Elizabeth Line & DLR Direct)',
    airportDistance: '1 mile from London City Airport (LCY) / Direct Elizabeth Line to Heathrow (LHR)',
    heroBanner: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1600&auto=format&fit=crop',
    logoThumbnail: 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?q=80&w=300&auto=format&fit=crop',
    followersCount: '73K+',
    rating: 4.1,
    ratingsCount: 1775,
    bestSuited: 'Tradeshows & International Congresses',
    eventsHosted: '877+',
    upcomingEventsCount: '209+',
    reputationText: 'Very Good Reputation',
    overviewDescription:
      "With an exquisite waterfront as its backdrop along Royal Victoria Dock, ExCeL London plays a primary role as the host venue for a wide range of eminent international conferences, trade expos, and consumer shows. Boasting 100,000 square meters of flexible exhibition space across two interconnected halls, a state-of-the-art International Convention Centre (ICC) seating up to 4,500 delegates, and direct access to the high-speed Elizabeth Line providing swift 12-minute transit to central London, ExCeL is one of the world's most accessible exhibition hubs.",
    totalArea: '100 Acres (100,000 sqm covered)',
    builtYear: '2000',
    renovatedYear: '2010',
    meetingRooms: '85 Meeting Rooms • 2 Mega Exhibition Halls',
    ratingsBreakdown: {
      location: 9.2,
      amenities: 8.9,
      cleanliness: 9.1,
      food: 8.5
    },
    gallery: [
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop'
    ],
    leadingEvents: [
      {
        id: 1,
        title: 'The Property Investor Show',
        dates: 'Fri, 16 - Sun, 18 Apr 2027',
        category: 'Real Estate & Investment',
        turnout: '25,000+ Investors',
        daysToGo: 'Upcoming'
      },
      {
        id: 2,
        title: 'World Travel Market London',
        dates: 'Tue, 03 - Thu, 05 Nov 2026',
        category: 'Global Tourism & Aviation',
        turnout: '45,000+ Travel Buyers',
        daysToGo: '54 days to go'
      },
      {
        id: 3,
        title: 'Salon International',
        dates: 'Sun, 04 - Mon, 05 Oct 2026',
        category: 'Beauty, Hair & Cosmetics',
        turnout: '38,000+ Salons',
        daysToGo: '24 days to go'
      },
      {
        id: 4,
        title: 'Natural & Organic Food Show',
        dates: 'Wed, 16 - Thu, 17 Sep 2026',
        category: 'Organic FMCG & Health Food',
        turnout: '22,000+ Retailers',
        daysToGo: '6 days to go'
      }
    ],
    meetingSpaces: [
      { name: 'ICC Auditorium (Plenary)', capacity: '4,500 Delegates', area: '6,200 sqm', type: 'Auditorium' },
      { name: 'North & South Exhibition Halls', capacity: '40,000 Attendees', area: '100,000 sqm', type: 'Dividable Halls' },
      { name: 'Platinum Suite London', capacity: '1,100 Guests', area: '1,400 sqm', type: 'Conference Suite' },
      { name: 'CentrEd at ExCeL', capacity: '400 Delegates', area: '950 sqm', type: 'Dedicated Training Centre' }
    ],
    nearbyVenues: [
      { name: 'CentrEd at ExCeL London', location: 'Royal Docks, London', distance: '0.1 miles', eventsHosted: '5+' },
      { name: 'Platinum Suite London', location: 'Royal Docks, London', distance: '0.1 miles', eventsHosted: '3+' },
      { name: 'Manchester Central Convention Complex', location: 'Manchester, UK', distance: '200 miles', eventsHosted: '340+' }
    ],
    nearbyHotels: [
      { name: 'Sunborn London Yacht Hotel', stars: 4, price: 'From GBP 92 / night', distance: '0.2 km', rating: 4.5 },
      { name: 'ibis Styles London Excel', stars: 3, price: 'From GBP 58 / night', distance: '0.3 km', rating: 4.1 },
      { name: 'Waterfront Spectacular View Hotel', stars: 4, price: 'From GBP 203 / night', distance: '0.5 km', rating: 4.7 },
      { name: 'Aloft London Excel', stars: 4, price: 'From GBP 110 / night', distance: '0.4 km', rating: 4.4 }
    ]
  }
};

/**
 * Helper to get a venue by ID or normalized slug
 */
export function getVenueById(idOrSlug) {
  if (!idOrSlug) return null;
  const normalized = String(idOrSlug).toLowerCase().trim().replace(/_/g, '-');

  // Direct match
  if (VENUES_DATA[normalized]) return VENUES_DATA[normalized];

  // Alias lookups
  if (normalized.includes('bharat') || normalized.includes('pragati')) return VENUES_DATA['bharat-mandapam'];
  if (normalized.includes('yashobhoomi') || normalized.includes('iicc')) return VENUES_DATA['yashobhoomi'];
  if (normalized.includes('jio') || normalized.includes('jwcc')) return VENUES_DATA['jio-world'];
  if (normalized.includes('bombay') || normalized.includes('nesco') || normalized.includes('bec')) return VENUES_DATA['bec-mumbai'];
  if (normalized.includes('biec') || normalized.includes('bangalore') || normalized.includes('bengaluru')) return VENUES_DATA['biec-bengaluru'];
  if (normalized.includes('expo-centre') || normalized.includes('greater-noida') || normalized.includes('mart')) return VENUES_DATA['india-expo-centre'];
  if (normalized.includes('excel') || normalized.includes('london')) return VENUES_DATA['excel-london'];

  // Default fallback to first venue
  return Object.values(VENUES_DATA)[0];
}
