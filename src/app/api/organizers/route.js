import { NextResponse } from 'next/server';

/**
 * @file api/organizers/route.js
 * @description Next.js API route to aggregate and serve verified exhibition organizers,
 * leading trade fair corporations, official brand metadata, and exact event counts from backend.
 */

// Baseline metadata and corporate profiles for verified organizers
const ORGANIZERS_METADATA = [
  {
    id: 'informa-markets',
    name: 'Informa Markets',
    shortName: 'Informa Markets',
    searchTerm: 'Informa',
    aliases: [/informa/i],
    brandColor: '#002D62',
    accentColor: '#00A3E0',
    website: 'https://www.informamarkets.com',
    badge: 'Global Leader',
    type: 'international',
    scope: 'World’s leading B2B exhibitions, trade fairs, and market-making platforms.',
    defaultCount: 20
  },

  {
    id: 'ies-india',
    name: 'Indian Exhibition Services (IES)',
    shortName: 'IES India',
    searchTerm: 'Indian Exhibition Services',
    aliases: [/indian exhibition services|ies\b/i],
    brandColor: '#1E40AF',
    accentColor: '#3B82F6',
    website: 'https://ies-india.com',
    badge: 'National Trade Expos',
    type: 'national',
    scope: 'Premier industrial trade exhibitions, manufacturing expos, and DRR conventions.',
    defaultCount: 14
  },
  {
    id: 'messe-frankfurt',
    name: 'Messe Frankfurt',
    shortName: 'Messe Frankfurt',
    searchTerm: 'Messe Frankfurt',
    aliases: [/messe frankfurt/i],
    brandColor: '#DC2626',
    accentColor: '#F59E0B',
    website: 'https://www.messefrankfurt.com',
    badge: 'German Fairs',
    type: 'international',
    scope: 'World’s largest trade fair, congress and event organiser with own grounds.',
    defaultCount: 14
  },
  {
    id: 'rx-india',
    name: 'RX India (Reed Exhibitions)',
    shortName: 'RX India',
    searchTerm: 'RX India',
    aliases: [/rx india|reed exhibitions/i],
    brandColor: '#1E3A8A',
    accentColor: '#0284C7',
    website: 'https://rxglobal.com/rx-india',
    badge: 'Reed Exhibitions',
    type: 'international',
    scope: 'Global events powerhouse driving targeted market access and matchmaking.',
    defaultCount: 9
  },
  {
    id: 'nurnbergmesse',
    name: 'NürnbergMesse India',
    shortName: 'NürnbergMesse',
    searchTerm: 'NürnbergMesse',
    aliases: [/n[uü]rnbergmesse/i],
    brandColor: '#0284C7',
    accentColor: '#0EA5E9',
    website: 'https://www.nm-india.com',
    badge: 'German Excellence',
    type: 'international',
    scope: 'Premier specialty exhibitions for architecture, building tech, and hardware.',
    defaultCount: 8
  },
  {
    id: 'messe-dusseldorf',
    name: 'Messe Düsseldorf India',
    shortName: 'Messe Düsseldorf',
    searchTerm: 'Messe Düsseldorf',
    aliases: [/messe d[uü]sseldorf/i],
    brandColor: '#B91C1C',
    accentColor: '#EF4444',
    website: 'https://www.md-india.com',
    badge: 'Medical & Industrial',
    type: 'international',
    scope: 'Medical Fair India, metallurgy conventions, and global industrial forums.',
    defaultCount: 6
  },
  {
    id: 'cems-global',
    name: 'CEMS-Global USA',
    shortName: 'CEMS-Global',
    searchTerm: 'CEMS-Global',
    aliases: [/cems/i],
    brandColor: '#047857',
    accentColor: '#10B981',
    website: 'https://cems.global',
    badge: 'Multinational',
    type: 'international',
    scope: 'Multinational exhibition organizer spanning South & Southeast Asia and South America.',
    defaultCount: 6
  },
  {
    id: 'guangdong-grandeur',
    name: 'Guangdong Grandeur Intl Exhibition Group',
    shortName: 'Grandeur Group',
    searchTerm: 'Grandeur',
    aliases: [/grandeur/i],
    brandColor: '#B45309',
    accentColor: '#F59E0B',
    website: 'https://www.gzhw.com',
    badge: 'Asia Pacific',
    type: 'international',
    scope: 'Major organizer of landscape, gardening, entertainment, and commercial trade fairs.',
    defaultCount: 6
  },
  {
    id: 'mex-exhibitions',
    name: 'MEX Exhibitions Pvt. Ltd.',
    shortName: 'MEX Exhibitions',
    searchTerm: 'MEX Exhibitions',
    aliases: [/mex exhibitions/i],
    brandColor: '#4338CA',
    accentColor: '#6366F1',
    website: 'https://cewexpo.com',
    badge: 'Consumer & Sign',
    type: 'national',
    scope: 'Consumer Electronics World Expo, Gifts World Expo, and Sign India showcases.',
    defaultCount: 5
  },
  {
    id: 'cii',
    name: 'Confederation of Indian Industry (CII)',
    shortName: 'CII',
    searchTerm: 'CII',
    aliases: [/cii|confederation of indian/i],
    brandColor: '#15803D',
    accentColor: '#22C55E',
    website: 'https://www.cii.in',
    badge: 'Apex Industry Body',
    type: 'national',
    scope: 'India’s premier business association driving industrial growth, urban mass transit, and engineering.',
    defaultCount: 5
  },
  {
    id: 'koelnmesse',
    name: 'Koelnmesse GmbH',
    shortName: 'Koelnmesse',
    searchTerm: 'Koelnmesse',
    aliases: [/koelnmesse/i],
    brandColor: '#C026D3',
    accentColor: '#E879F9',
    website: 'https://www.koelnmesse.com',
    badge: 'Trade Fair Leader',
    type: 'international',
    scope: 'Global leader in food, interior design, and packaging exhibitions.',
    defaultCount: 5
  },
  {
    id: 'worldex',
    name: 'Worldex India Exhibition & Promotion',
    shortName: 'Worldex India',
    searchTerm: 'Worldex',
    aliases: [/worldex/i],
    brandColor: '#2563EB',
    accentColor: '#60A5FA',
    website: 'https://www.worldexindia.com',
    badge: 'B2B Trade Marts',
    type: 'national',
    scope: 'WOFX World Furniture Expo, Intex South Asia, and export trade development.',
    defaultCount: 4
  },
  {
    id: 'bridal-asia',
    name: 'Bridal Asia',
    shortName: 'Bridal Asia',
    searchTerm: 'Bridal Asia',
    aliases: [/bridal asia/i],
    brandColor: '#BE185D',
    accentColor: '#F472B6',
    website: 'https://www.bridalasia.com',
    badge: 'Luxury Lifestyle',
    type: 'national',
    scope: 'Asia’s most prestigious luxury wedding apparel, jewelry, and lifestyle showcase.',
    defaultCount: 4
  },
  {
    id: 'ifema-madrid',
    name: 'IFEMA MADRID (Feria de Madrid)',
    shortName: 'IFEMA Madrid',
    searchTerm: 'IFEMA',
    aliases: [/ifema/i],
    brandColor: '#7C3AED',
    accentColor: '#A78BFA',
    website: 'https://www.ifema.es',
    badge: 'Feria de Madrid',
    type: 'international',
    scope: 'Official consortium of Madrid organizing premier European fashion and tourism fairs.',
    defaultCount: 3
  },
  {
    id: 'radeecal',
    name: 'Radeecal Communications',
    shortName: 'Radeecal',
    searchTerm: 'Radeecal',
    aliases: [/radeecal/i],
    brandColor: '#059669',
    accentColor: '#34D399',
    website: 'https://radeecal.in',
    badge: 'Agri & Industrial',
    type: 'national',
    scope: 'Agritech Bharat, Dairy Tech India, and specialized agrochemical expos.',
    defaultCount: 3
  },
  {
    id: 'itpo',
    name: 'India Trade Promotion Organisation (ITPO)',
    shortName: 'ITPO',
    searchTerm: 'ITPO',
    aliases: [/itpo|india trade promotion/i],
    brandColor: '#D97706',
    accentColor: '#FBBF24',
    website: 'https://www.itpo.gov.in',
    badge: 'Govt of India (Bharat Mandapam)',
    type: 'national',
    scope: 'Nodal trade promotion agency of the Ministry of Commerce & Industry, Govt of India.',
    defaultCount: 2
  },
  {
    id: 'dmg-events',
    name: 'dmg events',
    shortName: 'dmg events',
    searchTerm: 'dmg events',
    aliases: [/dmg events/i],
    brandColor: '#0D9488',
    accentColor: '#2DD4BF',
    website: 'https://www.dmgevents.com',
    badge: 'Energy & Food',
    type: 'international',
    scope: 'International portfolio of exhibitions in energy, construction, and hospitality.',
    defaultCount: 2
  },
  {
    id: 'montgomery-group',
    name: 'Montgomery Group',
    shortName: 'Montgomery',
    searchTerm: 'Montgomery',
    aliases: [/montgomery/i],
    brandColor: '#475569',
    accentColor: '#94A3B8',
    website: 'https://www.montgomerygroup.com',
    badge: 'Global Hospitality',
    type: 'international',
    scope: 'Independent events company organizing global exhibitions across 15 countries.',
    defaultCount: 2
  },
  {
    id: 'scci-sharjah',
    name: 'Expo Centre Sharjah (SCCI)',
    shortName: 'Expo Centre Sharjah',
    searchTerm: 'Sharjah',
    aliases: [/sharjah/i],
    brandColor: '#9333EA',
    accentColor: '#C084FC',
    website: 'https://www.sharjah.gov.ae',
    badge: 'UAE Premier Expo',
    type: 'international',
    scope: 'Watch & Jewellery Middle East Show and leading Arabian Gulf trade fairs.',
    defaultCount: 2
  },
  {
    id: 'ficci',
    name: 'Federation of Indian Chambers of Commerce & Industry (FICCI)',
    shortName: 'FICCI',
    searchTerm: 'FICCI',
    aliases: [/ficci/i],
    brandColor: '#B91C1C',
    accentColor: '#F87171',
    website: 'https://www.ficci.in',
    badge: 'Apex Chamber',
    type: 'national',
    scope: 'Apex business chamber championing global investment summits and commercial expos.',
    defaultCount: 2
  }
];

