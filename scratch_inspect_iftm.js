async function inspectIftm() {
  try {
    const res = await fetch('https://visitexpo.in/wp-json/visitexpo/v1/inspect-event-meta');
    const json = await res.json();
    const docs = json.data?.docs || [];
    const iftm = docs.find(d => (d.title && d.title.toLowerCase().includes('iftm')) || (d.slug && d.slug.includes('iftm')) || d.id == 21244);
    if (!iftm) {
      console.log('IFTM not found in inspect-event-meta. Sample docs:', docs.slice(0, 3).map(d => ({ id: d.id, title: d.title, slug: d.slug })));
      return;
    }
    console.log('IFTM found! ID:', iftm.id, 'Title:', iftm.title, 'Slug:', iftm.slug);
    console.log('Meta keys:', Object.keys(iftm.meta));
    console.log('_thumbnail_id:', iftm.meta._thumbnail_id);
    console.log('banner:', iftm.meta.banner || iftm.meta.ovaem_banner || iftm.meta.image);
    for (const [k, v] of Object.entries(iftm.meta)) {
      if (k.toLowerCase().includes('thumb') || k.toLowerCase().includes('image') || k.toLowerCase().includes('img') || k.toLowerCase().includes('banner') || k.toLowerCase().includes('logo') || k.toLowerCase().includes('photo')) {
        console.log(`Key ${k}:`, v);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
inspectIftm();
