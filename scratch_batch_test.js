const fs = require('fs');

async function testBatch() {
  const wpRes = await fetch('https://visitexpo.in/wp-json/visitexpo/v1/claimable-events', {
    headers: { 'X-VisitExpo-Key': 'visitexpo_custom_secret_key_12345' }
  });
  const data = await wpRes.json();
  const events = data.data?.docs || data.data || [];
  console.log(`Found ${events.length} events.`);

  const sample = events.slice(0, 15);
  for (const e of sample) {
    const slug = e.slug;
    try {
      const res = await fetch(`https://visitexpo.in/event/${slug}/`, { headers: { 'User-Agent': 'VisitExpo-Bot/1.0' } });
      if (res.ok) {
        const text = await res.text();
        const og = text.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                   text.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
        console.log(`${slug} (${e.title}) => ${og ? og[1] : 'NONE'}`);
      } else {
        console.log(`${slug} => Status ${res.status}`);
      }
    } catch (err) {
      console.log(`${slug} => Error: ${err.message}`);
    }
  }
}

testBatch();