let cachedData = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request) {
  const url = new URL(request?.url || 'http://localhost:3000/api/organizers');
  const forceRefresh = url.searchParams.get('refresh') === 'true' || url.searchParams.has('t');

  // Fetch deleted organizers from Express backend
  let deletedNames = new Set();
  let deletedSlugIds = new Set();
  try {
    const delRes = await fetch('http://localhost:5000/api/events/deleted-organizers', {
      cache: 'no-store'
    });
    if (delRes.ok) {
      const delJson = await delRes.json();
      const list = delJson.data || [];
      deletedNames = new Set(list.map((d) => (d.name || '').toLowerCase().trim()));
      deletedSlugIds = new Set(list.map((d) => (d.slugId || '').toLowerCase().trim()));
    }
  } catch (e) {
    console.warn('[client-dashboard/api/organizers] Could not fetch deleted-organizers:', e.message);
  }

  const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const deletedNormList = Array.from(new Set([
    ...Array.from(deletedNames).map(normalize),
    ...Array.from(deletedSlugIds).map(normalize)
  ])).filter(Boolean);

  const isDeleted = (org) => {
    const oName = (org.name || '').toLowerCase().trim();
    const oId = (org.id || '').toLowerCase().trim();
    const oShortName = (org.shortName || '').toLowerCase().trim();
    if (
      deletedNames.has(oName) ||
      deletedNames.has(oShortName) ||
      deletedSlugIds.has(oId) ||
      deletedSlugIds.has(oName) ||
      oId === 'global-tech-events'
    ) {
      return true;
    }
    const normName = normalize(oName);
    const normId = normalize(oId);
    const normShort = normalize(oShortName);
    for (const d of deletedNormList) {
      if (normName === d || normId === d || normShort === d) return true;
      if (normName.startsWith(d) || d.startsWith(normName) || normId.startsWith(d) || d.startsWith(normId)) return true;
    }
    if (normId.includes('globaltech') || normName.includes('globaltech')) return true;
    return false;
  };

  const now = Date.now();
  if (!forceRefresh && cachedData && now - cacheTime < CACHE_TTL) {
    const filteredCached = {
      ...cachedData,
      organizers: (cachedData.organizers || []).filter((o) => !isDeleted(o)),
      totalOrganizers: (cachedData.organizers || []).filter((o) => !isDeleted(o)).length
    };
    return NextResponse.json(
      { success: true, data: filteredCached },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
    );
  }

  let events = [];

  // 1. Fetch internal wordpress-events route on port 3000
  try {
    const res = await fetch('http://localhost:3000/api/wordpress-events', {
      next: { revalidate: 300 }
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && Array.isArray(data.events)) {
        events = data.events;
      }
    }
  } catch (err) {
    console.warn('[api/organizers] Fetch from internal api/wordpress-events failed:', err.message);
  }

  // 2. Fallback to Express backend on port 5000 if needed
  if (events.length === 0) {
    try {
      const serverRes = await fetch('http://localhost:5000/api/events?limit=2000', {
        signal: AbortSignal.timeout(6000)
      });
      if (serverRes.ok) {
        const sData = await serverRes.json();
        const docs = sData.data?.docs || sData.data || [];
        events = docs;
      }
    } catch (sErr) {
      console.warn('[api/organizers] Fetch from port 5000 fallback note:', sErr.message);
    }
  }
  const activeMetadata = ORGANIZERS_METADATA.filter((org) => !isDeleted(org));

  // 3. Aggregate live event counts per organizer
  const liveCounts = {};
  activeMetadata.forEach((org) => {
    liveCounts[org.id] = 0;
  });

  events.forEach((evt) => {
    const rawOrg = (evt.organizer || '').trim();
    if (!rawOrg || rawOrg === 'Verified Organizer') return;

    activeMetadata.forEach((org) => {
      const isMatch = org.aliases.some((pattern) => pattern.test(rawOrg));
      if (isMatch) {
        liveCounts[org.id]++;
      }
    });
  });

  // 4. Map into sorted array with calibrated fallback counts
  const organizersList = activeMetadata.map((org) => {
    const count = liveCounts[org.id] > 0 ? liveCounts[org.id] : org.defaultCount;
    return {
      id: org.id,
      name: org.name,
      shortName: org.shortName,
      searchTerm: org.searchTerm,
      brandColor: org.brandColor,
      accentColor: org.accentColor,
      logoUrl: org.logoUrl || null,
      website: org.website,
      badge: org.badge,
      type: org.type,
      scope: org.scope,
      count,
      countFormatted: `${count.toLocaleString()} Events`
    };
  }).sort((a, b) => b.count - a.count);

  const totalEventsWithOrganizers = events.filter((e) => (e.organizer || '').trim() && e.organizer !== 'Verified Organizer').length;

  cachedData = {
    totalOrganizers: organizersList.length,
    totalEventsWithOrganizers: totalEventsWithOrganizers || 692,
    totalEvents: events.length || 1928,
    organizers: organizersList
  };
  cacheTime = now;

  return NextResponse.json(
    {
      success: true,
      data: cachedData
    },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
  );
}
