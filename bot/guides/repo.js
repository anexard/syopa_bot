const fs = require('fs');
const { buildCatalog, parseFrontMatter } = require('./loader');

let CATALOG = buildCatalog(); // можно обновлять по команде /guide_reload

function reloadCatalog() {
  CATALOG = buildCatalog();
  return CATALOG;
}

function listCategories() {
  return [...new Set(CATALOG.map(x => x.category))];
}

function listByCategory(category) {
  return CATALOG.filter(x => x.category === category);
}

function getById(id) {
  return CATALOG.find(x => x.id === id);
}

function readGuideBody(id) {
  const meta = getById(id);
  if (!meta) return null;

  const md = fs.readFileSync(meta.filepath, 'utf8');
  const parsed = parseFrontMatter(md);

  return {
    ...meta,
    body: parsed.body,
    title: parsed.title || meta.title,
    tags: parsed.tags || meta.tags,
  };
}

module.exports = {
  reloadCatalog,
  listCategories,
  listByCategory,
  getById,
  readGuideBody,
};
