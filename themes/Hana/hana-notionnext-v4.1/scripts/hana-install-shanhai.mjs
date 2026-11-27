import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateRawSync } from 'node:zlib'
import { createHash } from 'node:crypto'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const source=process.argv[2]
const target=path.join(root,'public','hana','fonts','ShanHaiXiaRiYanHuoW.ttf')
const MAX=16*1024*1024
const expected='329ff5dce7e41aa6242c0b2332aa62c1221218355832a22ed943ff0d7776a266'
const filename='ShanHaiXiaRiYanHuoW-2.ttf'
const digest=b=>createHash('sha256').update(b).digest('hex')

function extractTTF(zip){
 // Read only the one expected member; never extract archive paths.
 let e=-1
 for(let i=zip.length-22;i>=Math.max(0,zip.length-65557);i--){
  if(zip.readUInt32LE(i)===0x06054b50&&i+22+zip.readUInt16LE(i+20)===zip.length){e=i;break}
 }
 if(e<0)throw Error('ZIP 文件损坏或不受支持。')
 const count=zip.readUInt16LE(e+10),size=zip.readUInt32LE(e+12)
 let pos=zip.readUInt32LE(e+16)
 const end=pos+size
 if(count>200||end>e||zip.readUInt16LE(e+4)!==0||zip.readUInt16LE(e+6)!==0)throw Error('不支持分卷或异常 ZIP。')
 for(let i=0;i<count;i++){
  if(pos+46>end||zip.readUInt32LE(pos)!==0x02014b50)throw Error('ZIP 目录损坏。')
  const flags=zip.readUInt16LE(pos+8),method=zip.readUInt16LE(pos+10)
  const packed=zip.readUInt32LE(pos+20),unpacked=zip.readUInt32LE(pos+24)
  const nl=zip.readUInt16LE(pos+28),xl=zip.readUInt16LE(pos+30),cl=zip.readUInt16LE(pos+32),offset=zip.readUInt32LE(pos+42)
  if(pos+46+nl+xl+cl>end)throw Error('ZIP 目录超出范围。')
  const name=zip.subarray(pos+46,pos+46+nl).toString('utf8')
  pos+=46+nl+xl+cl
  if(name.split('/').pop()!==filename)continue
  if(flags&1||unpacked>MAX||packed>MAX||offset+30>zip.length||zip.readUInt32LE(offset)!==0x04034b50)throw Error('字体压缩条目异常。')
  const start=offset+30+zip.readUInt16LE(offset+26)+zip.readUInt16LE(offset+28)
  if(start+packed>zip.length)throw Error('字体压缩数据不完整。')
  const bytes=zip.subarray(start,start+packed)
  const result=method===0?Buffer.from(bytes):method===8?inflateRawSync(bytes,{maxOutputLength:MAX}):null
  if(!result||result.length!==unpacked)throw Error('字体解压失败。')
  return result
 }
 throw Error(`ZIP 中没有 ${filename}。请使用你原来的字体 ZIP 或其中的 TTF。`)
}

try{
 if(!source)throw Error('用法：node scripts/hana-install-shanhai.mjs "原字体 ZIP 或 TTF 路径"')
 const src=path.resolve(source)
 const stat=await fs.stat(src)
 if(!stat.isFile()||stat.size>32*1024*1024)throw Error('请选择原始字体 ZIP 或 TTF 文件。')
 const bytes=await fs.readFile(src)
 const ttf=path.extname(src).toLowerCase()==='.zip'?extractTTF(bytes):bytes
 if(digest(ttf)!==expected)throw Error('字体与本主题适配的原始文件不一致，未安装。')
 let existing=null
 try{existing=await fs.readFile(target)}catch(e){if(e.code!=='ENOENT')throw e}
 if(existing&&digest(existing)!==expected)throw Error('目标目录已有不同字体文件，未覆盖。')
 await fs.mkdir(path.dirname(target),{recursive:true})
 if(!existing)await fs.writeFile(target,ttf,{flag:'wx'})
 console.log('已从你自己的字体文件安装至：'+target)
 console.log('请确认字体授权包含公开网站/Web Font 使用，再提交或部署该字体。')
}catch(e){
 console.error('字体安装失败：'+e.message)
 process.exitCode=1
}
