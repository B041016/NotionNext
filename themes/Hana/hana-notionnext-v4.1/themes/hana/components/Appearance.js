import { useEffect, useState } from 'react'
import { FONT_CHOICES, normalizeFont } from '../fonts'
const KEY='hana.appearance.v1'
const DEFAULT={bg:'sakura',veil:68,motion:true}
function db(){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('hana-background',1)
  r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('files'))r.result.createObjectStore('files')}
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)
 })
}
async function fileOp(value,read=false){
 const d=await db()
 return new Promise((resolve,reject)=>{
  const tx=d.transaction('files',read?'readonly':'readwrite'), s=tx.objectStore('files')
  const req=read?s.get('background'):value?s.put(value,'background'):s.delete('background')
  let result;req.onsuccess=()=>{result=req.result}
  tx.oncomplete=()=>{d.close();resolve(result)}
  tx.onerror=()=>{d.close();reject(tx.error)}
  tx.onabort=()=>{d.close();reject(tx.error)}
 })
}
export function useAppearance(configURL,configuredFont='xiaolai'){
 const defaultFont=normalizeFont(configuredFont)
 const [prefs,setPrefs]=useState({...DEFAULT,bg:configURL?'site':'sakura',font:defaultFont})
 const [blob,setBlob]=useState(null),[media,setMedia]=useState(''),[ready,setReady]=useState(false)
 const [message,setMessage]=useState('')
 useEffect(()=>{
  let live=true
  let p={...DEFAULT,bg:configURL?'site':'sakura',font:defaultFont,motion:!matchMedia('(prefers-reduced-motion: reduce)').matches}
  try {p={...p,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
  p.font=normalizeFont(p.font,defaultFont)
  if(p.bg==='custom')fileOp(null,true).then(b=>{if(live){if(b)setBlob(b);else setPrefs(x=>({...x,bg:configURL?'site':'sakura'}))}}).catch(()=>{if(live)setPrefs(x=>({...x,bg:configURL?'site':'sakura'}))})
  setPrefs(p);setReady(true);return()=>{live=false}
 },[configURL,defaultFont])
 useEffect(()=>{if(!ready)return;try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch{}},[prefs,ready])
 useEffect(()=>{if(!blob){setMedia('');return}const url=URL.createObjectURL(blob);setMedia(url);return()=>URL.revokeObjectURL(url)},[blob])
 async function upload(file){
  if(!file)return
  if(file.size>30*1024*1024||!(/^(image\/(jpeg|png|webp|gif|avif)|video\/(mp4|webm))$/.test(file.type))){setMessage('请选择 30 MB 以内的图片、GIF、MP4 或 WebM。');return}
  setBlob(file);setPrefs(p=>({...p,bg:'custom',veil:45}));setMessage('')
  try{await fileOp(file);setMessage('已保存到当前浏览器')}catch{setMessage('已应用，但浏览器无法长期保存。')}
 }
 function reset(){setBlob(null);setPrefs(p=>({...DEFAULT,bg:configURL?'site':'sakura',font:normalizeFont(p.font,defaultFont),motion:!matchMedia('(prefers-reduced-motion: reduce)').matches}));fileOp(null).catch(()=>{});setMessage('')}
 return {prefs,setPrefs,blob,media,upload,reset,message}
}
export function Background({appearance,siteURL,siteType}){
 const {prefs,blob,media}=appearance
 const source=prefs.bg==='custom'?media:prefs.bg==='site'?siteURL:''
 const video=prefs.bg==='custom'?blob?.type?.startsWith('video/'):siteType==='video'
 const animatedImage=prefs.bg==='custom'?blob?.type==='image/gif':/\.gif(?:\?|$)/i.test(source||'')
 return <div id="backdrop" aria-hidden="true"><div id="ambient"/>{source&&video&&prefs.motion?<video className="hana-media-video" key={source} src={source} muted loop playsInline autoPlay/>:source&&!video&&(!animatedImage||prefs.motion)?<div id="bgmedia" style={{backgroundImage:`url(${JSON.stringify(source)})`}}/>:null}<div id="veil" style={{opacity:Math.max(0,Math.min(95,Number(prefs.veil)||0))/100}}/><div id="petals">{Array.from({length:15},(_,i)=><i key={i} className="petal" style={{'--x':`${i*23.71%100}%`,'--s':`${7+i%6*2}px`,'--d':`${14+i%7*2.1}s`,'--delay':`${-i*3.7}s`}}/>)}</div></div>
}

function FontPicker({value,onChange}){
 const selected=FONT_CHOICES.find(font=>font.id===normalizeFont(value))
 const [error,setError]=useState('')
 useEffect(()=>{
  let live=true
  setError('')
  if(selected.family&&document.fonts?.load){
   document.fonts.load(`16px "${selected.family}"`,'把日子写成一朵花').then(faces=>{
    if(live&&!faces.length)setError('本地字体尚未安装，暂时使用备用字体。')
   }).catch(()=>{if(live)setError('本地字体尚未安装或加载失败，暂时使用备用字体。')})
  }
  return()=>{live=false}
 },[selected.id,selected.family])
 return <section className="hana-font-picker" aria-label="字体设置">
  <h3>字体</h3>
  <div className="hana-font-options" role="group" aria-label="选择全站字体">
   {FONT_CHOICES.map(font=><button type="button" className={`hana-font-option ${selected.id===font.id?'active':''}`} aria-pressed={selected.id===font.id} key={font.id} onClick={()=>onChange(font.id)}>{font.label}</button>)}
  </div>
  <div className="hana-font-preview">把日子写成一朵花。</div>
  {error&&<p className="hana-font-error" role="status">{error}</p>}
 </section>
}

export function AppearanceForm({appearance,siteURL,isDarkMode,toggleDarkMode}){
 const {prefs,setPrefs,upload,reset,message}=appearance
 const change=(key,value)=>setPrefs(p=>({...p,[key]:value}))
 return <div className="hana-control-stack"><FontPicker value={prefs.font} onChange={font=>change('font',font)}/><div className="presetgrid">{[['sakura','樱花微风'],['lavender','丁香暮光'],['paper','奶油纸张'],...(siteURL?[['site','站长背景']]:[])].map(([key,name])=><button key={key} className={`preset ${prefs.bg===key?'active':''}`} onClick={()=>change('bg',key)}><div className={`swatch ${key==='site'?'sakura':key}`}/>{name}</button>)}</div><label className="upload">上传自定义背景<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm" onChange={e=>{upload(e.target.files?.[0]);e.target.value=''}}/></label><label className="settingrow">背景柔化 {prefs.veil}%<input type="range" min="0" max="95" step="5" value={prefs.veil} onChange={e=>change('veil',Number(e.target.value))}/></label><label className="settingrow">动态效果<input type="checkbox" className="switch" checked={!!prefs.motion} onChange={e=>change('motion',e.target.checked)}/></label><label className="settingrow">深色模式<input type="checkbox" className="switch" checked={!!isDarkMode} onChange={toggleDarkMode}/></label>{message&&<p role="status">{message}</p>}<button className="btn secondary" onClick={reset}>恢复默认背景</button></div>
}
