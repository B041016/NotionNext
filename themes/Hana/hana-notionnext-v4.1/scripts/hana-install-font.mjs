import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const folder=path.join(root,'public','hana','fonts')
const target=path.join(folder,'Xiaolai-Regular.ttf')
const args=process.argv.slice(2)
const local=args.find(a=>!a.startsWith('--'))
await fs.mkdir(folder,{recursive:true})
function checkTTF(buffer){
 if(buffer.length<100000||!(buffer.subarray(0,4).equals(Buffer.from([0,1,0,0]))||buffer.subarray(0,4).toString()==='true'))throw Error('文件不是有效的 TrueType 字体（请勿使用 ZIP 或 HTML 下载错误页面）。')
}
async function get(url){
 const r=await fetch(url,{headers:{'User-Agent':'Hana-NotionNext-Installer'},signal:AbortSignal.timeout(180000)})
 if(!r.ok)throw Error(`${r.status}: ${url}`)
 return r
}
try{
 let buffer,releaseTag=''
 if(local){buffer=await fs.readFile(path.resolve(local))}
 else{
  const release=await (await get('https://api.github.com/repos/lxgw/kose-font/releases/latest')).json()
  const asset=release.assets?.find(a=>/^Xiaolai(?:SC)?[-_]?Regular\.ttf$/i.test(a.name))
   ||release.assets?.find(a=>/^Xiaolai.*\.ttf$/i.test(a.name)&&!/mono/i.test(a.name))
  if(!asset)throw Error('官方 Release 没有找到独立 TTF，请按 README 手动下载。')
  releaseTag=release.tag_name
  console.log('Downloading official font:',asset.name,releaseTag)
  buffer=Buffer.from(await (await get(asset.browser_download_url)).arrayBuffer())
 }
 checkTTF(buffer)
 let license
 const localLicense=args.find(a=>a.startsWith('--license='))?.slice(10)
 if(localLicense)license=await fs.readFile(path.resolve(localLicense),'utf8')
 else{
  const url=`https://raw.githubusercontent.com/lxgw/kose-font/${releaseTag?encodeURIComponent(releaseTag):'master'}/OFL.txt`
  try{license=await (await get(url)).text()}catch{license=await(await get('https://raw.githubusercontent.com/lxgw/kose-font/master/OFL.txt')).text()}
 }
 if(!/SIL OPEN FONT LICENSE/i.test(license))throw Error('未找到有效 OFL 授权文本。')
 await fs.writeFile(target,buffer)
 await fs.writeFile(path.join(folder,'OFL.txt'),license)
 console.log(`Installed ${target} (${(buffer.length/1024/1024).toFixed(1)} MiB)`)
 console.log('The website now loads fonts from its own /hana/fonts/ path, not a CDN.')
}catch(e){
 console.error('Font installation failed:',e.message)
 console.error('Manual: https://github.com/lxgw/kose-font/releases')
 console.error('Place the regular TTF and OFL.txt in public/hana/fonts/, renaming TTF to Xiaolai-Regular.ttf.')
 process.exitCode=1
}
