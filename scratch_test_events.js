async function testOtherEvents() {
  const slugs = [
    'the-saudi-food-show-2026',
    'aluminium-bharat-2026',
    'innotrans-2026',
    'marmomac',
    'iftm'
  ];

  for (const s of slugs) {
    try {
      const res = await fetch(`https://visitexpo.in/event/${s}/`);
      if (res.ok) {
        const text = await res.text();
        const og = text.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                   text.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
        console.log(s, '-> OG IMAGE:', og ? og[1] : 'NOT FOUND');
      } else {
        console.log(s, 'Status:', res.status);
      }
    } catch (e) {
      console.log(s, 'Error:', e.message);
    }
  }
}

testOtherEvents();
