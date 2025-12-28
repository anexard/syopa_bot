function esc(s='') {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderMdToHtml(mdBody) {
  const lines = mdBody.split('\n');
  const out = [];

  for (let raw of lines) {
    const line = raw.trimEnd();
    const t = line.trim();

    if (!t) { out.push(''); continue; }

    if (t.startsWith('## ')) {
      out.push(`<b>${esc(t.slice(3).trim())}</b>`);
      continue;
    }

    if (t.startsWith('### ')) {
      out.push(`\n<b>${esc(t.slice(4).trim())}</b>`);
      continue;
    }

    if (t.startsWith('!')) {
      out.push(`🚫 <b>${esc(t.slice(1).trim())}</b>`);
      continue;
    }

    if (t.startsWith('>')) {
      out.push(`<i>${esc(t.slice(1).trim())}</i>`);
      continue;
    }

    if (t.startsWith('- ')) {
      out.push(`• ${esc(t.slice(2).trim())}`);
      continue;
    }

    out.push(esc(t));
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

module.exports = { renderMdToHtml };
