'use client'
import React,{createContext,useContext,useEffect,useRef,useState,useMemo,useCallback} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import NotionPage from '@/components/NotionPage'
import ShareBar from '@/components/ShareBar'
import Comment from '@/components/Comment'
import CONFIG from './config'
import { Style } from './style'
import { symbols,brandFlower,heroArt,coverArt,hanaEmblem } from './art'
import { array,categoriesOf,tagsOf,postHref,postDay,publicPosts,mergeTools,safeLink,groupCategories } from './data'
import seedTools from './tools.json'
import { useAppearance,Background,AppearanceForm } from './components/Appearance'
import Assistant from './components/Assistant'

const H=createContext(null)
const useHana=()=>useContext(H)
const cfg=(k)=>siteConfig(k,CONFIG[k],CONFIG)
const yes=k=>![false,'false',0,'0'].includes(cfg(k))
const NAV=[['/','首页','home'],['/blog','博客','blog'],['/category','分类','grid'],['/archive','归档','calendar'],['/tools','工具','tools']]
const Icon=({name,small=false})=><svg className={`icon${small?' icon-sm':''}`} aria-hidden="true"><use href={`#i-${name}`}/></svg>
const Art=({html,className})=><div className={className} dangerouslySetInnerHTML={{__html:html}}/>
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
const pad=n=>String(n).padStart(2,'0')
const monthKey=(y,m)=>`${y}-${pad(m+1)}`
const categoryPath=name=>`/category/${encodeURIComponent(name)}`
const tagPath=name=>`/tag/${encodeURIComponent(name)}`
const sameRoute=(a,b)=>a===b||b!=='/'&&a.startsWith(b+'/')
function activeNav(path){
 if(path==='/')return '/'
 if(path.startsWith('/category')||path.startsWith('/tag'))return '/category'
 if(path.startsWith('/archive'))return '/archive'
 if(path.startsWith('/tools'))return '/tools'
 return '/blog'
}
function HanaLink({href,children,onClick,...rest}){
 const router=useRouter(), h=useHana(), safe=safeLink(href)
 if(!safe)return <span {...rest}>{children}</span>
 if(!safe.startsWith('/'))return <a href={safe} target="_blank" rel="noopener noreferrer" {...rest} onClick={onClick}>{children}</a>
 return <Link href={safe} {...rest} onClick={e=>{
  onClick?.(e)
  if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0||rest.target==='_blank')return
  e.preventDefault();h?.navigate?h.navigate(safe):router.push(safe)
 }}>{children}</Link>
}
function Header({path,openDialog,toggleDarkMode,isDarkMode,siteName,menu}){
 const ref=useRef(null),active=activeNav(path)
 useEffect(()=>{
  const nav=ref.current;if(!nav)return
  function position(){
   const a=nav.querySelector('a.active'), indicator=nav.querySelector('.nav-indicator');if(!a||!indicator)return
   const n=nav.getBoundingClientRect(),r=a.getBoundingClientRect()
   indicator.style.setProperty('--nav-x',`${r.left-n.left}px`);indicator.style.setProperty('--nav-y',`${r.top-n.top}px`)
   indicator.style.width=`${r.width}px`;indicator.style.height=`${r.height}px`;indicator.classList.add('ready')
  }
  position();const ob=new ResizeObserver(position);ob.observe(nav);window.addEventListener('resize',position)
  document.fonts?.ready?.then(position)
  return()=>{ob.disconnect();window.removeEventListener('resize',position)}
 },[active])
 return <header className="topbar"><div className="topinner"><HanaLink href="/" className="brand"><span className="brandmark"><Icon name="flower"/></span><strong>{siteName}</strong></HanaLink><nav className="nav" ref={ref} aria-label="主导航"><span className="nav-indicator" aria-hidden="true"/>{NAV.map(([href,label,ico])=><HanaLink key={href} href={href} className={active===href?'active':''} aria-current={active===href?'page':undefined}><Icon name={ico}/><span>{label}</span></HanaLink>)}</nav><div className="topactions"><button className="searchtop" onClick={()=>openDialog('search')} aria-label="搜索"><Icon name="search"/><span>搜索</span></button><button className="iconbtn" onClick={toggleDarkMode} aria-label="切换深浅色"><Icon name={isDarkMode?'sun':'moon'}/></button><button className="iconbtn" onClick={()=>openDialog('settings')} aria-label="外观设置"><Icon name="settings"/></button></div></div></header>
}
function Profile({props,path,menu}){
 const {posts,categories,tools}=useHana(),site=props.siteInfo||{}
 const author=siteConfig('AUTHOR','Hana'),bio=siteConfig('BIO','收集生活，也收集喜欢的事。')
 const avatar=safeLink(site.icon||siteConfig('AVATAR',''))
 return <><section className="card profile"><div className="profilecover"/><div className="profilebody"><div className="avatar">{avatar?<img src={avatar} alt="头像"/>:<Art html={brandFlower()}/>}</div><h2>{author} 的小窝</h2>{bio&&<p className="intro">{bio}</p>}<div className="stats">{[['/blog',props.postCount??posts.length,'文章'],['/category',categories.length,'分类'],['/tools',tools.length,'工具']].map(([href,n,label])=><HanaLink key={href} href={href} className="stat"><b>{n}</b><span>{label}</span></HanaLink>)}</div></div></section><section className="card pad side-menu"><div className="subhead"><h3>小站地图</h3></div>{NAV.map(([href,label,ico])=><HanaLink key={href} href={href} className={activeNav(path)===href?'active':''}><Icon name={ico}/>{label}</HanaLink>)}{menu.length>0&&<div className="hana-menu-extra">{menu.map((m,i)=><HanaLink key={`${m.href}-${i}`} href={m.href}><Icon name="right"/>{m.name}</HanaLink>)}</div>}</section><div className="mobilecal"><Calendar/></div><section className="card quote"><div className="mark">“</div><p>愿你在自己的时间里，<br/>慢慢开花，自由生长。</p></section></>
}
function Calendar({home=false,large=false,year,month,onMonth,selected,onDate}){
 const {posts,navigate}=useHana()
 const initial=postDay(posts.find(p=>postDay(p)))||today()
 const [localMonth,setLocalMonth]=useState(null)
 const y=year??localMonth?.year??Number(initial.slice(0,4)),m=month??localMonth?.month??Number(initial.slice(5,7))-1
 const prefix=monthKey(y,m)
 const counts=useMemo(()=>{const map={};posts.forEach(p=>{const d=postDay(p);if(d)map[d]=(map[d]||0)+1});return map},[posts])
 const first=(new Date(y,m,1).getDay()+6)%7,days=new Date(y,m+1,0).getDate()
 const selectMonth=(delta)=>{const d=new Date(y,m+delta,1);const next={year:d.getFullYear(),month:d.getMonth()};onMonth?onMonth(next):setLocalMonth(next)}
 return <section className={`card calendar ${large||home?'large':''} ${home?'home-calendar':''}`}><div className="subhead">{home?<h2>时光日历</h2>:<h3><Icon name="calendar" small/>{large?'日历归档':'花笺日历'}</h3>}{!large&&<HanaLink href="/archive" className="textlink">全部归档 <Icon name="right" small/></HanaLink>}</div><div className="monthbar"><button className="calbutton" aria-label="上个月" onClick={()=>selectMonth(-1)}><Icon name="left" small/></button><strong>{y} 年 {m+1} 月</strong><button className="calbutton" aria-label="下个月" onClick={()=>selectMonth(1)}><Icon name="chevron" small/></button></div><div className="calgrid">{'一二三四五六日'.split('').map(d=><div className="weekday" key={d}>{d}</div>)}{Array.from({length:first},(_,i)=><div key={`empty-${i}`}/>)}{Array.from({length:days},(_,i)=>{const d=`${prefix}-${pad(i+1)}`,count=counts[d]||0;return <button key={d} className={`calday ${count?'has':''} ${selected===d?'selected':''} ${today()===d?'today':''}`} aria-label={`${d}，${count} 篇文章`} title={`${d} · ${count} 篇`} onClick={()=>onDate?onDate(d):navigate(`/archive?day=${d}`)}>{i+1}</button>})}</div><div className="callegend"><span>粉色日期有文章</span><span>{posts.filter(p=>postDay(p).startsWith(prefix)).length} 篇</span></div></section>
}
function CategoryWidget({home=false}){
 const {categories}=useHana(), marks=['heart','blog','tools','tag']
 return <section className={`card ${home?'home-categories dashboard-card':'pad side-categories'}`}><div className={home?'dashboard-head':'subhead'}>{home?<h2>分类花园</h2>:<h3><Icon name="grid" small/>分类一览</h3>}<HanaLink href="/category" className="textlink">{home?'所有分类':''}<Icon name="right" small/></HanaLink></div><div className={home?'home-cat-grid':''}>{categories.slice(0,home?4:8).map((c,i)=>home?<HanaLink className="home-cat-tile" key={c.name} href={categoryPath(c.name)}><span className="home-cat-icon"><Icon name={marks[i%4]}/></span><span className="home-cat-number">{pad(c.count)}<span className="count-unit">篇</span></span><strong>{c.name}</strong></HanaLink>:<HanaLink key={c.name} className="categoryline" href={categoryPath(c.name)}>{c.name}<span className="count">{c.count}</span><Icon name="chevron" small/></HanaLink>)}</div>{!categories.length&&<p className="hana-pending">暂无分类</p>}</section>
}
function ToolWidget({home=false}){
 const {tools}=useHana()
 return <section className={`card ${home?'home-tools dashboard-card':'pad side-tools'}`}><div className={home?'dashboard-head':'subhead'}>{home?<h2>宝藏工具箱</h2>:<h3><Icon name="tools" small/>常用工具</h3>}<HanaLink href="/tools" className="textlink">{home?'全部收藏':'更多'}<Icon name="right" small/></HanaLink></div><div className={home?'home-tool-grid':''}>{tools.slice(0,home?4:3).map(t=><HanaLink key={t.url} href={t.url} className={home?'home-tool-tile':'toolmini'}><span className="toolmark">{t.mark||t.name[0]}</span>{home?<span className="home-tool-copy"><strong>{t.name}</strong></span>:<div><b>{t.name}</b></div>}<Icon name="external" small/></HanaLink>)}</div></section>
}
function AiWidget({home=false}){
 const {openAI,siteName,aiEnabled}=useHana();if(!aiEnabled)return null
 return <section className={`card ${home?'home-ai dashboard-card':'ai-teaser side-ai'} hana-ai-card`}><Art className="hana-emblem-wrap" html={hanaEmblem(home?'home':'side')}/><div className="hana-ai-content"><h2>{siteName} <span>AI</span></h2><button className="hana-ai-button" onClick={()=>openAI()}>开始对话 <Icon name="right"/></button></div></section>
}
function Modal({title,close,children}){
 const ref=useRef(null)
 useEffect(()=>{const d=ref.current;if(d&&!d.open)d.showModal();return()=>{if(d?.open)d.close()}},[])
 return <dialog ref={ref} aria-label={title} className="hana-dialog" onCancel={e=>{e.preventDefault();close()}} onClick={e=>{if(e.target===ref.current){const r=ref.current.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}}}><div className="modalhead"><h2>{title}</h2><button className="iconbtn" onClick={close} aria-label="关闭"><Icon name="close"/></button></div><div className="modalbody">{children}</div></dialog>
}
function SearchBox({close}){
 const {posts,tools,navigate}=useHana(),[query,setQuery]=useState('')
 const q=query.trim().toLowerCase(),matches=posts.filter(p=>[p.title,p.summary,...categoriesOf(p),...tagsOf(p)].join(' ').toLowerCase().includes(q))
 return <><input autoFocus className="field" placeholder="搜索文章、分类或工具…" value={query} onChange={e=>setQuery(e.target.value)}/><div className="searchresults">{matches.slice(0,20).map(p=><HanaLink key={p.href} href={postHref(p)} onClick={close}><b>{p.title}</b><small>{postDay(p)}</small></HanaLink>)}{q&&tools.filter(t=>[t.name,t.description,t.category].join(' ').toLowerCase().includes(q)).slice(0,12).map(t=><HanaLink key={t.url} href={t.url}><b>{t.name} ↗</b></HanaLink>)}{q&&!matches.length&&<p>试试其他关键词。</p>}</div><button className="btn secondary" onClick={()=>{close();navigate('/search?s='+encodeURIComponent(query))}}>搜索文章</button></>
}
function LayoutBase(props){
 const router=useRouter(),{isDarkMode,toggleDarkMode}=useGlobal()
 const path=router.pathname,home=path==='/',siteName=String(cfg('HANA_NAME')||props.siteInfo?.title||'花笺')
 const siteURL=safeLink(cfg('HANA_BACKGROUND_URL')),appearance=useAppearance(siteURL,cfg('HANA_DEFAULT_FONT'))
 const [remote,setRemote]=useState(null),[catalogError,setCatalogError]=useState(false)
 const [localTools,setLocalTools]=useState([]),[dialog,setDialog]=useState(''),[aiOpen,setAiOpen]=useState(false),[aiPrompt,setAiPrompt]=useState(null)
 const [direction,setDirection]=useState('forward')
 const vt=useRef(null),navigating=useRef(false)
 const initialPosts=props.hanaPosts||props.posts||props.latestPosts||[]
 const initialArchive=props.archivePosts?Object.values(props.archivePosts).flat():null
 const posts=remote?.posts||initialArchive||initialPosts
 const categories=groupCategories(posts,props.categoryOptions)
 const tools=mergeTools(seedTools,props.hanaTools||[],remote?.tools||[],localTools)
 useEffect(()=>{
  let active=true;const controller=new AbortController()
  setCatalogError(false)
  fetch(`${router.basePath||''}/api/hana/catalog?locale=${encodeURIComponent(router.locale||'')}`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('catalog');return r.json()}).then(data=>{if(active){setRemote(data);setCatalogError(false)}}).catch(e=>{if(active&&e.name!=='AbortError')setCatalogError(true)})
  return()=>{active=false;controller.abort()}
 },[router.basePath,router.locale])
 useEffect(()=>{try{const x=JSON.parse(localStorage.getItem('hana.tools.v1')||'[]');if(Array.isArray(x))setLocalTools(x)}catch{}},[])
 function updateTools(list){setLocalTools(list);try{localStorage.setItem('hana.tools.v1',JSON.stringify(list))}catch{}}
 const navigate=useCallback(async href=>{
  if(navigating.current)return
  if(router.asPath===href){window.scrollTo({top:0,behavior:'smooth'});return}
  const rank=p=>NAV.findIndex(n=>n[0]===activeNav(p))
  setDirection(rank(href)<rank(router.pathname)?'back':'forward')
  setDialog('')
  const update=async()=>{await router.push(href,undefined,{scroll:false});window.scrollTo(0,0);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))}
  navigating.current=true
  try{
   if(document.startViewTransition&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    vt.current?.skipTransition?.()
    const t=document.startViewTransition(update);vt.current=t;await t.finished
   }else await update()
  }catch(err){console.warn('[hana] navigation',err?.message)}finally{navigating.current=false;vt.current=null}
 },[router])
 useEffect(()=>{
  const handler=e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setDialog('search')}if(e.key==='Escape'){setAiOpen(false);setDialog('')}}
  window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)
 },[])
 const aiEnabled=yes('HANA_AI_ENABLED')
 const openAI=(text)=>{if(aiEnabled){setAiPrompt(text?{text,at:Date.now()}:null);setAiOpen(true)}}
 const source=siteConfig('CUSTOM_MENU')&&props.customMenu?.length?props.customMenu:props.customNav
 const menu=array(source).map(m=>({name:String(m?.name||m?.title||''),href:safeLink(m?.href||m?.url)})).filter(m=>m.name&&m.href&&!NAV.some(n=>n[0]===m.href))
 const colorStyle={}
 for(const [key,variable] of [['PRIMARY','--rose'],['BG','--page'],['CARD','--paper'],['TEXT','--ink'],['BORDER','--line']]){
  const c=cfg(`HANA_COLOR_${key}${isDarkMode?'_DARK':''}`);if(typeof c==='string'&&/^#[0-9a-fA-F]{3,8}$/.test(c)){colorStyle[variable]=c;if(key==='CARD')colorStyle['--card']=c}
 }
 const route=home?'home':path==='/blog'?'blog':path==='/tools'?'tools':path.startsWith('/archive')?'archive':path.startsWith('/category')?'categories':'article'
 const context={posts,categories,tools,localTools,updateTools,navigate,openAI,siteName,aiEnabled,catalogError,dialog,setDialog}
 return <H.Provider value={context}><div id="theme-hana" className={`${isDarkMode?'dark':''} ${appearance.prefs.motion?'':'still'}`} data-bg={appearance.prefs.bg} data-font={appearance.prefs.font} data-route={route} data-nav-direction={direction} style={colorStyle}><Style/><Art html={symbols}/><Background appearance={appearance} siteURL={siteURL} siteType={cfg('HANA_BACKGROUND_TYPE')}/><Header path={path} openDialog={setDialog} toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} siteName={siteName} menu={menu}/><div className="shell"><aside className="sidebar sticky"><Profile props={props} path={path} menu={menu}/></aside><main id="main" className="main" key={router.asPath}>{props.slotTop}{props.children}</main><aside id="rightbar" className="rightbar sticky">{!home&&<><Calendar/><CategoryWidget/><ToolWidget/><AiWidget/>{props.rightAreaSlot}</>}</aside></div><footer className="sitefooter"><div className="footline"/><b>{siteName}</b> · {siteConfig('AUTHOR','Hana')}</footer><div className="floating">{aiEnabled&&<button className="floatbtn primary" onClick={()=>openAI()} aria-label="AI"><Icon name="spark"/></button>}<button className="floatbtn" onClick={()=>setDialog('settings')} aria-label="更换背景"><Icon name="settings"/></button><button className="floatbtn up" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} aria-label="回到顶部"><Icon name="up"/></button></div>{dialog==='settings'&&<Modal title="外观设置" close={()=>setDialog('')}><AppearanceForm appearance={appearance} siteURL={siteURL} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}/></Modal>}{dialog==='search'&&<Modal title="搜索" close={()=>setDialog('')}><SearchBox close={()=>setDialog('')}/></Modal>}{aiEnabled&&<Assistant open={aiOpen} close={()=>setAiOpen(false)} prompt={aiPrompt} posts={posts} tools={tools} siteName={siteName} model={cfg('HANA_AI_MODEL')} route={route}/>}</div></H.Provider>
}
function LayoutIndex(props){
 const cover=safeLink(cfg('HANA_HERO_COVER')||(yes('HANA_USE_NOTION_COVER')?props.siteInfo?.pageCover:''))
 return <><section className={`card hero home-hero ${cover?'has-cover':''}`} style={cover?{backgroundImage:`url(${JSON.stringify(cover)})`}:undefined}>{!cover&&<Art html={heroArt()}/>}<div className="herotext"><h1>{cfg('HANA_HERO_TITLE')}</h1><p>{cfg('HANA_HERO_DESCRIPTION')}</p><div className="herofoot"><HanaLink href="/blog" className="btn"><Icon name="blog" small/>翻开手账 <Icon name="right" small/></HanaLink><HanaLink href="/tools" className="btn secondary">逛逛工具箱</HanaLink></div></div></section>{yes('HANA_SHOW_NOTICE')&&props.notice?.blockMap&&!props.notice.password&&<section className="card pad notice"><h3>{props.notice.title||'公告'}</h3><NotionPage post={props.notice}/></section>}<header className="home-section-title"><h2>我的小花园</h2></header><div className="home-dashboard"><Calendar home/><CategoryWidget home/><ToolWidget home/><AiWidget home/></div><section className="card home-quote"><Art className="home-quote-flower" html={brandFlower()}/><p>愿你在自己的时间里，慢慢开花，自由生长。</p></section></>
}
const PageHeading=({children})=><header className="card pageheading"><h1>{children}</h1></header>
function PostCard({post:p,index=0}){
 const cover=p.password?'':safeLink(p.pageCoverThumbnail||p.pageCover)
 return <HanaLink className="card post" href={postHref(p)}><div className="posttext"><div className="postmeta">{categoriesOf(p).slice(0,2).map(c=><span key={c} className="pill">{c}</span>)}<span>{postDay(p)}</span>{p.password&&<span className="pill">需密码</span>}</div><h3>{p.title}</h3>{!p.password&&p.summary&&<p>{p.summary}</p>}<div className="postfooter">{tagsOf(p).length>0&&<span><Icon name="tag" small/>{tagsOf(p).slice(0,3).join(' · ')}</span>}<span className="read">阅读全文 <Icon name="right" small/></span></div></div>{cover?<div className="cover"><img loading="lazy" src={cover} alt=""/></div>:<Art html={coverArt(['tea','book','browser','leaf'][index%4])}/>}</HanaLink>
}
function PostList({source,title='博客手账',category='',tag='',keyword=''}){
 const {categories}=useHana(),[q,setQ]=useState(keyword),[cat,setCat]=useState(category||'全部'),[page,setPage]=useState(1)
 useEffect(()=>{setQ(keyword);setCat(category||'全部');setPage(1)},[keyword,category,tag])
 const list=array(source).filter(p=>(cat==='全部'||categoriesOf(p).includes(cat))&&(!tag||tagsOf(p).includes(tag))&&[p.title,p.password?'':p.summary,...categoriesOf(p),...tagsOf(p)].join(' ').toLowerCase().includes(q.trim().toLowerCase()))
 const size=12,maxPage=Math.max(1,Math.ceil(list.length/size)),current=Math.min(page,maxPage)
 return <><PageHeading>{title}</PageHeading><div className="card pad filters"><input className="field" value={q} placeholder="搜索文章…" onChange={e=>{setQ(e.target.value);setPage(1)}}/><div className="chiprow">{['全部',...categories.map(c=>c.name)].map(c=><button key={c} className={`chip ${cat===c?'active':''}`} onClick={()=>{setCat(c);setPage(1)}}>{c}</button>)}</div></div><div className="postlist" id="posts-wrapper">{list.length?list.slice((current-1)*size,current*size).map((p,i)=><PostCard post={p} key={postHref(p)} index={i}/>):<div className="card empty">没有找到相关手账。</div>}</div>{maxPage>1&&<div className="card hana-pagination"><button className="btn secondary" disabled={current===1} onClick={()=>{setPage(current-1);window.scrollTo(0,0)}}>上一页</button><span>{current} / {maxPage}</span><button className="btn secondary" disabled={current===maxPage} onClick={()=>{setPage(current+1);window.scrollTo(0,0)}}>下一页</button></div>}</>
}
function LayoutHanaBlog(props){const h=useHana();return h?<PostList source={props.hanaPosts||h.posts}/>:<div style={{padding:24}}><h1>博客</h1><Link href='/blog?theme=hana'>使用花笺主题浏览</Link></div>}
function LayoutPostList(props){const {posts}=useHana();return <PostList source={posts.length?posts:props.posts} title={props.category||props.tag||'博客手账'} category={typeof props.category==='string'?props.category:''} tag={typeof props.tag==='string'?props.tag:''}/>}
function LayoutSearch(props){const {posts}=useHana(),router=useRouter();return <PostList source={posts.length?posts:props.posts} title="搜索文章" keyword={typeof router.query.s==='string'?router.query.s:props.keyword||''}/>}
function LayoutCategoryIndex(props){
 const {categories}=useHana()
 return <><PageHeading>分类花园</PageHeading><div className="catgrid">{categories.map((c,i)=><HanaLink href={categoryPath(c.name)} className="card catcard" key={c.name}><span className="catnumber">{pad(c.count)}</span><span className="toolmark"><Icon name={['heart','blog','tools','tag'][i%4]}/></span><div className="catname">{c.name}</div></HanaLink>)}</div><section className="card pad"><div className="subhead"><h3><Icon name="tag"/>标签云</h3></div><div className="chiprow">{array(props.tagOptions).map(t=><HanaLink key={t.name} className="chip" href={tagPath(t.name)}># {t.name} · {t.count||0}</HanaLink>)}</div></section></>
}
function LayoutTagIndex(props){return <><PageHeading>标签云</PageHeading><section className="card pad chiprow">{array(props.tagOptions).map(t=><HanaLink className="chip" key={t.name} href={tagPath(t.name)}># {t.name} · {t.count||0}</HanaLink>)}</section></>}
function LayoutArchive(props){
 const {posts,catalogError}=useHana(),router=useRouter()
 const data=props.archivePosts?Object.values(props.archivePosts).flat():posts
 const sorted=[...data].sort((a,b)=>postDay(b).localeCompare(postDay(a)))
 const initial=postDay(sorted.find(p=>postDay(p)))||today()
 const [ym,setYm]=useState(null),[selected,setSelected]=useState('')
 const y=ym?.year??Number(initial.slice(0,4)),m=ym?.month??Number(initial.slice(5,7))-1
 useEffect(()=>{const day=router.query.day;if(typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)){setSelected(day);setYm({year:Number(day.slice(0,4)),month:Number(day.slice(5,7))-1})}},[router.query.day])
 const list=sorted.filter(p=>selected?postDay(p)===selected:postDay(p).startsWith(monthKey(y,m)))
 const counts=Array.from({length:12},(_,i)=>sorted.filter(p=>postDay(p).startsWith(monthKey(y,i))).length),max=Math.max(1,...counts)
 const monthChange=next=>{setYm(next);setSelected('')}
 const timeline=items=><div className="timeline">{items.length?items.map(p=><HanaLink key={postHref(p)} href={postHref(p)}><time>{postDay(p)}</time><span>{p.title}</span><Icon name="chevron" small/></HanaLink>):<p className="empty">暂无手账。</p>}</div>
 return <><PageHeading>时光日历</PageHeading>{catalogError&&!props.archivePosts&&<p className="card pad">归档数据暂未完整加载。</p>}<section className="card pad"><div className="subhead"><h3>年度写作足迹</h3><div className="monthbar"><button className="calbutton" onClick={()=>monthChange({year:y-1,month:m})} aria-label="上一年"><Icon name="left"/></button><strong>{y}</strong><button className="calbutton" onClick={()=>monthChange({year:y+1,month:m})} aria-label="下一年"><Icon name="chevron"/></button></div></div><div className="yearbar">{counts.map((n,i)=><button className={`monthcol ${m===i?'active':''}`} key={i} onClick={()=>monthChange({year:y,month:i})}><span>{n}</span><span className="barwell"><span className="bar" style={{height:`${n?n/max*100:3}%`}}/></span>{i+1}月</button>)}</div></section><Calendar large year={y} month={m} selected={selected} onMonth={monthChange} onDate={setSelected}/><section className="card pad"><div className="subhead"><h3>{selected||`${y} 年 ${m+1} 月`} · {list.length} 篇</h3>{selected&&<button className="textlink" onClick={()=>setSelected('')}>查看整月</button>}</div>{timeline(list)}</section><section className="card pad"><h3>全部文章时间线</h3>{timeline(sorted)}</section></>
}
function ToolForm({close}){
 const {localTools,updateTools}=useHana(),[error,setError]=useState('')
 return <form className="hana-control-stack" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget),url=safeLink(String(f.get('url')),false),name=String(f.get('name')).trim();if(!url||!name){setError('请输入有效名称和 HTTP/HTTPS 网址。');return}updateTools(mergeTools(localTools,[{name,url,category:String(f.get('category')).trim()||'其他',description:String(f.get('description')).trim()}]));close()}}><label>名称<input className="field" name="name" required maxLength={60}/></label><label>网址<input className="field" name="url" type="url" required/></label><label>分类<input className="field" name="category" maxLength={30}/></label><label>简介<textarea className="field" name="description" maxLength={160}/></label>{error&&<p role="alert">{error}</p>}<p>新增收藏仅保存在当前浏览器。</p><button className="btn">保存收藏</button></form>
}
function LayoutHanaTools(){const h=useHana();return h?<HanaToolsContent/>:<div style={{padding:24}}><h1>工具</h1><Link href='/tools?theme=hana'>使用花笺主题浏览</Link></div>}
function HanaToolsContent(){
 const {tools,localTools,updateTools}=useHana(),[q,setQ]=useState(''),[cat,setCat]=useState('全部'),[adding,setAdding]=useState(false)
 const cats=['全部',...new Set(tools.map(t=>t.category||'其他'))],list=tools.filter(t=>(cat==='全部'||(t.category||'其他')===cat)&&[t.name,t.description,t.category,t.url].join(' ').toLowerCase().includes(q.toLowerCase()))
 return <><PageHeading>宝藏工具箱</PageHeading><section className="card pad filters"><div className="settingrow"><h3>我的收藏</h3><button className="btn secondary" onClick={()=>setAdding(true)}><Icon name="plus" small/>添加工具</button></div><input className="field" value={q} onChange={e=>setQ(e.target.value)} placeholder="搜索工具…"/><div className="chiprow">{cats.map(c=><button key={c} className={`chip ${cat===c?'active':''}`} onClick={()=>setCat(c)}>{c}</button>)}</div></section><div className="toolgrid">{list.map(t=><article className="card toolcard" key={t.url}><div className="toolhead"><span className="toolmark">{t.mark||t.name[0]}</span><div><h3>{t.name}</h3><span className="pill">{t.category||'其他'}</span></div></div><p>{t.description}</p><footer><HanaLink className="textlink" href={t.url}>打开网站 <Icon name="external" small/></HanaLink>{localTools.some(l=>l.url===t.url)&&<button onClick={()=>{updateTools(localTools.filter(l=>l.url!==t.url));setCat('全部')}}>移除</button>}</footer></article>)}</div>{!list.length&&<div className="card empty">没有找到匹配工具。</div>}{adding&&<Modal title="收藏新工具" close={()=>setAdding(false)}><ToolForm close={()=>setAdding(false)}/></Modal>}</>
}
function PasswordLock({validPassword}){
 const [password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 return <form className="card pad hana-control-stack" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try{if(!(await validPassword(password)))setError('密码不正确。')}catch{setError('验证失败，请重试。')}finally{setBusy(false)}}}><h2>这篇文章需要密码</h2><input className="field" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/><button className="btn" disabled={busy}>解锁文章</button>{error&&<p role="alert">{error}</p>}</form>
}
function LayoutSlug({post,lock,validPassword,prev,next}){
 const {openAI,aiEnabled}=useHana()
 if(lock)return <PasswordLock validPassword={validPassword}/>
 if(!post)return <section className="card pad hana-pending">正在读取文章…</section>
 // A protected article remains excluded from AI context even after successful unlock.
 const toc=array(post.toc)
 return <><HanaLink href="/blog" className="textlink"><Icon name="left" small/>返回博客</HanaLink><article className="card article hana-article" data-hana-public-article={!post.password?'true':'false'}><div className="postmeta">{categoriesOf(post).map(c=><HanaLink key={c} href={categoryPath(c)} className="pill">{c}</HanaLink>)}<span>{postDay(post)}</span></div><h1>{post.title}</h1>{post.summary&&!post.password&&<p className="muted">{post.summary}</p>}{aiEnabled&&!post.password&&<div className="articletools"><button className="btn secondary" onClick={()=>openAI('请用中文总结当前文章的三个重点。')}><Icon name="spark" small/>AI 摘要</button></div>}{yes('HANA_ARTICLE_TOC')&&toc.length>0&&<details className="hana-toc"><summary>文章目录</summary>{toc.map((t,i)=><a key={i} href={`#${encodeURIComponent(t.id||t.blockId||'')}`}>{t.text||t.title||`章节 ${i+1}`}</a>)}</details>}<div className="body" id="article-wrapper"><NotionPage post={post}/></div><div className="chiprow">{tagsOf(post).map(t=><HanaLink key={t} className="chip" href={tagPath(t)}># {t}</HanaLink>)}</div>{yes('HANA_ARTICLE_SHARE')&&<ShareBar post={post}/>}</article>{yes('HANA_ARTICLE_NAV')&&(prev||next)&&<section className="card pad hana-article-nav">{prev&&<HanaLink href={postHref(prev)}>← {prev.title}</HanaLink>}{next&&<HanaLink href={postHref(next)}>{next.title} →</HanaLink>}</section>}{yes('HANA_ARTICLE_COMMENT')&&<section className="card pad" id="comment"><Comment frontMatter={post}/></section>}</>
}
function Layout404(){return <section className="card empty"><h1>404</h1><p>这一页走丢了。</p><HanaLink href="/" className="btn">返回首页</HanaLink></section>}
export {LayoutBase,LayoutIndex,LayoutPostList,LayoutSlug,LayoutArchive,LayoutCategoryIndex,LayoutTagIndex,LayoutSearch,Layout404,LayoutHanaBlog,LayoutHanaTools,CONFIG as THEME_CONFIG}
