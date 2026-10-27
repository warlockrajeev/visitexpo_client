'use client';

/**
 * @file page.js (Exhibitor Discovery)
 * @description Allows organizers to discover global and Indian trade exhibitors,
 * filter by Preferred Industry, Search Products, and Preferred Country,
 * and connect by sending B2B inquiries (100–300 characters, 10 credits charged).
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../../context/AuthContext.js';
import {
  Compass,
  Globe,
  Search,
  Filter,
  RotateCcw,
  Send,
  Building,
  CheckCircle,
  AlertTriangle,
  Coins,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Mail,
  Phone,
  UserCheck,
  Star,
  Layers,
  ArrowRight,
  ShieldCheck,
  Tag,
  MessageSquare,
  HelpCircle,
  Clock,
  Check,
  Eye,
  MapPin,
  Calendar
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

const EXHIBITORS_PER_PAGE = 9;

// Curated Fallback Exhibitors (Indian & Global)
const FALLBACK_EXHIBITORS = [
  // --- INDIAN EXHIBITORS ---
  {
    _id: 'disc-ind-001',
    name: 'Tata Advanced Systems Ltd (TASL)',
    origin: 'india',
    country: 'India',
    countryFlag: '🇮🇳',
    city: 'Hyderabad, Telangana',
    industry: 'Aerospace, Defence & Security',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80',
    description: 'Premier aerospace and defence manufacturing powerhouse. Specializing in tactical unmanned aerial systems, composite aerostructures, missile integration, and advanced robotics.',
    products: ['Tactical Drones & UAVs', 'Composite Aerostructures', 'Industrial Robotics', 'C4I Command Systems', 'Airframe Assemblies'],
    attendanceType: 'hybrid',
    boothNumber: 'Hall 1 - D04 | Virtual 3D Pavilion V-101',
    eventTitle: 'BAUMA CONEXPO & Global Industrial Expo 2026',
    contactPerson: 'Col. Sandeep Verma',
    contactDesignation: 'Head of Aerospace OEM Partnerships',
    contactEmail: 'sandeep.v@tataadvanced.com',
    contactPhone: '+91 40 6652 4000',
    verified: true,
    rating: 4.9,
    creditsRequired: 10
  },
  {
    _id: 'disc-ind-002',
    name: 'Larsen & Toubro Heavy Engineering (L&T)',
    origin: 'india',
    country: 'India',
    countryFlag: '🇮🇳',
    city: 'Mumbai, Maharashtra',
    industry: 'Manufacturing & Heavy Engineering',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80',
    description: 'Global engineering conglomerate delivering custom critical process plant equipment, high-pressure vessels, cryogenic storage, and modular engineering systems.',
    products: ['Pressure Vessels', 'Nuclear Piping Modules', 'Heat Exchangers', 'Cracker Columns', 'Hydroprocessing Reactors'],
    attendanceType: 'hybrid',
    boothNumber: 'Hall 3 - L08 | Virtual Booth V-205',
    eventTitle: 'BAUMA CONEXPO INDIA 2026',
    contactPerson: 'Sunil Nair',
    contactDesignation: 'VP Global Sourcing & Supply Chain',
    contactEmail: 's.nair@larsentoubro.com',
    contactPhone: '+91 22 6752 5656',
    verified: true,
    rating: 4.9,
    creditsRequired: 10
  },
  {
    _id: 'disc-ind-003',
    name: 'Reliance New Energy & Solar Tech',
    origin: 'india',
    country: 'India',
    countryFlag: '🇮🇳',
    city: 'Jamnagar & Mumbai',
    industry: 'Renewable Energy, Solar & CleanTech',
    logo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&auto=format&fit=crop&q=80',
    description: 'Giga-factory producer of ultra-efficient heterojunction solar photovoltaic panels, utility-scale battery energy storage systems (BESS), and green hydrogen electrolysers.',
    products: ['Heterojunction Solar PV', 'BESS Grid Batteries', 'Green Hydrogen Electrolysers', 'Smart Solar Inverters'],
    attendanceType: 'hybrid',
    boothNumber: 'Hall 5 - R12 | Virtual 3D Dome V-310',
    eventTitle: 'Renewable Energy India Expo 2026',
    contactPerson: 'Meera Ambani-Desai',
    contactDesignation: 'Director Clean Energy Partnerships',
    contactEmail: 'meera.d@reliance.com',
    contactPhone: '+91 22 3555 5000',
    verified: true,
    rating: 4.8,
    creditsRequired: 10
  },
  {
    _id: 'disc-ind-004',
    name: 'Bharat Forge Ltd - Kalyani Group',
    origin: 'india',
    country: 'India',
    countryFlag: '🇮🇳',
    city: 'Pune, Maharashtra',
    industry: 'Automotive & Electric Vehicles (EV)',
    logo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80',
    description: 'World-leading precision forged components and powertrain solutions supplier for passenger, commercial, and next-generation electric vehicles.',
    products: ['Electric Axles', 'Heavy Truck Forged Axles', 'Dual-Clutch Transmission Forgings', 'Aluminium Chassis Knuckles'],
    attendanceType: 'hybrid',
    boothNumber: 'Hall 2 - B16 | Virtual Stand V-114',
    eventTitle: 'Auto Expo Components & Clean Mobility 2026',
    contactPerson: 'Rajesh Kalyani',
    contactDesignation: 'VP Global OEM Business Development',
    contactEmail: 'rajesh.k@bharatforge.com',
    contactPhone: '+91 20 6704 2777',
    verified: true,
    rating: 4.9,
    creditsRequired: 10
  },
  {
    _id: 'disc-ind-005',
    name: 'Amul Dairy Technology & Cold Chain',
    origin: 'india',
    country: 'India',
    countryFlag: '🇮🇳',
    city: 'Anand, Gujarat',
    industry: 'Food Processing, Agriculture & Dairy',
    logo: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=150&auto=format&fit=crop&q=80',
    description: 'Pioneering dairy engineering and cold-chain innovations. Offering high-speed automated milk processing lines, blast freezers, and aseptic packaging setups.',
    products: ['Automated UHT Processing', 'Aseptic Filling Equipment', 'Blast Freezers', 'Solar Cold Rooms', 'Dairy Automation SCADA'],
    attendanceType: 'hybrid',
    boothNumber: 'Hall 4 - A02 | Virtual Stand V-401',
    eventTitle: 'AAHAR International Food & Hospitality Fair 2026',
    contactPerson: 'Pradeep Patel',
    contactDesignation: 'Technical Operations Head',
    contactEmail: 'p.patel@amul.coop',
    contactPhone: '+91 2692 258506',
    verified: true,
    rating: 4.8,
    creditsRequired: 10
  },
  {
    _id: 'disc-ind-006',
    name: "Dr. Reddy's Laboratories - Custom Pharma",
    origin: 'india',
    country: 'India',
    countryFlag: '🇮🇳',
    city: 'Hyderabad, Telangana',
    industry: 'Healthcare, Pharma & Medical Devices',
    logo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&auto=format&fit=crop&q=80',
    description: 'Global pharmaceutical and CDMO solutions provider with GMP-certified active pharmaceutical ingredients (APIs), peptide synthesis, and biosimilars.',
    products: ['Active Pharmaceutical Ingredients (APIs)', 'Peptide Synthesis Lines', 'Sterile Injectables', 'Biosimilar Therapeutics'],
    attendanceType: 'hybrid',
    boothNumber: 'Hall 7 - DR01 | Virtual Pavilion V-701',
    eventTitle: 'CPhI & P-MEC India 2026',
    contactPerson: 'Dr. Ananya Sen',
    contactDesignation: 'Global Licensing & CDMO Director',
    contactEmail: 'ananya.sen@drreddys.com',
    contactPhone: '+91 40 4900 2900',
    verified: true,
    rating: 4.9,
    creditsRequired: 10
  },
  {
    _id: 'disc-ind-007',
    name: 'Godrej Material Handling & Storage Systems',
    origin: 'india',
    country: 'India',
    countryFlag: '🇮🇳',
    city: 'Mumbai, Maharashtra',
    industry: 'Packaging, Plastics & Material Handling',
    logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=150&auto=format&fit=crop&q=80',
    description: 'Leading provider of intralogistics, lithium-ion forklifts, electric reach trucks, and fully automated storage and retrieval systems (ASRS).',
    products: ['Lithium-Ion Electric Forklifts', 'Reach Trucks', 'Automated AS/RS Warehousing', 'Pallet Shuttle Racks'],
    attendanceType: 'hybrid',
    boothNumber: 'Hall 6 - G05 | Virtual Stand V-605',
    eventTitle: 'India Warehousing & Logistics Show 2026',
    contactPerson: 'Vikram Godrej',
    contactDesignation: 'Head of Intralogistics Engineering',
    contactEmail: 'vikram.g@godrej.com',
    contactPhone: '+91 22 6796 1700',
    verified: true,
    rating: 4.7,
    creditsRequired: 10
  },
  {
    _id: 'disc-ind-008',
    name: 'Ather Energy Commercial & Fleet Solutions',
    origin: 'india',
    country: 'India',
    countryFlag: '🇮🇳',
    city: 'Bengaluru, Karnataka',
    industry: 'Automotive & Electric Vehicles (EV)',
    logo: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&auto=format&fit=crop&q=80',
    description: 'Fast-charging infrastructure, smart commercial EV fleets, intelligent battery management systems, and cloud analytics telematics.',
    products: ['Fleet Fast Chargers', 'Smart Battery Packs', 'Fleet Telematics Cloud', 'Swappable Battery Kiosks'],
    attendanceType: 'hybrid',
    boothNumber: 'Hall 2 - AT09 | Virtual Booth V-219',
    eventTitle: 'India International EV Show 2026',
    contactPerson: 'Tarun Mehta',
    contactDesignation: 'Commercial Fleet Solutions Lead',
    contactEmail: 'tarun.m@atherenergy.com',
    contactPhone: '+91 80 6646 5500',
    verified: true,
    rating: 4.8,
    creditsRequired: 10
  },
  {
    _id: 'disc-ind-009',
    name: 'Infosys FinTech & Enterprise AI Solutions',
    origin: 'india',
    country: 'India',
    countryFlag: '🇮🇳',
    city: 'Bengaluru, Karnataka',
    industry: 'Technology, AI & Software',
    logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&auto=format&fit=crop&q=80',
    description: 'Enterprise AI workflows, core banking platforms, generative copilot integrations, and zero-trust cloud infrastructure for global institutions.',
    products: ['Finacle Core Banking', 'Generative Enterprise Copilot', 'Cloud Migration Automation', 'Real-time Fraud AI'],
    attendanceType: 'hybrid',
    boothNumber: 'Hall 1 - IN03 | Virtual 3D Stage V-103',
    eventTitle: 'Global FinTech Expo 2026',
    contactPerson: 'Rohit Sharma',
    contactDesignation: 'VP Enterprise Digital Platforms',
    contactEmail: 'rohit.s@infosys.com',
    contactPhone: '+91 80 2852 0261',
    verified: true,
    rating: 4.9,
    creditsRequired: 10
  },
  {
    _id: 'disc-ind-010',
    name: 'Arvind Smart Textiles & Technical Fabrics',
    origin: 'india',
    country: 'India',
    countryFlag: '🇮🇳',
    city: 'Ahmedabad, Gujarat',
    industry: 'Textiles, Garments & Sustainable Fashion',
    logo: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=150&auto=format&fit=crop&q=80',
    description: 'Technical and sustainable textile innovations. Manufacturer of flame-retardant Nomex workwear, medical barrier fabrics, and circular recycled denims.',
    products: ['Flame Retardant Workwear', 'Medical Barrier Textiles', 'Recycled Circular Denims', 'Water-repellent Tech Fabrics'],
    attendanceType: 'hybrid',
    boothNumber: 'Hall 8 - AR04 | Virtual Stand V-804',
    eventTitle: 'Bharat Tex Global Textile Fair 2026',
    contactPerson: 'Priya Lalbhai',
    contactDesignation: 'Sustainable Sourcing Director',
    contactEmail: 'priya.l@arvindtextiles.com',
    contactPhone: '+91 79 6826 4000',
    verified: true,
    rating: 4.8,
    creditsRequired: 10
  },

  // --- GLOBAL EXHIBITORS ---
  {
    _id: 'disc-glb-001',
    name: 'Siemens AG - Digital Industries',
    origin: 'global',
    country: 'Germany',
    countryFlag: '🇩🇪',
    city: 'Munich, Bavaria',
    industry: 'Technology, AI & Software',
    logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop&q=80',
    description: 'Global pioneer in smart manufacturing, PLCs, industrial IoT, digital twin simulation, and generative AI for factory automation.',
    products: ['SIMATIC S7-1500 PLCs', 'MindSphere Industrial IoT', 'Digital Twin Simulation', 'SINAMICS Frequency Inverters'],
    attendanceType: 'hybrid',
    boothNumber: 'Global Pavilion Hall 3 - G01 | Virtual Metaverse V-301',
    eventTitle: 'Hannover Messe & Global Automation 2026',
    contactPerson: 'Klaus Weber',
    contactDesignation: 'Director Industry 4.0 Ecosystems',
    contactEmail: 'klaus.weber@siemens.com',
    contactPhone: '+49 89 636 00',
    verified: true,
    rating: 5.0,
    creditsRequired: 10
  },
  {
    _id: 'disc-glb-002',
    name: 'Schneider Electric - EcoStruxure Tech',
    origin: 'global',
    country: 'France',
    countryFlag: '🇫🇷',
    city: 'Rueil-Malmaison, Île-de-France',
    industry: 'Renewable Energy, Solar & CleanTech',
    logo: 'https://images.unsplash.com/photo-1517976487588-468a356cb0b7?w=150&auto=format&fit=crop&q=80',
    description: 'Global leader in digital energy management and industrial automation. EcoStruxure microgrid software, smart MV switchboards, and solar inverters.',
    products: ['EcoStruxure Microgrid Controllers', 'Smart Medium Voltage Switchboards', 'Commercial Solar Inverters', 'Data Center Cooling'],
    attendanceType: 'hybrid',
    boothNumber: 'Global Pavilion Hall 5 - SE02 | Virtual Stand V-502',
    eventTitle: 'Global CleanTech Convention 2026',
    contactPerson: 'Claire Delacroix',
    contactDesignation: 'VP Sustainability Solutions',
    contactEmail: 'claire.delacroix@se.com',
    contactPhone: '+33 1 41 29 70 00',
    verified: true,
    rating: 4.9,
    creditsRequired: 10
  },
  {
    _id: 'disc-glb-003',
    name: 'Bosch Mobility Solutions & ADAS',
    origin: 'global',
    country: 'Germany',
    countryFlag: '🇩🇪',
    city: 'Stuttgart, Baden-Württemberg',
    industry: 'Automotive & Electric Vehicles (EV)',
    logo: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=150&auto=format&fit=crop&q=80',
    description: 'Premier automotive supplier of advanced driver assistance systems (ADAS), silicon carbide inverters, steering actuators, and connected car telematics.',
    products: ['Radar & LiDAR ADAS Sensors', 'Silicon Carbide Power Inverters', 'Electric Power Steering Actuators', 'Over-The-Air Telematics'],
    attendanceType: 'hybrid',
    boothNumber: 'Global Pavilion Hall 2 - BO07 | Virtual Booth V-207',
    eventTitle: 'Auto Expo Components & Clean Energy 2026',
    contactPerson: 'Rohan Deshmukh',
    contactDesignation: 'Lead Global OEM Integration',
    contactEmail: 'rohan.deshmukh@bosch.com',
    contactPhone: '+49 711 811 0',
    verified: true,
    rating: 4.9,
    creditsRequired: 10
  },
  {
    _id: 'disc-glb-004',
    name: 'Emerson Electric Co - Process Automation',
    origin: 'global',
    country: 'United States',
    countryFlag: '🇺🇸',
    city: 'St. Louis, Missouri',
    industry: 'Manufacturing & Heavy Engineering',
    logo: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=150&auto=format&fit=crop&q=80',
    description: 'Critical process controls, Fisher control valves, Rosemount measurement instruments, and DeltaV distributed control architectures.',
    products: ['Fisher Control Valves', 'Rosemount Flow Transmitters', 'DeltaV Distributed Control Systems', 'Asset Health Monitoring Sensors'],
    attendanceType: 'hybrid',
    boothNumber: 'Global Pavilion Hall 4 - EM08 | Virtual Stand V-408',
    eventTitle: 'Process Engineering World Summit 2026',
    contactPerson: 'Sarah Jenkins',
    contactDesignation: 'VP International Sales & Distribution',
    contactEmail: 's.jenkins@emerson.com',
    contactPhone: '+1 314 553 2000',
    verified: true,
    rating: 4.8,
    creditsRequired: 10
  },
  {
    _id: 'disc-glb-005',
    name: 'Mitsubishi Electric - Factory Automation',
    origin: 'global',
    country: 'Japan',
    countryFlag: '🇯🇵',
    city: 'Tokyo, Kanto',
    industry: 'Technology, AI & Software',
    logo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=150&auto=format&fit=crop&q=80',
    description: 'Precision industrial automation, articulated robotic arms, high-speed CNC controls, and energy-saving variable frequency inverters.',
    products: ['MELFA Articulated Robots', 'Precision CNC Controllers', 'Servo Motors & Amplifiers', 'e-F@ctory Smart Edge Devices'],
    attendanceType: 'hybrid',
    boothNumber: 'Global Pavilion Hall 3 - ME14 | Virtual 3D Stage V-314',
    eventTitle: 'International Robot Exhibition (iREX) 2026',
    contactPerson: 'Kenji Tanaka',
    contactDesignation: 'Global Export & Solution Manager',
    contactEmail: 'k.tanaka@mitsubishielectric.co.jp',
    contactPhone: '+81 3 3218 2111',
    verified: true,
    rating: 4.9,
    creditsRequired: 10
  },
  {
    _id: 'disc-glb-006',
    name: 'Fanuc Robotics & Industrial Automation',
    origin: 'global',
    country: 'Japan',
    countryFlag: '🇯🇵',
    city: 'Yamanashi Prefecture',
    industry: 'Manufacturing & Heavy Engineering',
    logo: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=150&auto=format&fit=crop&q=80',
    description: 'World-renowned yellow robots. Collaborative cobots with vision guidance, heavy payload foundry arms, and high-speed Robodrill machining centers.',
    products: ['CRX Collaborative Cobots', 'Heavy Payload Foundry Robots', 'Robodrill 5-Axis CNC Centers', 'iRVision 3D AI Cameras'],
    attendanceType: 'hybrid',
    boothNumber: 'Global Pavilion Hall 3 - FN01 | Virtual Stand V-302',
    eventTitle: 'BAUMA CONEXPO & Global Industrial Expo 2026',
    contactPerson: 'Hiroshi Sato',
    contactDesignation: 'Chief Robotics Application Specialist',
    contactEmail: 'h.sato@fanuc.co.jp',
    contactPhone: '+81 555 84 5555',
    verified: true,
    rating: 5.0,
    creditsRequired: 10
  },
  {
    _id: 'disc-glb-007',
    name: 'Honeywell Industrial Safety & Avionics',
    origin: 'global',
    country: 'United States',
    countryFlag: '🇺🇸',
    city: 'Charlotte, North Carolina',
    industry: 'Aerospace, Defence & Security',
    logo: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=150&auto=format&fit=crop&q=80',
    description: 'Advanced aviation avionics, personal protective equipment (PPE), flame and toxic gas detection systems, and automated warehouse barcode scanners.',
    products: ['Toxic Gas & Flame Detectors', 'SCBA Fire Fighting Units', 'Rugged Industrial Scanners', 'Commercial Aircraft Flight Management'],
    attendanceType: 'hybrid',
    boothNumber: 'Global Pavilion Hall 1 - HW11 | Virtual Stand V-111',
    eventTitle: 'DefExpo & Homeland Security Expo 2026',
    contactPerson: 'David Miller',
    contactDesignation: 'Director Enterprise Government Accounts',
    contactEmail: 'david.miller@honeywell.com',
    contactPhone: '+1 704 627 6200',
    verified: true,
    rating: 4.8,
    creditsRequired: 10
  },
  {
    _id: 'disc-glb-008',
    name: 'ABB Robotics & Discrete Automation',
    origin: 'global',
    country: 'Switzerland',
    countryFlag: '🇨🇭',
    city: 'Zurich, Canton of Zurich',
    industry: 'Manufacturing & Heavy Engineering',
    logo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&auto=format&fit=crop&q=80',
    description: 'Electrification and industrial robotics pioneer. Dual-arm collaborative robots (YuMi), industrial paint atomizers, and high-voltage GIS substations.',
    products: ['YuMi Dual-Arm Cobots', 'Industrial Paint Robots', 'High-Voltage GIS Substations', 'Smart Motor Sensors'],
    attendanceType: 'hybrid',
    boothNumber: 'Global Pavilion Hall 3 - ABB03 | Virtual 3D Pavilion V-303',
    eventTitle: 'BAUMA CONEXPO & Global Industrial Expo 2026',
    contactPerson: 'Markus Lindqvist',
    contactDesignation: 'Head of Collaborative Robotics',
    contactEmail: 'markus.lindqvist@abb.com',
    contactPhone: '+41 43 317 71 11',
    verified: true,
    rating: 4.9,
    creditsRequired: 10
  },
  {
    _id: 'disc-glb-009',
    name: 'Emirates Global Aluminium (EGA Tech)',
    origin: 'global',
    country: 'United Arab Emirates',
    countryFlag: '🇦🇪',
    city: 'Dubai, UAE',
    industry: 'Building, Construction & Smart Infrastructure',
    logo: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=150&auto=format&fit=crop&q=80',
    description: 'Largest industrial enterprise in the UAE outside oil & gas. Manufacturer of ultra-pure primary aluminium, CelestiAL solar-powered alloys, and architectural extrusion billets.',
    products: ['CelestiAL Solar Aluminium', 'Architectural Extrusion Billets', 'EV Chassis Foundry Alloys', 'High-Conductivity Busbars'],
    attendanceType: 'hybrid',
    boothNumber: 'Global Pavilion Hall 6 - EGA01 | Virtual Stand V-601',
    eventTitle: 'The Big 5 Global Construction Fair 2026',
    contactPerson: 'Tariq Mansoor',
    contactDesignation: 'Commercial Sourcing Director',
    contactEmail: 'tariq.m@ega.ae',
    contactPhone: '+971 4 814 3000',
    verified: true,
    rating: 4.9,
    creditsRequired: 10
  },
  {
    _id: 'disc-glb-010',
    name: 'Daikin Global Air Conditioning Solutions',
    origin: 'global',
    country: 'Japan',
    countryFlag: '🇯🇵',
    city: 'Osaka, Kansai',
    industry: 'Building, Construction & Smart Infrastructure',
    logo: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=150&auto=format&fit=crop&q=80',
    description: 'World #1 HVAC and climate control innovator. Commercial VRV heat pump systems, magnetic bearing chillers, and zero-emission refrigeration.',
    products: ['VRV Commercial Heat Pumps', 'Magnetic Bearing Centrifugal Chillers', 'HEPA Cleanroom Air Handlers', 'Cold Chain Transicold Compressors'],
    attendanceType: 'hybrid',
    boothNumber: 'Global Pavilion Hall 5 - DK09 | Virtual Stand V-509',
    eventTitle: 'ACREX India International Expo 2026',
    contactPerson: 'Takashi Mori',
    contactDesignation: 'Commercial HVAC Solutions Specialist',
    contactEmail: 't.mori@daikin.com',
    contactPhone: '+81 6 6373 4312',
    verified: true,
    rating: 4.8,
    creditsRequired: 10
  },
  {
    _id: 'disc-glb-011',
    name: 'Hanwha Q CELLS Clean Energy',
    origin: 'global',
    country: 'South Korea',
    countryFlag: '🇰🇷',
    city: 'Seoul, South Korea',
    industry: 'Renewable Energy, Solar & CleanTech',
    logo: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=150&auto=format&fit=crop&q=80',
    description: 'Tier-1 clean energy technology company providing Q.ANTUM DUO solar modules, commercial scale battery storage, and smart microgrid power solutions.',
    products: ['Q.PEAK DUO Bifacial Solar Modules', 'Q.VOLT Smart Inverters', 'Commercial ESS Energy Storage', 'Microgrid AI Software'],
    attendanceType: 'hybrid',
    boothNumber: 'Global Pavilion Hall 5 - QC05 | Virtual Stand V-505',
    eventTitle: 'Renewable Energy World Expo 2026',
    contactPerson: 'Min-ho Park',
    contactDesignation: 'VP Global Infrastructure Projects',
    contactEmail: 'minho.park@q-cells.com',
    contactPhone: '+82 2 729 2700',
    verified: true,
    rating: 4.8,
    creditsRequired: 10
  },
  {
    _id: 'disc-glb-012',
    name: 'STMicroelectronics - Semiconductor Innovation',
    origin: 'global',
    country: 'Switzerland',
    countryFlag: '🇨🇭',
    city: 'Geneva, Switzerland',
    industry: 'Technology, AI & Software',
    logo: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150&auto=format&fit=crop&q=80',
    description: 'Global semiconductor leader creating silicon chipsets, STM32 ultra-low-power microcontrollers, automotive SiC MOSFETs, and IoT MEMS motion sensors.',
    products: ['STM32 Low-Power Microcontrollers', 'Automotive SiC MOSFETs', 'Industrial MEMS Motion Sensors', 'Secure NFC Interface Chips'],
    attendanceType: 'hybrid',
    boothNumber: 'Global Pavilion Hall 1 - ST08 | Virtual Stand V-108',
    eventTitle: 'Electronica & embedded world India 2026',
    contactPerson: 'Gianluca Rossi',
    contactDesignation: 'Head of Industrial IoT Partnerships',
    contactEmail: 'g.rossi@st.com',
    contactPhone: '+41 22 929 29 29',
    verified: true,
    rating: 4.9,
    creditsRequired: 10
  }
];

// Available Industry Filter Options
const INDUSTRY_OPTIONS = [
  'All Industries',
  'Technology, AI & Software',
  'Manufacturing & Heavy Engineering',
  'Automotive & Electric Vehicles (EV)',
  'Healthcare, Pharma & Medical Devices',
  'Food Processing, Agriculture & Dairy',
  'Renewable Energy, Solar & CleanTech',
  'Textiles, Garments & Sustainable Fashion',
  'Building, Construction & Smart Infrastructure',
  'Packaging, Plastics & Material Handling',
  'Aerospace, Defence & Security'
];

// Available Country Filter Options
const COUNTRY_OPTIONS = [
  'All Countries',
  'India',
  'Germany',
  'United States',
  'United Arab Emirates',
  'Japan',
  'France',
  'Switzerland',
];

// Exhibitor Logo component with corrected text size and elegant fallback when image is not visible
function ExhibitorLogo({ src, name, className = 'h-12 w-12' }) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  // Extract short legible initials or brand name to fit cleanly inside the logo container
  const getShortLabel = (fullName) => {
    if (!fullName) return 'EX';
    // Match common acronym in parentheses e.g. (TASL), (L&T), (BHEL), (KBL)
    const parenMatch = fullName.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1] && parenMatch[1].length <= 6) {
      return parenMatch[1];
    }
    // Otherwise use first word of company name (e.g. Tata, Larsen, Reliance, Siemens)
    const firstWord = fullName.trim().split(/\s+/)[0];
    return firstWord;
  };

  const shortLabel = getShortLabel(name);

  // Determine ideal text size based on character count so it never overflows or looks oversized
  const getTextSizeClass = (str) => {
    const len = str?.length || 0;
    if (len <= 4) return 'text-[11px] font-black tracking-wide';
    if (len <= 6) return 'text-[10px] font-black tracking-tight leading-3';
    return 'text-[9px] font-bold tracking-tight leading-[11px]';
  };

  if (imgFailed || !src) {
    return (
      <div
        className={`${className} rounded-xl bg-secondary/90 border border-border/80 shadow-xs shrink-0 flex items-center justify-center p-1 text-center select-none overflow-hidden`}
        title={name}
      >
        <span className={`${getTextSizeClass(shortLabel)} uppercase text-foreground/85 line-clamp-2 break-all text-center`}>
          {shortLabel}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={shortLabel}
      onError={() => setImgFailed(true)}
      loading="lazy"
      className={`${className} rounded-xl object-cover border border-border shadow-xs shrink-0 text-[9px] leading-[11px] font-bold text-center text-muted-foreground overflow-hidden p-0.5`}
    />
  );
}

// Validate B2B inquiry message content, characters, and spam protection
function validateInquiryMessage(text) {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Message is required.', code: 'EMPTY' };
  }
  const trimmed = text.trim();
  const len = trimmed.length;

  if (len === 0) {
    return { isValid: false, error: 'Message cannot be empty.', code: 'EMPTY' };
  }

  // 1. Check for HTML tags or script injection
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return { isValid: false, error: 'HTML tags and script code are not allowed.', code: 'HTML_TAGS' };
  }

  // 2. Check for excessive repeated characters (e.g. aaaaa, ......, !!!!!!!)
  if (/(.)\1{4,}/.test(trimmed)) {
    return { isValid: false, error: 'Excessive repeated characters detected. Please enter genuine text.', code: 'REPEATED_CHARS' };
  }

  // 3. Check for pure symbols or gibberish (must have at least 60% alphabetic of non-space chars)
  const nonSpace = trimmed.replace(/\s+/g, '');
  const letters = trimmed.match(/[a-zA-Z]/g) || [];
  if (letters.length === 0 || (letters.length / nonSpace.length) < 0.6) {
    return {
      isValid: false,
      error: 'Message must consist of genuine text and words, not symbols or random characters.',
      code: 'SYMBOL_SPAM'
    };
  }

  // 4. Check character count bounds
  if (len < 100) {
    return {
      isValid: false,
      error: `Add at least ${100 - len} more character${100 - len === 1 ? '' : 's'} to reach 100.`,
      code: 'TOO_SHORT'
    };
  }
  if (len > 300) {
    return {
      isValid: false,
      error: `Exceeds 300-character maximum limit by ${len - 300} characters.`,
      code: 'TOO_LONG'
    };
  }

  // 5. Check for word count (minimum 10 words)
  const words = trimmed.split(/\s+/).filter((w) => /[a-zA-Z]{2,}/.test(w));
  if (words.length < 10) {
    return {
      isValid: false,
      error: `Please write a complete enquiry with at least 10 words (currently ${words.length}).`,
      code: 'FEW_WORDS'
    };
  }

  // 6. Check for repetitive words spam (e.g. "quote quote quote quote...")
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  if (uniqueWords.size < Math.min(6, Math.floor(words.length * 0.4))) {
    return {
      isValid: false,
      error: 'Please avoid repetitive words and write a meaningful B2B enquiry.',
      code: 'REPETITIVE_WORDS'
    };
  }

  return { isValid: true, error: null, code: 'VALID' };
}

export default function ExhibitorDiscoveryPage() {
  const { user, accessToken, updateUser } = useAuth();

  // All exhibitors loaded from API (fallback to curated list)
  const [exhibitors, setExhibitors] = useState(FALLBACK_EXHIBITORS);
  const [loading, setLoading] = useState(true);

  // User credits (default to saved localStorage credits, user.credits, or 100)
  const [userCredits, setUserCredits] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedCredits = localStorage.getItem('visitexpo_organizer_credits');
      if (savedCredits !== null && !isNaN(parseInt(savedCredits, 10))) {
        return parseInt(savedCredits, 10);
      }
    }
    return user?.credits !== undefined ? user.credits : 100;
  });

  // Filter Input States (Pre-applied)
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [searchProducts, setSearchProducts] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All Countries');
  const [originFilter, setOriginFilter] = useState('all'); // 'all' | 'india' | 'global'
  const [currentPage, setCurrentPage] = useState(1);

  // Applied Filter States (Controlled by Apply Button)
  const [appliedFilters, setAppliedFilters] = useState({
    industry: 'All Industries',
    product: '',
    country: 'All Countries',
    origin: 'all'
  });

  // Connect Modal State
  const [selectedExhibitor, setSelectedExhibitor] = useState(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [inquiryType, setInquiryType] = useState('B2B Trade Partnership');
  const [sendingInquiry, setSendingInquiry] = useState(false);

  // Details Modal State
  const [detailsExhibitor, setDetailsExhibitor] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  // Sent inquiries history
  const [sentInquiries, setSentInquiries] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('visitexpo_sent_inquiries');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'india', 'global'

  // Summary Metrics & Filtered Inquiries for History Modal
  const totalSentCount = sentInquiries.length;
  const totalCreditsSpent = totalSentCount * 10;
  const indianInquiriesCount = useMemo(
    () => sentInquiries.filter((inq) => inq.country?.toLowerCase().includes('india') || inq.countryFlag === '🇮🇳').length,
    [sentInquiries]
  );
  const globalInquiriesCount = totalSentCount - indianInquiriesCount;

  const filteredSentInquiries = useMemo(() => {
    return sentInquiries.filter((inq) => {
      // 1. Keyword search filter
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase().trim();
        const matchesName = inq.exhibitorName?.toLowerCase().includes(q);
        const matchesEmail = inq.exhibitorEmail?.toLowerCase().includes(q);
        const matchesIndustry = inq.industry?.toLowerCase().includes(q);
        const matchesMsg = inq.message?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesIndustry && !matchesMsg) return false;
      }
      // 2. Origin scope filter
      if (historyFilter === 'india') {
        const isIndia = inq.country?.toLowerCase().includes('india') || inq.countryFlag === '🇮🇳';
        if (!isIndia) return false;
      } else if (historyFilter === 'global') {
        const isIndia = inq.country?.toLowerCase().includes('india') || inq.countryFlag === '🇮🇳';
        if (isIndia) return false;
      }
      return true;
    });
  }, [sentInquiries, historySearchQuery, historyFilter]);

  // Helper to dynamically resolve exhibitor logo for sent inquiries (supports legacy saved records)
  const getInquiryLogo = (inq) => {
    if (inq?.exhibitorLogo) return inq.exhibitorLogo;
    if (inq?.logo) return inq.logo;
    const norm = (s) => (s || '').toLowerCase().trim();
    const inqName = norm(inq?.exhibitorName);
    const inqId = inq?.exhibitorId;
    const found =
      exhibitors.find((e) => {
        if (inqId && e._id === inqId) return true;
        const eName = norm(e.name);
        return eName && inqName && (eName === inqName || eName.includes(inqName) || inqName.includes(eName));
      }) ||
      FALLBACK_EXHIBITORS.find((e) => {
        if (inqId && e._id === inqId) return true;
        const eName = norm(e.name);
        return eName && inqName && (eName === inqName || eName.includes(inqName) || inqName.includes(eName));
      });
    return found?.logo || '';
  };

  // Auto-backfill logos on sent inquiries in local storage if they were saved before logo tracking
  useEffect(() => {
    if (sentInquiries && sentInquiries.length > 0) {
      let changed = false;
      const updated = sentInquiries.map((inq) => {
        if (!inq.exhibitorLogo && !inq.logo) {
          const matchedLogo = getInquiryLogo(inq);
          if (matchedLogo) {
            changed = true;
            return { ...inq, exhibitorLogo: matchedLogo, logo: matchedLogo };
          }
        }
        return inq;
      });
      if (changed) {
        setSentInquiries(updated);
        try {
          localStorage.setItem('visitexpo_sent_inquiries', JSON.stringify(updated));
        } catch (_) {}
      }
    }
  }, [exhibitors]);

  // Sync user credits on session load
  useEffect(() => {
    if (user?.credits !== undefined) {
      let activeCredits = user.credits;
      if (typeof window !== 'undefined') {
        const savedCredits = localStorage.getItem('visitexpo_organizer_credits');
        if (savedCredits !== null && !isNaN(parseInt(savedCredits, 10))) {
          const parsedLocal = parseInt(savedCredits, 10);
          // If local storage has higher test credits from prior top-up, preserve it and sync to backend
          if (parsedLocal > user.credits) {
            activeCredits = parsedLocal;
            const diff = parsedLocal - user.credits;
            const token = accessToken || localStorage.getItem('visitexpo_access_token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            axios
              .post(`${API_URL}/exhibitors/topup`, { amount: diff, email: user.email }, { headers })
              .then((res) => {
                if (res.data?.data?.credits !== undefined && updateUser) {
                  updateUser({ ...user, credits: res.data.data.credits });
                }
              })
              .catch((err) => console.warn('Could not auto-sync local credits to server:', err));
          }
        }
      }
      setUserCredits(activeCredits);
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_organizer_credits', String(activeCredits));
      }
    }
  }, [user]);

  // Show Toast Helper
  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch exhibitors from API
  const fetchExhibitors = async () => {
    setLoading(true);
    try {
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('visitexpo_access_token') : null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem('visitexpo_user') : null;
      let effectiveEmail = user?.email;
      if (!effectiveEmail && savedUserStr) {
        try {
          effectiveEmail = JSON.parse(savedUserStr)?.email;
        } catch (_) {}
      }
      const queryParam = effectiveEmail ? `?email=${encodeURIComponent(effectiveEmail)}` : '';
      const res = await axios.get(`${API_URL}/exhibitors/discovery${queryParam}`, { headers });
      if (res.data && res.data.success && res.data.data?.exhibitors) {
        setExhibitors(res.data.data.exhibitors);
        setCurrentPage(1);
        if (res.data.data.userCredits !== undefined) {
          const serverCredits = res.data.data.userCredits;
          let finalCredits = serverCredits;
          if (typeof window !== 'undefined') {
            const localVal = localStorage.getItem('visitexpo_organizer_credits');
            if (localVal !== null && !isNaN(parseInt(localVal, 10))) {
              const parsedLocal = parseInt(localVal, 10);
              // If local storage has higher test credits, preserve it
              if (parsedLocal > serverCredits) {
                finalCredits = parsedLocal;
              }
            }
            localStorage.setItem('visitexpo_organizer_credits', String(finalCredits));
          }
          setUserCredits(finalCredits);
          if (user && updateUser && user.credits !== finalCredits) {
            updateUser({ ...user, credits: finalCredits });
          }
        }
      }
    } catch (err) {
      console.warn('Backend discovery query note; using built-in curated catalog.', err);
      // Fallback already pre-set
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExhibitors();
  }, [accessToken]);

  // Handle "Apply Filters" button click
  const handleApplyFilters = () => {
    setAppliedFilters({
      industry: selectedIndustry,
      product: searchProducts.trim(),
      country: selectedCountry,
      origin: originFilter
    });
    setCurrentPage(1);
    showToast(`Filters applied! Exploring verified exhibitors.`);
  };

  // Handle Reset Filters
  const handleResetFilters = () => {
    setSelectedIndustry('All Industries');
    setSearchProducts('');
    setSelectedCountry('All Countries');
    setOriginFilter('all');
    setAppliedFilters({
      industry: 'All Industries',
      product: '',
      country: 'All Countries',
      origin: 'all'
    });
    setCurrentPage(1);
    showToast(`Filters reset to default view.`);
  };

  // Filtered Exhibitors Computed
  const filteredExhibitors = useMemo(() => {
    return exhibitors.filter((ex) => {
      // 1. Origin filter
      if (appliedFilters.origin !== 'all' && ex.origin !== appliedFilters.origin) {
        return false;
      }

      // 2. Industry filter
      if (appliedFilters.industry !== 'All Industries') {
        const indA = (ex.industry || '').toLowerCase();
        const indB = appliedFilters.industry.toLowerCase();
        if (!indA.includes(indB) && !indB.includes(indA)) return false;
      }

      // 3. Country filter
      if (appliedFilters.country !== 'All Countries') {
        const cA = (ex.country || '').toLowerCase();
        const cB = appliedFilters.country.toLowerCase();
        if (!cA.includes(cB) && !cB.includes(cA)) return false;
      }

      // 4. Product Search filter
      if (appliedFilters.product) {
        const pTerm = appliedFilters.product.toLowerCase();
        const hasInProducts = Array.isArray(ex.products) && ex.products.some(p => p.toLowerCase().includes(pTerm));
        const hasInName = (ex.name || '').toLowerCase().includes(pTerm);
        const hasInDesc = (ex.description || '').toLowerCase().includes(pTerm);
        if (!hasInProducts && !hasInName && !hasInDesc) return false;
      }

      return true;
    });
  }, [exhibitors, appliedFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredExhibitors.length / EXHIBITORS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const firstExhibitorIndex = (activePage - 1) * EXHIBITORS_PER_PAGE;
  const paginatedExhibitors = filteredExhibitors.slice(
    firstExhibitorIndex,
    firstExhibitorIndex + EXHIBITORS_PER_PAGE
  );
  const paginationStart = Math.max(1, Math.min(activePage - 2, totalPages - 4));
  const paginationEnd = Math.min(totalPages, paginationStart + 4);
  const visiblePages = Array.from(
    { length: paginationEnd - paginationStart + 1 },
    (_, index) => paginationStart + index
  );

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Open Connect Modal
  const handleOpenConnect = (exhibitor) => {
    setSelectedExhibitor(exhibitor);
    setMessage('');
    setInquiryType('B2B Trade Partnership');
    setIsConnectModalOpen(true);
  };

  // Open Details Modal
  const handleOpenDetails = (exhibitor) => {
    setDetailsExhibitor(exhibitor);
    setIsDetailsModalOpen(true);
  };

  // Quick message template inserter
  const handleInsertTemplate = (type) => {
    if (type === 'rfq') {
      setMessage(
        `Hello ${selectedExhibitor?.name} team, we are reviewing your product lines for an upcoming enterprise procurement tender. Kindly provide your latest 2026 digital catalogue, unit MOQ, and lead times.`
      );
    } else if (type === 'booth') {
      setMessage(
        `Greetings, we are organizing a premier B2B expo track in 2026 and would like to invite ${selectedExhibitor?.name} as a featured trade exhibitor. We offer prime hybrid booth spaces and buyer delegations.`
      );
    }
  };

  // Send Connect Message (Charges 10 Credits)
  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!selectedExhibitor) return;

    if (!inquiryType || !inquiryType.trim()) {
      showToast('Please select an enquiry purpose.', 'error');
      return;
    }

    const validationCheck = validateInquiryMessage(message);
    if (!validationCheck.isValid) {
      showToast(validationCheck.error, 'error');
      return;
    }

    if (userCredits < 10) {
      showToast(`Insufficient credits! 10 credits required to connect. Please top up your balance.`, 'error');
      return;
    }

    const trimmed = message.trim();
    setSendingInquiry(true);

    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const payload = {
        exhibitorId: selectedExhibitor._id,
        exhibitorName: selectedExhibitor.name,
        exhibitorEmail: selectedExhibitor.contactEmail,
        exhibitorLogo: selectedExhibitor.logo,
        country: selectedExhibitor.country,
        industry: selectedExhibitor.industry,
        products: selectedExhibitor.products,
        message: trimmed,
        senderName: user?.name || 'Verified Event Organizer',
        senderEmail: user?.email || 'organizer@visitexpo.in',
        senderCompany: user?.company || 'VisitExpo Organizer Network',
        inquiryType
      };

      const res = await axios.post(`${API_URL}/exhibitors/inquiry`, payload, { headers });

      // Update Credits
      const newCredits = res.data?.data?.remainingCredits !== undefined
        ? res.data.data.remainingCredits
        : Math.max(0, userCredits - 10);

      setUserCredits(newCredits);
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_organizer_credits', String(newCredits));
      }
      if (user && updateUser) {
        updateUser({ ...user, credits: newCredits });
      }

      // Record in sent inquiries list
      const newInquiryRecord = {
        id: res.data?.data?.inquiryId || Date.now().toString(),
        exhibitorId: selectedExhibitor._id,
        exhibitorName: selectedExhibitor.name,
        exhibitorEmail: selectedExhibitor.contactEmail,
        exhibitorLogo: selectedExhibitor.logo,
        logo: selectedExhibitor.logo,
        country: selectedExhibitor.country,
        countryFlag: selectedExhibitor.countryFlag,
        industry: selectedExhibitor.industry,
        message: trimmed,
        inquiryType,
        creditsCharged: 10,
        sentAt: new Date().toISOString()
      };

      const updatedHistory = [newInquiryRecord, ...sentInquiries];
      setSentInquiries(updatedHistory);
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_sent_inquiries', JSON.stringify(updatedHistory));
      }

      setIsConnectModalOpen(false);
      showToast(`Enquiry sent to "${selectedExhibitor.name}"! 10 credits charged. Remaining: ${newCredits} credits.`, 'success');
    } catch (err) {
      console.error('Send inquiry error', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to deliver enquiry.';
      showToast(errMsg, 'error');
    } finally {
      setSendingInquiry(false);
    }
  };

  // Instant Top-Up for testing / organizer ease (persisted to server DB and session)
  const handleTopUpCredits = async () => {
    const updated = (userCredits || 0) + 50;
    // 1. Snappy UI response
    setUserCredits(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('visitexpo_organizer_credits', String(updated));
    }
    if (user && updateUser) {
      updateUser({ ...user, credits: updated });
    }
    showToast(`+50 Credits added successfully! Total balance: ${updated} credits.`);

    // 2. Persist to server database
    try {
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('visitexpo_access_token') : null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem('visitexpo_user') : null;
      let effectiveEmail = user?.email;
      if (!effectiveEmail && savedUserStr) {
        try {
          effectiveEmail = JSON.parse(savedUserStr)?.email;
        } catch (_) {}
      }

      const res = await axios.post(
        `${API_URL}/exhibitors/topup`,
        {
          amount: 50,
          email: effectiveEmail,
          currentCredits: userCredits
        },
        { headers }
      );
      if (res.data?.success && res.data.data?.credits !== undefined) {
        const confirmedCredits = res.data.data.credits;
        setUserCredits(confirmedCredits);
        if (typeof window !== 'undefined') {
          localStorage.setItem('visitexpo_organizer_credits', String(confirmedCredits));
        }
        if (user && updateUser) {
          updateUser({ ...user, credits: confirmedCredits });
        }
      }
    } catch (err) {
      console.warn('Backend test credit sync note (local balance preserved):', err);
    }
  };

  // Message Field Validation Calculations
  const validation = useMemo(() => validateInquiryMessage(message), [message]);
  const charCount = message.length;
  const hasContent = message.trim().length > 0;
  const isContentInvalid = hasContent && (validation.code === 'SYMBOL_SPAM' || validation.code === 'REPEATED_CHARS' || validation.code === 'HTML_TAGS' || validation.code === 'REPETITIVE_WORDS' || validation.code === 'FEW_WORDS');
  const isTooShort = validation.code === 'TOO_SHORT';
  const isTooLong = validation.code === 'TOO_LONG';
  const isValidLength = validation.isValid;

  return (
    <div className="space-y-6 pb-20 sm:pb-24">
      
      {/* 1. Header & Live Credits Status Bar */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
            <Link href="/campaigns" className="hover:text-primary transition-colors flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> Marketing &amp; Campaigns
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-bold">Exhibitor Discovery</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Compass className="h-7 w-7 text-primary" />
              <span>Exhibitor Discovery</span>
            </h1>
          </div>

          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Discover verified Indian and global trade exhibitors. Explore product catalogues, request booth demos, and connect directly with manufacturers for <strong>10 credits</strong> per enquiry.
          </p>
        </div>

        {/* Live Organizer Credit Balance Widget */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Organizer Credit Balance
              </div>
              <div className="text-lg font-black text-foreground flex items-center gap-1.5">
                <span>{userCredits}</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Credits Available</span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2">
            <button
              type="button"
              onClick={handleTopUpCredits}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border px-3 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Coins className="h-3.5 w-3.5 text-amber-500" />
              <span>+50 Test Credits</span>
            </button>

            {sentInquiries.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Sent ({sentInquiries.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Quick Navigation Tabs between Campaigns and Exhibitor Discovery */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <Link
          href="/campaigns"
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg transition-colors"
        >
          <Mail className="h-4 w-4" />
          <span>Marketing &amp; Broadcast Campaigns</span>
        </Link>
        <div className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-primary border-b-2 border-primary -mb-1.5">
          <Compass className="h-4 w-4" />
          <span>Exhibitor Discovery</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">Live</span>
        </div>
      </div>

      {/* 3. Filter Section (Requirement 3: Preferred Industry, Search Products, Preferred Country, and Apply Button) */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        
        {/* Origin Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" /> Exhibitor Scope:
            </span>
            <div className="inline-flex p-1 rounded-xl bg-muted/30 border border-border gap-1">
              <button
                type="button"
                onClick={() => setOriginFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  originFilter === 'all'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Scope ({FALLBACK_EXHIBITORS.length})
              </button>
              <button
                type="button"
                onClick={() => setOriginFilter('india')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  originFilter === 'india'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>🇮🇳</span>
                <span>Indian Exhibitors</span>
              </button>
              <button
                type="button"
                onClick={() => setOriginFilter('global')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  originFilter === 'global'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>🌍</span>
                <span>Global Exhibitors</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-semibold">
            <strong className="text-foreground">{filteredExhibitors.length}</strong> matching exhibitors
          </div>
        </div>

        {/* 3 Required Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Filter 1: Preferred Industry */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Building className="h-3.5 w-3.5 text-primary" />
              <span>Preferred Industry</span>
            </label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            >
              {INDUSTRY_OPTIONS.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Search Products */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Search className="h-3.5 w-3.5 text-primary" />
              <span>Search Products</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchProducts}
                onChange={(e) => setSearchProducts(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilters(); }}
                placeholder="e.g. Solar PV, Drones, PLCs, Forklifts..."
                className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* Filter 3: Preferred Country */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-primary" />
              <span>Preferred Country</span>
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons: Apply Button & Reset */}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Apply Filters</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="rounded-xl border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground p-2 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

        </div>

        {/* Active Filters Badges Indicator */}
        {(appliedFilters.industry !== 'All Industries' ||
          appliedFilters.product ||
          appliedFilters.country !== 'All Countries' ||
          appliedFilters.origin !== 'all') && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-[11px]">
            <span className="text-muted-foreground font-semibold">Active filters:</span>
            {appliedFilters.origin !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground font-bold capitalize">
                Scope: {appliedFilters.origin}
              </span>
            )}
            {appliedFilters.industry !== 'All Industries' && (
              <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground font-bold">
                Industry: {appliedFilters.industry}
              </span>
            )}
            {appliedFilters.product && (
              <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground font-bold">
                Product: &quot;{appliedFilters.product}&quot;
              </span>
            )}
            {appliedFilters.country !== 'All Countries' && (
              <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground font-bold">
                Country: {appliedFilters.country}
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-primary hover:underline text-[11px] font-bold cursor-pointer ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* 4. Exhibitors Directory Cards Grid */}
      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-16 text-center shadow-sm space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-xs font-semibold text-muted-foreground">Loading global &amp; Indian exhibitors...</p>
        </div>
      ) : filteredExhibitors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center space-y-3">
          <Building className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <h3 className="text-base font-bold text-foreground">No exhibitors match your filter criteria</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your Preferred Industry, product search query, or selected country to find trade partners.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedExhibitors.map((exhibitor) => {
            const isIndian = exhibitor.origin === 'india';
            return (
              <div
                key={exhibitor._id}
                className="group rounded-2xl border border-border bg-card hover:border-primary/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Card Header & Country Badge */}
                <div className="p-5 space-y-3.5 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <ExhibitorLogo
                        src={exhibitor.logo}
                        name={exhibitor.name}
                        className="h-12 w-12 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-base shrink-0">{exhibitor.countryFlag || (isIndian ? '🇮🇳' : '🌍')}</span>
                          <span className="text-xs font-bold text-muted-foreground truncate">{exhibitor.country}</span>
                          {exhibitor.verified && (
                            <span title="Verified Exhibitor" className="shrink-0">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 break-words">
                          {exhibitor.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span>{exhibitor.rating || '4.9'}</span>
                    </div>
                  </div>

                  {/* Industry Badge */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-foreground">
                      <Building className="h-2.5 w-2.5 text-primary" />
                      <span>{exhibitor.industry}</span>
                    </span>
                  </div>

                  {/* Short Bio */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {exhibitor.description}
                  </p>

                  {/* Products & Solutions Tags */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Featured Products &amp; Lines:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(exhibitor.products) &&
                        exhibitor.products.slice(0, 4).map((prod, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/40 text-foreground border border-border/60"
                          >
                            <Tag className="h-2.5 w-2.5 mr-1 text-primary/70" />
                            {prod}
                          </span>
                        ))}
                      {Array.isArray(exhibitor.products) && exhibitor.products.length > 4 && (
                        <span className="text-[10px] font-bold text-muted-foreground self-center">
                          +{exhibitor.products.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Booth & Key Representative Info */}
                  <div className="pt-2 border-t border-border/50 text-[11px] space-y-1 text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Booth Location:</span>
                      <strong className="text-foreground text-[11px] truncate max-w-[180px]">
                        {exhibitor.boothNumber}
                      </strong>
                    </div>
                    {exhibitor.contactPerson && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Lead Contact:</span>
                        <span className="font-semibold text-foreground text-[11px] truncate max-w-[180px]">
                          {exhibitor.contactPerson}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Details & Connect Action Buttons */}
                <div className="px-5 py-3.5 bg-muted/20 border-t border-border flex items-center justify-between gap-2">
                  <div className="text-[11px] text-muted-foreground">
                    Enquiry: <strong className="text-amber-600 dark:text-amber-400 font-bold">10 Credits</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(exhibitor)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background hover:bg-secondary text-foreground px-3 py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer hover:border-primary/40"
                    >
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      <span>Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenConnect(exhibitor)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer group-hover:scale-[1.02]"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Connect</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredExhibitors.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:pr-20">
          <p className="text-xs font-semibold text-muted-foreground">
            Showing <strong className="text-foreground">{firstExhibitorIndex + 1}-{Math.min(firstExhibitorIndex + EXHIBITORS_PER_PAGE, filteredExhibitors.length)}</strong> of {filteredExhibitors.length} exhibitors
          </p>

          <nav className="flex items-center justify-between gap-1.5 sm:justify-end pr-16 sm:pr-0" aria-label="Exhibitor directory pagination">
            <button
              type="button"
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1" aria-label={`Page ${activePage} of ${totalPages}`}>
              {visiblePages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => handlePageChange(page)}
                  aria-current={page === activePage ? 'page' : undefined}
                  className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition-colors cursor-pointer ${
                    page === activePage
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </nav>
        </div>
      )}

      {/* 5. Connect / Message Popup Modal (Requirement 4: 100-300 characters, 10 credits charged) */}
      {isConnectModalOpen && selectedExhibitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsConnectModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3.5 pr-8">
              <ExhibitorLogo
                src={selectedExhibitor.logo}
                name={selectedExhibitor.name}
                className="h-12 w-12 shrink-0 mt-0.5"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm shrink-0">{selectedExhibitor.countryFlag || '🌍'}</span>
                  <span className="text-xs font-bold text-muted-foreground">{selectedExhibitor.country}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                    Verified Partner
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground leading-snug break-words">
                  Connect with {selectedExhibitor.name}
                </h3>
                <p className="text-[11px] text-muted-foreground break-words line-clamp-1">
                  Representative: {selectedExhibitor.contactPerson || 'Exhibitor Delegate'} ({selectedExhibitor.contactEmail})
                </p>
              </div>
            </div>

            {/* 10 Credits Charge Callout Banner */}
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Coins className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <span className="font-bold block">10 Credits Charge for this Enquiry</span>
                  <span className="text-[11px] text-muted-foreground">
                    Connects you directly with verified executive contacts.
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] text-muted-foreground">Current Balance</div>
                <div className="font-extrabold text-foreground">{userCredits} Credits</div>
              </div>
            </div>

            {/* Popup Form */}
            <form onSubmit={handleSendInquiry} className="space-y-4">
              
              {/* Inquiry Nature */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Enquiry Purpose
                </label>
                <select
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="B2B Trade Partnership">B2B Trade Partnership &amp; OEM Sourcing</option>
                  <option value="Bulk Procurement & RFQ">Bulk Procurement, RFQ &amp; Volume Pricing</option>
                  <option value="Exhibition Stall & Booth Co-Hosting">Exhibition Stall &amp; Booth Co-Hosting</option>
                  <option value="Virtual Product Demo">Request 1-on-1 Virtual Product Demo</option>
                </select>
              </div>

              {/* Message Textarea with Character Validation (100 - 300 characters) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Your Message <span className="text-rose-500">*</span>
                  </label>
                  
                  {/* Live Character Counter & Status Badge */}
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      isContentInvalid || isTooLong
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold'
                        : isTooShort
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : isValidLength
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isContentInvalid ? (
                      <>
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>Invalid Content ({charCount}/300)</span>
                      </>
                    ) : isTooLong ? (
                      <>
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>{charCount} / 300 (Too Long)</span>
                      </>
                    ) : isTooShort ? (
                      <span>{charCount} / 300 characters</span>
                    ) : isValidLength ? (
                      <>
                        <Check className="h-3 w-3 shrink-0" />
                        <span>{charCount} / 300 (Valid)</span>
                      </>
                    ) : (
                      <span>0 / 300 characters</span>
                    )}
                  </span>
                </div>

                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce your organization, explain your procurement interest, product specifications, or proposed event collaboration (minimum 100 characters, maximum 300 characters)..."
                  className={`w-full rounded-xl border p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-all ${
                    isContentInvalid || isTooLong
                      ? 'border-rose-500 focus:ring-rose-500 bg-rose-500/5'
                      : isTooShort
                      ? 'border-amber-500/60 focus:ring-amber-500 bg-amber-500/5'
                      : isValidLength
                      ? 'border-emerald-500/60 focus:ring-emerald-500 bg-emerald-500/5'
                      : 'border-border bg-background focus:ring-primary'
                  }`}
                />

                {/* Character Count & Content Validation Status Message */}
                <div className="text-[11px] flex items-center justify-between gap-2">
                  {!hasContent ? (
                    <span className="text-muted-foreground">
                      * Message must contain 100–300 characters of meaningful business text (no symbols or spam).
                    </span>
                  ) : isContentInvalid || isTooLong || isTooShort ? (
                    <span className={`font-semibold flex items-center gap-1 ${isContentInvalid || isTooLong ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {validation.error}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 shrink-0" />
                      Valid length ({charCount} characters). Ready to dispatch!
                    </span>
                  )}

                  {/* Character progress ratio indicator */}
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                    <div
                      className={`h-full transition-all ${
                        isContentInvalid || isTooLong
                          ? 'bg-rose-500'
                          : isTooShort
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (charCount / 300) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Quick Helper Templates to speed up entry */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground font-semibold">Quick Sample:</span>
                  <button
                    type="button"
                    onClick={() => handleInsertTemplate('rfq')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer transition-colors"
                  >
                    B2B RFQ Template (~170 chars)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTemplate('booth')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer transition-colors"
                  >
                    Exhibition Stall Template (~185 chars)
                  </button>
                </div>
              </div>

              {/* Sender Details Preview */}
              <div className="p-3 bg-muted/20 rounded-xl border border-border text-[11px] text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>Enquiry Sender Profile:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Verified Organizer</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Contact Name:</span>
                  <strong className="text-foreground">{user?.name || 'Verified Event Organizer'}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Email:</span>
                  <strong className="text-foreground font-mono">{user?.email || 'organizer@visitexpo.in'}</strong>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  disabled={sendingInquiry}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sendingInquiry || !isValidLength || userCredits < 10}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingInquiry ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Enquiry (Charge 10 Credits)</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5.5. Exhibitor Full Details Modal */}
      {isDetailsModalOpen && detailsExhibitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header: Logo, Badges, Title */}
            <div className="flex items-start gap-4 pr-8">
              <ExhibitorLogo
                src={detailsExhibitor.logo}
                name={detailsExhibitor.name}
                className="h-16 w-16 shrink-0 mt-0.5"
              />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base shrink-0">{detailsExhibitor.countryFlag || (detailsExhibitor.origin === 'india' ? '🇮🇳' : '🌍')}</span>
                  <span className="text-xs font-bold text-muted-foreground">{detailsExhibitor.country}</span>
                  {detailsExhibitor.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle className="h-3 w-3" /> Verified Exhibitor
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-foreground capitalize shrink-0">
                    <Globe className="h-3 w-3 text-primary" /> {detailsExhibitor.origin || 'Global'} Scope
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full ml-auto shrink-0">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>{detailsExhibitor.rating || '4.9'}</span>
                  </div>
                </div>

                <h2 className="text-lg font-black text-foreground leading-snug break-words">
                  {detailsExhibitor.name}
                </h2>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <Building className="h-3.5 w-3.5" />
                    {detailsExhibitor.industry}
                  </span>
                  {detailsExhibitor.city && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {detailsExhibitor.city}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Expo Event & Booth Location Banner */}
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Associated Exhibition &amp; Stand
                </div>
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{detailsExhibitor.eventTitle || 'VisitExpo Verified Partner'}</span>
                </div>
              </div>

              <div className="sm:text-right shrink-0">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Booth Location
                </div>
                <div className="font-extrabold text-foreground bg-background px-2.5 py-1 rounded-lg border border-border inline-block mt-0.5">
                  {detailsExhibitor.boothNumber || 'Hall Stand Available'}
                </div>
              </div>
            </div>

            {/* Company Full Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                About the Exhibitor
              </h4>
              <p className="text-xs text-foreground/90 leading-relaxed bg-muted/10 p-3.5 rounded-xl border border-border/60">
                {detailsExhibitor.description}
              </p>
            </div>

            {/* Featured Products & Solutions Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Featured Products &amp; Solutions Catalogue ({Array.isArray(detailsExhibitor.products) ? detailsExhibitor.products.length : 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(detailsExhibitor.products) && detailsExhibitor.products.map((prod, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-secondary text-foreground border border-border/80 shadow-xs"
                  >
                    <Tag className="h-3 w-3 mr-1.5 text-primary" />
                    {prod}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Representative & Contact Information */}
            <div className="p-4 bg-muted/20 rounded-xl border border-border space-y-2.5 text-xs">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Executive Representative &amp; Lead Contact
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Lead Representative:</span>
                  <strong className="text-foreground text-xs">{detailsExhibitor.contactPerson || 'Exhibitor Delegate'}</strong>
                  {detailsExhibitor.contactDesignation && (
                    <div className="text-muted-foreground text-[10px]">{detailsExhibitor.contactDesignation}</div>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px]">Official Email:</span>
                  <strong className="text-foreground font-mono">{detailsExhibitor.contactEmail || 'Available on connect'}</strong>
                </div>

                {detailsExhibitor.contactPhone && (
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Direct Phone:</span>
                    <strong className="text-foreground font-mono">{detailsExhibitor.contactPhone}</strong>
                  </div>
                )}

                {detailsExhibitor.virtualBoothUrl && (
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Virtual 3D Booth:</span>
                    <a
                      href={detailsExhibitor.virtualBoothUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <span>Explore Virtual Stand</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground">
                Connect fee: <strong className="text-amber-600 dark:text-amber-400 font-bold">10 Credits</strong> • Your Balance: <strong className="text-foreground">{userCredits} Credits</strong>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    handleOpenConnect(detailsExhibitor);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Connect &amp; Send Enquiry</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. Sent Enquiries History Modal */}
      {showHistoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            className="relative w-full max-w-3xl my-auto rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 6.1. Sticky Modal Header */}
            <div className="p-5 sm:p-6 border-b border-border bg-muted/20 space-y-4 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-xs shrink-0">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-foreground tracking-tight truncate">
                        Sent Exhibitor Enquiries
                      </h3>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        <ShieldCheck className="h-3 w-3" /> Live History
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      Review all direct partnership requests, messages, and credit usage.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-all cursor-pointer shrink-0"
                  title="Close Modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-background/80 border border-border flex items-center gap-2.5 shadow-2xs">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Send className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Enquiries</div>
                    <div className="text-sm font-black text-foreground">{totalSentCount} Sent</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-background/80 border border-border flex items-center gap-2.5 shadow-2xs">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Credits Spent</div>
                    <div className="text-sm font-black text-amber-600 dark:text-amber-400">-{totalCreditsSpent} Credits</div>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-background/80 border border-border flex items-center gap-2.5 shadow-2xs">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Delivery Rate</div>
                    <div className="text-sm font-black text-foreground">100% Delivered</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6.2. Interactive Search & Scope Filter Sub-Bar */}
            {totalSentCount > 0 && (
              <div className="px-5 sm:px-6 py-2.5 border-b border-border bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Filter by exhibitor name, email, or message..."
                    className="w-full rounded-xl border border-border bg-background pl-8.5 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                  />
                  {historySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-xl border border-border text-[11px] self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      historyFilter === 'all'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All ({totalSentCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('india')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                      historyFilter === 'india'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>🇮🇳</span>
                    <span>India ({indianInquiriesCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('global')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                      historyFilter === 'global'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>🌍</span>
                    <span>Global ({globalInquiriesCount})</span>
                  </button>
                </div>
              </div>
            )}

            {/* 6.3. Scrollable Enquiries List */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {totalSentCount === 0 ? (
                <div className="p-12 text-center text-muted-foreground space-y-3.5 border border-dashed border-border rounded-2xl bg-muted/5">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
                    <Clock className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground">No sent enquiries yet</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
                      Discover verified Indian and Global trade exhibitors on the platform and connect directly with their representatives.
                    </p>
                  </div>
                </div>
              ) : filteredSentInquiries.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground space-y-2 border border-dashed border-border rounded-2xl bg-muted/5">
                  <Search className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <h4 className="text-sm font-bold text-foreground">No enquiries match your search</h4>
                  <p className="text-xs text-muted-foreground">
                    Try clearing the keyword search or changing the origin filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setHistorySearchQuery('');
                      setHistoryFilter('all');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer mt-1"
                  >
                    <span>Clear Filter</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSentInquiries.map((inq) => {
                    const logoSrc = getInquiryLogo(inq);
                    return (
                      <div
                        key={inq.id}
                        className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all duration-200 space-y-3.5 shadow-2xs hover:shadow-md"
                      >
                        {/* Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            <ExhibitorLogo
                              src={logoSrc}
                              name={inq.exhibitorName}
                              className="h-12 w-12 rounded-xl shrink-0 mt-0.5 shadow-xs"
                            />

                            <div className="min-w-0 flex-1 space-y-1.5">
                              {/* Metadata Badges */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-sm shrink-0" title={inq.country || 'Global'}>
                                  {inq.countryFlag || '🌍'}
                                </span>
                                {inq.country && (
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                                    {inq.country}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-foreground/85 border border-border/70 max-w-full break-words">
                                  <Building className="h-2.5 w-2.5 text-primary shrink-0" />
                                  <span className="break-words">{inq.industry}</span>
                                </span>
                                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                                  {inq.inquiryType || 'B2B Trade Partnership'}
                                </span>
                              </div>

                              {/* Company Name */}
                              <h4 className="text-base font-bold text-foreground leading-snug break-words group-hover:text-primary transition-colors">
                                {inq.exhibitorName}
                              </h4>

                              {/* Recipient Email */}
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                                <Mail className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                                <span className="text-[11px] truncate">
                                  Recipient: <span className="font-mono text-foreground font-medium">{inq.exhibitorEmail}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Credits Pill & Status */}
                          <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-1.5 shrink-0 pt-0.5">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/25 whitespace-nowrap shadow-2xs">
                              <Coins className="h-3.5 w-3.5 shrink-0" />
                              <span>-10 Credits</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                              <CheckCircle className="h-3 w-3 shrink-0" />
                              <span>Delivered to Exhibitor</span>
                            </span>
                          </div>
                        </div>

                        {/* Inquiry Message Box */}
                        <div className="rounded-xl bg-muted/25 border border-border/70 p-4 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <MessageSquare className="h-3 w-3 text-primary shrink-0" />
                            <span>Your Inquiry Message</span>
                          </div>
                          <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap break-words italic pl-3.5 border-l-2 border-primary/50">
                            &ldquo;{inq.message}&rdquo;
                          </p>
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                          <span className="text-[10px] text-muted-foreground/80 font-mono">
                            Ref ID: {inq.id ? String(inq.id).slice(-10) : 'N/A'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{new Date(inq.sentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 6.4. Sticky Modal Footer */}
            <div className="p-4 sm:px-6 border-t border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Available Balance:</span>
                <span className="inline-flex items-center gap-1 text-xs font-black text-foreground bg-primary/20 px-2.5 py-0.5 rounded-full border border-primary/30">
                  <Coins className="h-3 w-3 text-primary shrink-0" />
                  <span>{userCredits} Credits</span>
                </span>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryModal(false);
                    const el = document.getElementById('exhibitor-search-input');
                    if (el) el.focus();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2 text-xs shadow-md transition-all cursor-pointer"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Discover More Exhibitors</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. Toast Feedback Message */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 py-3 px-4 rounded-xl shadow-2xl border text-xs font-bold animate-in slide-in-from-bottom-4 duration-200 ${
            toastType === 'error'
              ? 'bg-rose-900/90 text-white border-rose-700'
              : 'bg-zinc-900 text-white border-zinc-700'
          }`}
        >
          {toastType === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
