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
  Check
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

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
    logo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=150&auto=format&fit=crop&q=80',
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
    logo: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=150&auto=format&fit=crop&q=80',
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
    logo: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=150&auto=format&fit=crop&q=80',
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
    logo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=150&auto=format&fit=crop&q=80',
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
  'South Korea'
];

export default function ExhibitorDiscoveryPage() {
  const { user, accessToken } = useAuth();

  // All exhibitors loaded from API (fallback to curated list)
  const [exhibitors, setExhibitors] = useState(FALLBACK_EXHIBITORS);
  const [loading, setLoading] = useState(true);

  // User credits (default to 100 or user.credits)
  const [userCredits, setUserCredits] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedCredits = localStorage.getItem('visitexpo_organizer_credits');
      if (savedCredits !== null) return parseInt(savedCredits, 10);
    }
    return user?.credits !== undefined ? user.credits : 100;
  });

  // Filter Input States (Pre-applied)
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [searchProducts, setSearchProducts] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All Countries');
  const [originFilter, setOriginFilter] = useState('all'); // 'all' | 'india' | 'global'

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

  // Sync user credits on session load
  useEffect(() => {
    if (user?.credits !== undefined) {
      setUserCredits(user.credits);
      if (typeof window !== 'undefined') {
        localStorage.setItem('visitexpo_organizer_credits', String(user.credits));
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
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.get(`${API_URL}/exhibitors/discovery`, { headers });
      if (res.data && res.data.success && res.data.data?.exhibitors) {
        setExhibitors(res.data.data.exhibitors);
        if (res.data.data.userCredits !== undefined) {
          setUserCredits(res.data.data.userCredits);
          if (typeof window !== 'undefined') {
            localStorage.setItem('visitexpo_organizer_credits', String(res.data.data.userCredits));
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

  // Open Connect Modal
  const handleOpenConnect = (exhibitor) => {
    setSelectedExhibitor(exhibitor);
    setMessage('');
    setInquiryType('B2B Trade Partnership');
    setIsConnectModalOpen(true);
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

    const trimmed = message.trim();
    if (trimmed.length < 100) {
      showToast(`The message must contain a minimum of 100 characters (currently ${trimmed.length}).`, 'error');
      return;
    }
    if (trimmed.length > 300) {
      showToast(`The message cannot exceed 300 characters (currently ${trimmed.length}).`, 'error');
      return;
    }
    if (userCredits < 10) {
      showToast(`Insufficient credits! 10 credits required to connect. Please top up your balance.`, 'error');
      return;
    }

    setSendingInquiry(true);

    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const payload = {
        exhibitorId: selectedExhibitor._id,
        exhibitorName: selectedExhibitor.name,
        exhibitorEmail: selectedExhibitor.contactEmail,
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

      // Record in sent inquiries list
      const newInquiryRecord = {
        id: res.data?.data?.inquiryId || Date.now().toString(),
        exhibitorName: selectedExhibitor.name,
        exhibitorEmail: selectedExhibitor.contactEmail,
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

  // Instant Top-Up for testing / organizer ease
  const handleTopUpCredits = () => {
    const updated = userCredits + 50;
    setUserCredits(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('visitexpo_organizer_credits', String(updated));
    }
    showToast(`+50 Credits added successfully! Total balance: ${updated} credits.`);
  };

  // Character Count Validation Calculations
  const charCount = message.length;
  const isTooShort = charCount > 0 && charCount < 100;
  const isTooLong = charCount > 300;
  const isValidLength = charCount >= 100 && charCount <= 300;

  return (
    <div className="space-y-6">
      
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
            Showing <strong className="text-foreground">{filteredExhibitors.length}</strong> of {exhibitors.length} exhibitors
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
          {filteredExhibitors.map((exhibitor) => {
            const isIndian = exhibitor.origin === 'india';
            return (
              <div
                key={exhibitor._id}
                className="group rounded-2xl border border-border bg-card hover:border-primary/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Card Header & Country Badge */}
                <div className="p-5 space-y-3.5 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={exhibitor.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80'}
                        alt={exhibitor.name}
                        className="h-12 w-12 rounded-xl object-cover border border-border shadow-xs shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{exhibitor.countryFlag || (isIndian ? '🇮🇳' : '🌍')}</span>
                          <span className="text-xs font-bold text-muted-foreground">{exhibitor.country}</span>
                          {exhibitor.verified && (
                            <span title="Verified Exhibitor">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
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

                {/* Card Footer: Connect Action Button */}
                <div className="px-5 py-3.5 bg-muted/20 border-t border-border flex items-center justify-between gap-3">
                  <div className="text-[11px] text-muted-foreground">
                    Enquiry Fee: <strong className="text-amber-600 dark:text-amber-400 font-bold">10 Credits</strong>
                  </div>

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
            );
          })}
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
            <div className="flex items-start gap-3">
              <img
                src={selectedExhibitor.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80'}
                alt={selectedExhibitor.name}
                className="h-12 w-12 rounded-xl object-cover border border-border shrink-0"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{selectedExhibitor.countryFlag || '🌍'}</span>
                  <span className="text-xs font-bold text-muted-foreground">{selectedExhibitor.country}</span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-primary/10 text-primary">
                    Verified Partner
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Connect with {selectedExhibitor.name}
                </h3>
                <p className="text-[11px] text-muted-foreground">
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
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      isTooLong
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold'
                        : isTooShort
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : isValidLength
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {charCount} / 300 characters
                  </span>
                </div>

                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce your organization, explain your procurement interest, product specifications, or proposed event collaboration (minimum 100 characters, maximum 300 characters)..."
                  className={`w-full rounded-xl border p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-all ${
                    isTooLong
                      ? 'border-rose-500 focus:ring-rose-500 bg-rose-500/5'
                      : isTooShort
                      ? 'border-amber-500/60 focus:ring-amber-500 bg-amber-500/5'
                      : isValidLength
                      ? 'border-emerald-500/60 focus:ring-emerald-500 bg-emerald-500/5'
                      : 'border-border bg-background focus:ring-primary'
                  }`}
                />

                {/* Character Count Helper Status Message */}
                <div className="text-[11px] flex items-center justify-between gap-2">
                  {charCount === 0 ? (
                    <span className="text-muted-foreground">
                      * Message must contain a minimum of 100 characters and a maximum of 300 characters.
                    </span>
                  ) : isTooShort ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Add at least {100 - charCount} more character{100 - charCount === 1 ? '' : 's'} to reach 100.
                    </span>
                  ) : isTooLong ? (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Exceeds 300-character maximum limit by {charCount - 300} characters.
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
                        isTooLong
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

      {/* 6. Sent Enquiries History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Sent Exhibitor Enquiries</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Review messages you have sent to trade exhibitors.
            </p>

            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
              {sentInquiries.map((inq) => (
                <div key={inq.id} className="p-4 space-y-2 bg-card hover:bg-muted/10 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{inq.countryFlag || '🌍'}</span>
                      <strong className="text-sm font-bold text-foreground">{inq.exhibitorName}</strong>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-foreground">
                        {inq.industry}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      -10 Credits
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/60">
                    &quot;{inq.message}&quot;
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                    <span>Recipient: {inq.exhibitorEmail}</span>
                    <span>{new Date(inq.sentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>
              ))}
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
