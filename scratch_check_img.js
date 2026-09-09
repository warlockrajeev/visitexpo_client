async function checkImgTag() {
  const res = await fetch('https://visitexpo.in/event/iftm/');
  const html = await res.text();
  
  // Find img tags and their parent containers
  const matches = [...html.matchAll(/(<div[^>]*class="[^"]*(?:image|featured|banner|media|thumb|poster|ovaem)[^"]*"[^>]*>[\s\S]{0,300}?<img[^>]+>)/gi)];
  console.log('Class matches found:', matches.length);
  for (const m of matches.slice(0, 5)) {
    console.log('Match:', m[1].replace(/\s+/g, ' '));
  }

  // Also check og:image
  const og = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
             html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  console.log('OG IMAGE:', og ? og[1] : 'none');
}

checkImgTag();
