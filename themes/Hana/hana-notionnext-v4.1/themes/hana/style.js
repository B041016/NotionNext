import Head from 'next/head'
import { useRouter } from 'next/router'
export function Style() {
  const { basePath = '' } = useRouter()
  return <Head><link key="hana-style" rel="stylesheet" href={`${basePath}/hana/hana.css`} /></Head>
}
