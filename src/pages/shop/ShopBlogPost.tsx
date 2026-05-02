import { useParams, Link } from "react-router-dom";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { usePostBySlug } from "@/hooks/useBlog";
import { ChevronLeft } from "lucide-react";
import { TiptapView } from "@/components/blog/TiptapView";

export default function ShopBlogPost() {
  const { slug } = useParams();
  const { data: post, isLoading } = usePostBySlug(slug);

  if (isLoading) return <ShopLayout><div className="py-20 text-center">Loading...</div></ShopLayout>;
  if (!post) return <ShopLayout><div className="py-20 text-center">Post not found.</div></ShopLayout>;

  return (
    <ShopLayout>
      <article className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/shop/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <p className="text-sm text-muted-foreground mb-2">
          {post.published_at && new Date(post.published_at).toLocaleDateString()} {post.author_name && `· by ${post.author_name}`}
        </p>
        <h1 className="text-3xl md:text-5xl font-bold font-heading mb-6">{post.title}</h1>

        {post.cover_image_url && (
          <img src={post.cover_image_url} alt={post.title} className="w-full rounded-xl mb-8 aspect-video object-cover" />
        )}

        <TiptapView content={post.content} />
      </article>
    </ShopLayout>
  );
}
