import ArticleClient from "./client"

// Server component: unwrap params (it's a Promise in Next.js 16)
export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ArticleClient id={id} />
}
