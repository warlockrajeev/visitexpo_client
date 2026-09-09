async function test() {
  const urls = [
    'https://visitexpo.in/?p=21245',
    'https://visitexpo.in/?attachment_id=21245',
    'https://visitexpo.in/event/iftm/'
  ];
  for (const u of urls) {
    const res = await fetch(u, { redirect: 'manual' });
    console.log(u, 'Status:', res.status, 'Location:', res.headers.get('location'));
    if (res.status === 200) {
      const text = await res.text();
      const og = text.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                 text.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      console.log('og:', og ? og[1] : null);
    }
  }
}
test();
