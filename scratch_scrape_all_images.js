const fs = require('fs');
const path = require('path');

async function scrapeAllEventImages() {
  console.log('Fetching claimable events list from WordPress...');
  const wpRes = await fetch('https://visitexpo.in/wp-json/visitexpo/v1/claimable-events', {
    headers: { 'X-VisitExpo-Key': 'visitexpo_custom_secret_key_12345' }
  });
  const data = await wpRes.json();
  const events = data.data?.docs || data.data || [];
  console.log(`Found ${events.length} events to process.`);

  const imageMap = {};

  // Process in chunks of 10 concurrently
  const chunkSize = 10;
  for (let i = 0; i < events.length; i += chunkSize) {
    const chunk = events.slice(i, i + chunkSize);
    console.log(`Processing batch ${i + 1} to ${Math.min(i + chunkSize, events.length)}...`);

    await Promise.all(chunk.map(async (e) => {
      const slug = e.slug;
      if (!slug) return;
      try {
        const res = await fetch(`https://visitexpo.in/event/${slug}/`, {
          headers: { 'User-Agent': 'VisitExpo-ImageBot/1.0' }
        });
        if (res.ok) {
          const text = await res.text();
          const og = text.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                     text.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
          if (og && og[1]) {
            let imgUrl = og[1].replace('http://visitexpo.in', 'https://visitexpo.in');
            imageMap[slug] = imgUrl;
            imageMap[String(e.id)] = imgUrl;
            if (e._id) imageMap[String(e._id)] = imgUrl;
            console.log(`[OK] ${slug} => ${imgUrl}`);
          } else {
            console.warn(`[WARN] No og:image found for ${slug}`);
          }
        } else {
          console.warn(`[WARN] ${slug} returned HTTP ${res.status}`);
        }
      } catch (err) {
        console.error(`[ERR] ${slug}: ${err.message}`);
      }
    }));
  }

  // Ensure output directory exists
  const outDir = path.join(__dirname, 'src', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'wordpress-event-images.json');
  fs.writeFileSync(outPath, JSON.stringify(imageMap, null, 2), 'utf-8');
  console.log(`\nSuccessfully mapped ${Object.keys(imageMap).length} image entries to ${outPath}`);
}

scrapeAllEventImages().catch(console.error);
