import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { publicPosts, normalizeTools } from '@/themes/hana/data'
import CONFIG from '@/themes/hana/config'
import { LayoutHanaBlog } from '@/themes/hana'
export default function Page(props) { return <LayoutHanaBlog {...props} /> }
export async function getStaticProps({ locale }) {
  const props = await fetchGlobalAllData({ from:'hana-blog', locale })
  props.hanaPosts = publicPosts(props)
  props.hanaTools = normalizeTools(props,props?.NOTION_CONFIG?.HANA_TOOL_NOTION_CATEGORY || CONFIG.HANA_TOOL_NOTION_CATEGORY)
  delete props.allPages
  return {props, ...(process.env.EXPORT ? {} : {revalidate:siteConfig('NEXT_REVALIDATE_SECOND', BLOG.NEXT_REVALIDATE_SECOND, props.NOTION_CONFIG)})}
}
