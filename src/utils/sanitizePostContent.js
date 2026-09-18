export function sanitizePostContent(html = '') {
  if (typeof html !== 'string') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const tags = new Set(['P', 'BR', 'H1', 'H2', 'H3', 'STRONG', 'EM', 'U', 'S', 'OL', 'UL', 'LI', 'BLOCKQUOTE', 'A', 'IMG']);
  doc.body.querySelectorAll('*').forEach(node => {
    if (!tags.has(node.tagName)) return node.replaceWith(...node.childNodes);
    const src = node.getAttribute('src'); const href = node.getAttribute('href'); const alt = node.getAttribute('alt'); const width = node.style.width; const marginLeft = node.style.marginLeft; const marginRight = node.style.marginRight;
    [...node.attributes].forEach(attr => node.removeAttribute(attr.name));
    if (node.tagName === 'IMG') {
      if (!/^https:\/\/(res\.cloudinary\.com|storage\.inskru\.com)\//.test(src || '')) node.remove();
      else { node.src = src; node.alt = alt || ''; if (/^(?:1[5-9]|[2-9]\d|100)%$|^[1-9]\d{0,3}px$/.test(width)) node.style.width = width; if (['auto', '0px'].includes(marginLeft)) node.style.marginLeft = marginLeft; if (['auto', '0px'].includes(marginRight)) node.style.marginRight = marginRight; node.loading = 'lazy'; node.className = 'max-w-full h-auto rounded-lg'; }
    }
    if (node.tagName === 'A' && /^https?:\/\//.test(href || '')) { node.href = href; node.target = '_blank'; node.rel = 'noopener noreferrer'; }
  });
  return doc.body.innerHTML;
}
