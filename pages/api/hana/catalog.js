import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { publicPosts, normalizeTools } from '@/themes/hana/data'
import CONFIG from '@/themes/hana/config'
export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow','GET'); return res.status(405).end() }
  try {
    const locale = typeof req.query.locale === 'string' && /^[a-zA-Z0-9-]{1,16}$/.test(req.query.locale) ? req.query.locale : undefined
    const data = await fetchGlobalAllData({ from:'hana-catalog', locale })
    const category = data?.NOTION_CONFIG?.HANA_TOOL_NOTION_CATEGORY || CONFIG.HANA_TOOL_NOTION_CATEGORY
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    return res.status(200).json({ posts:publicPosts(data), tools:normalizeTools(data,category) })
  } catch (error) {
    console.error('[hana] catalog unavailable', error?.message)
    res.setHeader('Cache-Control','no-store')
    return res.status(503).json({ error:'暂时无法读取归档数据' })
  }
}
