import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
const source=path.dirname(fileURLToPath(import.meta.url))
const dest=path.resolve(process.argv[2]||'.')
const priorHashes={
 "pages/api/hana/catalog.js": "5cb927a5add164c6ec457b23e67cf904a09d7f49fbe2dd0f3659188b8104846c",
 "pages/blog/index.js": "b821afd82a5331a6847e88ca73e8c76b243fe1735a31692b604f6da2b5d2a750",
 "pages/tools/index.js": "09a8364fd68ec646959a38cb4884c0459ddbe46a27dbaea91cb64257b3c071d0",
 "public/hana/backgrounds/README.txt": "437d80af4ed5e01576e837baf5a2d722f0a272baa221a31e1ac7098154a85919",
 "public/hana/fonts/README.txt": "fb8f1ccc1da4994c1c3ce8c67d9ec66935c395625cea7a9470d34abcabd36e5e",
 "public/hana/hana.css": "d5ec8762241ebd2c34ec42c33404e77251f3d08ca22d054f712e070ae77e9563",
 "scripts/hana-check.mjs": "3fdbccd6fd53b2a464956e89ee8164a057cd69f51a153c812fe91f542f29677c",
 "scripts/hana-install-font.mjs": "96bc1a24ee6825ef961d9d3ccf65fb2d6b9d313b9e606ff16b26d46f9aacf5c4",
 "themes/hana/art.js": "b488dc5ab50f897c43c569af8cb826027a14c2458003ba2529757c47069aedda",
 "themes/hana/components/Appearance.js": "1dc8b12f1f3d7ae48b6a7d99020d5ae01ab32a672c7d3351e46722a4d73ee703",
 "themes/hana/components/Assistant.js": "1e5b51bd04c637f5b2b13dad1026917b3d6df05ff03d7560ec72bde67a594e55",
 "themes/hana/config.js": "5afbc43593aa191ca549a3855160719d877b378e175282090fda6bc39af63752",
 "themes/hana/data.js": "8d389228d45f54241e2d75d6efcd3e9c8293395ea8bd8713460e9302e03d9f3c",
 "themes/hana/index.js": "6c62212cf475e72281e7731aff39ed321bfd07f9204d90db59f37fa3a51f92c6",
 "themes/hana/style.js": "479e70575c9a69d58b12bae7c8b78d0d45f4c6b6303ec6e7243854609c06cfea",
 "themes/hana/tools.json": "0d04517ffb60d0e0f4aed1782273a356f4053920ba6a40957281a8ec77654ae3"
}
const hash=b=>createHash('sha256').update(b).digest('hex')
const upgrade=process.argv.includes('--upgrade')
const exists=async p=>{try{await fs.access(p);return true}catch{return false}}
async function list(dir){
 const result=[]
 for(const e of await fs.readdir(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name)
  if(e.isDirectory())result.push(...await list(p))
  else if(e.isFile())result.push(p)
 }
 return result
}
try{
 for(const name of ['package.json','blog.config.js','themes/theme.js','pages/_app.js','lib/db/SiteDataApi.js'])
  if(!await exists(path.join(dest,name)))throw Error(`找不到 ${name}，请指定 NotionNext 项目根目录。`)
 const pkg=JSON.parse(await fs.readFile(path.join(dest,'package.json'),'utf8'))
 const files=[]
 for(const dir of ['themes','public','pages','scripts'])files.push(...await list(path.join(source,dir)))
 // Do not overwrite any existing differing file. Also catch file-vs-directory routes.
 for(const r of ['blog','tools']){
  for(const ext of ['js','jsx','ts','tsx']){
   if(await exists(path.join(dest,'pages',`${r}.${ext}`)))throw Error(`已有 pages/${r}.${ext}，请先解决路由冲突，不会覆盖。`)
  }
 }
 const conflicts=[],replacements=[]
 for(const f of files){
  const rel=path.relative(source,f),target=path.join(dest,rel)
  if(await exists(target)){
   const current=await fs.readFile(target),incoming=await fs.readFile(f)
   if(!incoming.equals(current)){
    const normalized=rel.split(path.sep).join('/')
    if(upgrade&&priorHashes[normalized]===hash(current))replacements.push(rel)
    else conflicts.push(rel)
   }
  }
 }
 if(conflicts.length)throw Error('以下现有文件内容不同，未复制任何文件：\n'+conflicts.join('\n'))
 if(path.resolve(source)===dest)throw Error('请先解压到 NotionNext 之外的目录，再运行安装脚本。')
 if(replacements.length){
  const backup=path.join(dest,'.hana-backup',new Date().toISOString().replace(/[:.]/g,'-'))
  for(const rel of replacements){
   const target=path.join(backup,rel)
   await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(dest,rel),target)
  }
  console.log('原版文件已备份到 '+backup)
 }
 for(const f of files){
  const target=path.join(dest,path.relative(source,f))
  await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(f,target)
 }
 console.log(`已复制 ${files.length} 个主题文件到 ${dest}`)
 console.log('接下来请进入项目根目录：')
 const pm=String(pkg.packageManager||'')
 const useYarn=pm.startsWith('yarn')||await exists(path.join(dest,'yarn.lock'))
 const usePnpm=pm.startsWith('pnpm')||await exists(path.join(dest,'pnpm-lock.yaml'))
 console.log(usePnpm?'pnpm add @mlc-ai/web-llm@0.2.89':useYarn?'yarn add @mlc-ai/web-llm@0.2.89':'npm install @mlc-ai/web-llm@0.2.89')
 console.log('node scripts/hana-install-font.mjs  # 尚未安装小赖字体时')
 console.log('node scripts/hana-install-shanhai.mjs "原始字体ZIP路径"')
 console.log('设置 NEXT_PUBLIC_THEME=hana（并检查 Notion Config 的 THEME），然后构建。')
}catch(e){console.error('安装停止：'+e.message);process.exitCode=1}
