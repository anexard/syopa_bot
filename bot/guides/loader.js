const fs = require('fs');
const path = require('path');

const GUIDES_ROOT = path.join(__dirname); // bot/guides

function parseFrontMatter(md) {
  // очень простой парсер: блок между --- ... ---
  // title: ...
  // tags: [a, b]
  const out = { title: null, tags: [] , body: md };

  if (!md.startsWith('---')) return out;

  const end = md.indexOf('\n---', 3);
  if (end === -1) return out;

  const fmRaw = md.slice(3, end).trim();
  const body = md.slice(end + 4).trim(); // после "\n---"
  out.body = body;

  for (const line of fmRaw.split('\n')) {
    const [k, ...rest] = line.split(':');
    if (!k || rest.length === 0) continue;
    const key = k.trim();
    const value = rest.join(':').trim();

    if (key === 'title') out.title = value.replace(/^"|"$/g, '');
    if (key === 'tags') {
      // tags: [a, b, c]
      const m = value.match(/^\[(.*)\]$/);
      if (m) {
        out.tags = m[1]
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .map(s => s.replace(/^"|"$/g, ''));
      }
    }
  }
  return out;
}

function buildCatalog() {
  const items = [];

  const categories = fs.readdirSync(GUIDES_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const category of categories) {
    const catDir = path.join(GUIDES_ROOT, category);
    const files = fs.readdirSync(catDir, { withFileTypes: true })
      .filter(f => f.isFile() && f.name.endsWith('.md'))
      .map(f => f.name);

    for (const file of files) {
      const fullPath = path.join(catDir, file);
      const md = fs.readFileSync(fullPath, 'utf8');
      const { title, tags } = parseFrontMatter(md);

      const slug = file.replace(/\.md$/, '');
      const id = `${category}/${slug}`; // стабильный id

      items.push({
        id,
        category,
        slug,
        title: title || slug,
        tags: tags || [],
        filepath: fullPath,
      });
    }
  }

  // сортировка по категории/названию
  items.sort((a, b) =>
    a.category.localeCompare(b.category) || a.title.localeCompare(b.title)
  );

  return items;
}

module.exports = { buildCatalog, parseFrontMatter, GUIDES_ROOT };
