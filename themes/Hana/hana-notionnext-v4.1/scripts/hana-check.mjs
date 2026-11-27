import fs from 'node:fs/promises'
import path from 'node:path'
const root=process.cwd()
let ok=true
for(const file of ['themes/hana/index.js','themes/hana/config.js','public/hana/hana.css','pages/blog/index.js','pages/tools/index.js','pages/api/hana/catalog.js','public/hana/fonts/Xiaolai-Regular.ttf','public/hana/fonts/OFL.txt','public/hana/fonts/ShanHaiXiaRiYanHuoW.ttf']){
 try{const s=await fs.stat(path.join(root,file));if(!s.size)throw Error('empty');console.log('OK',file)}
 catch{ok=false;console.error('MISSING',file)}
}
const p=JSON.parse(await fs.readFile('package.json','utf8'))
if(!p.dependencies?.['@mlc-ai/web-llm']){ok=false;console.error('MISSING dependency @mlc-ai/web-llm')}
if(!ok)process.exitCode=1
