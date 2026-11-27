export const array = value => Array.isArray(value) ? value : value == null ? [] : [value]
export const label = value => typeof value === 'string' ? value : typeof value?.name === 'string' ? value.name : ''
export const categoriesOf = p => array(p?.category).map(label).filter(Boolean)
export const tagsOf = p => array(p?.tagItems?.length ? p.tagItems : p?.tags).map(label).filter(Boolean)
export function safeLink(value, internal = true) {
  if (typeof value !== 'string') return ''
  const s = value.trim()
  if (!s || /[\u0000-\u001f\u007f\\]/.test(s)) return ''
  if (internal && /^\/(?!\/)/.test(s)) return s
  try { const u = new URL(s); return ['http:', 'https:'].includes(u.protocol) ? u.href : '' } catch { return '' }
}
export function postHref(p) {
  const href = safeLink(p?.href)
  if (href) return href
  return p?.slug ? '/' + String(p.slug).split('/').map(encodeURIComponent).join('/') : '/'
}
export function postDay(p) {
  const raw = p?.publishDay || p?.date?.start_date || p?.publishDate
  if (typeof raw === 'string') {
    const m = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
    if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`
  }
  if (raw == null || raw === '') return ''
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0,10)
}
export function publicPosts(data) {
  return array(data?.allPages).filter(p => p?.type === 'Post' && p.status === 'Published').map(p => ({
    id: String(p.id || p.slug || p.href || ''),
    title: String(p.title || '未命名文章'),
    href: postHref(p), publishDay: postDay(p), category: categoriesOf(p), tags: tagsOf(p),
    summary: p.password ? '' : String(p.summary || '').slice(0, 350),
    pageCoverThumbnail: p.password ? '' : safeLink(p.pageCoverThumbnail || p.pageCover),
    password: p.password ? 'protected' : ''
  })).filter(p => p.id && p.href !== '/').sort((a,b)=>b.publishDay.localeCompare(a.publishDay))
}
export function normalizeTools(data, cat='工具') {
  return array(data?.allPages).filter(p => ['Page','Post','Link'].includes(p?.type) && p.status === 'Published' && !p.password && (categoriesOf(p).includes(cat) || tagsOf(p).includes(cat))).map(p=>({
    name:String(p.title || ''), url:[p.link,p.url,p.href,p.slug].map(x=>safeLink(x,false)).find(Boolean)||'', category:categoriesOf(p).find(c=>c!==cat)||'Notion 收藏', description:String(p.summary||'').slice(0,160)
  })).filter(t=>t.name && t.url)
}
export function mergeTools(...lists) {
  const result = new Map()
  for (const t of lists.flat()) {
    const url=safeLink(t?.url,false)
    if(url && t?.name) result.set(url,{...t,url})
  }
  return [...result.values()]
}
export function groupCategories(posts, options) {
  if (Array.isArray(options) && options.length) return options.map(c=>({name:label(c),count:Number(c.count)||0})).filter(c=>c.name)
  const counts={}
  for (const p of posts) for (const c of categoriesOf(p)) counts[c]=(counts[c]||0)+1
  return Object.entries(counts).map(([name,count])=>({name,count}))
}
