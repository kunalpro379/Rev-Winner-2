import { HamburgerNav } from "@/components/hamburger-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { StructuredData, articleSchema } from "@/components/structured-data";
import { SocialShare } from "@/components/social-share";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const blogArticles = [
  {
    id: "8",
    title: "What is Rev Winner? The Complete Guide to AI-Powered Sales Success",
    slug: "what-is-rev-winner-complete-guide",
    excerpt: "Discover what Rev Winner is, explore its powerful features, learn how it works, and understand why it stands apart from every other sales solution in the market.",
    author: "Sandeep - Director Rev Winner",
    date: "2025-12-16",
    readTime: "8 min read",
    category: "Product Overview",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
  },
  {
    id: "7",
    title: "Rev Winner: The Revolutionary Solution for Virtual Sales Success",
    slug: "rev-winner-revolutionary-virtual-sales",
    excerpt: "In today's digital-first world, selling over calls and virtual meetings has become the norm. Discover how Rev Winner is transforming the game for sales professionals with real-time AI intelligence.",
    author: "Sandeep",
    date: "2025-11-12",
    readTime: "6 min read",
    category: "Virtual Sales",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=400&fit=crop",
  },
  {
    id: "1",
    title: "How AI is Transforming Sales Discovery Calls in 2025",
    slug: "ai-transforming-sales-discovery-2025",
    excerpt: "Discover how artificial intelligence is revolutionizing the way sales professionals conduct discovery calls, with real-time insights and coaching that close more deals.",
    author: "Sarah Johnson",
    date: "2025-01-15",
    readTime: "5 min read",
    category: "AI & Sales",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop",
  },
  {
    id: "2",
    title: "10 Proven Sales Techniques That Work in Every Industry",
    slug: "10-proven-sales-techniques",
    excerpt: "Learn the universal sales strategies that top performers use to close deals consistently, from SaaS to manufacturing and everything in between.",
    author: "Michael Chen",
    date: "2025-01-10",
    readTime: "8 min read",
    category: "Sales Strategy",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop",
  },
  {
    id: "3",
    title: "The Science Behind Real-Time Sales Coaching",
    slug: "science-real-time-sales-coaching",
    excerpt: "Explore the psychology and technology that makes live sales coaching so effective, and why it's becoming essential for high-performing sales teams.",
    author: "Dr. Emily Rodriguez",
    date: "2025-01-05",
    readTime: "6 min read",
    category: "Sales Psychology",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
  },
  {
    id: "4",
    title: "Mastering Discovery Questions: A Complete Guide",
    slug: "mastering-discovery-questions",
    excerpt: "The art of asking the right questions at the right time. Learn how to uncover pain points and position your solution perfectly during discovery calls.",
    author: "James Martinez",
    date: "2024-12-28",
    readTime: "7 min read",
    category: "Sales Skills",
    image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=400&fit=crop",
  },
  {
    id: "5",
    title: "How to Handle Sales Objections Like a Pro",
    slug: "handle-sales-objections-pro",
    excerpt: "Turn objections into opportunities with proven frameworks and real-world examples that help you navigate even the toughest customer pushback.",
    author: "Lisa Thompson",
    date: "2024-12-20",
    readTime: "6 min read",
    category: "Objection Handling",
    image: "https://images.unsplash.com/photo-1542626991-cbc4e32524cc?w=800&h=400&fit=crop",
  },
  {
    id: "6",
    title: "Building Trust on Cold Calls: Strategies That Work",
    slug: "building-trust-cold-calls",
    excerpt: "Learn how to establish credibility and rapport within the first 30 seconds of a cold call, backed by behavioral science and proven techniques.",
    author: "Robert Kim",
    date: "2024-12-15",
    readTime: "5 min read",
    category: "Cold Calling",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=400&fit=crop",
  },
];

export default function Blog() {
  const [, setLocation] = useLocation();
  
  useSEO({
    title: "Blog - Rev Winner | Sales Tips, AI Insights & Industry News",
    description: "Discover expert sales strategies, AI-powered insights, and industry best practices. Learn how to close more deals with Rev Winner's resources and guides.",
    keywords: "sales strategy, AI sales insights, sales enablement, conversation intelligence, sales coaching tips, objection handling, discovery calls, sales techniques, B2B sales, sales process optimization, revenue intelligence, sales leadership, customer success, sales automation, sales performance, AI for sales, sales intelligence software, sales best practices, cold calling strategies, sales deal coaching",
    ogImage: "https://revwinner.com/og-image.png",
    ogUrl: "https://revwinner.com/blog"
  });

  return (
    <>
      <StructuredData data={articleSchema({
        headline: blogArticles[0].title,
        description: blogArticles[0].excerpt,
        author: blogArticles[0].author,
        datePublished: blogArticles[0].date,
        image: blogArticles[0].image,
      })} />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:bg-gradient-to-br dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
        <HamburgerNav currentPath="/blog" />

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-purple-900 via-fuchsia-800 to-pink-800 dark:from-purple-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent mb-6">
              Sales Insights & Resources
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Expert strategies, AI-powered tips, and proven techniques to help you close more deals.
            </p>
          </div>

          {/* Social Share */}
          <div className="flex justify-center mb-12">
            <SocialShare 
              title="Rev Winner Blog - Sales Insights & Resources"
              description="Discover expert sales strategies and AI-powered insights"
            />
          </div>
        </section>

        {/* Blog Articles Grid */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogArticles.map((article) => (
              <Card 
                key={article.id}
                className="group hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-purple-200/50 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-400/60 overflow-hidden"
                data-testid={`card-article-${article.id}`}
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <Badge 
                    className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
                  >
                    {article.category}
                  </Badge>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {article.excerpt}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{article.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(article.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>{article.readTime}</span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="group-hover:text-purple-700 dark:group-hover:text-purple-400"
                      onClick={() => setLocation(`/blog/${article.slug}`)}
                      data-testid={`button-read-article-${article.id}`}
                    >
                      Read More <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="max-w-4xl mx-auto px-6 lg:px-8 pb-20">
          <Card className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white border-0 p-8 lg:p-12">
            <div className="text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Want More Sales Insights?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Get expert tips, industry trends, and exclusive strategies delivered to your inbox every week.
              </p>
              <Button
                onClick={() => setLocation('/register')}
                className="bg-white text-purple-700 hover:bg-purple-50 px-8 py-6 text-lg font-bold"
                data-testid="button-subscribe-newsletter"
              >
                Start Your Free Trial
              </Button>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-purple-200/50 dark:border-purple-500/20 bg-white/30 dark:bg-slate-950/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Company */}
              <div>
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-4">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <button onClick={() => setLocation('/')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-home">
                      Home
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setLocation('/blog')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-blog">
                      Blog
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setLocation('/contact')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-contact">
                      Contact Us
                    </button>
                  </li>
                </ul>
              </div>

              {/* Product */}
              <div>
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-4">Product</h3>
                <ul className="space-y-2">
                  <li>
                    <button onClick={() => setLocation('/ai-sales-assistant')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-app">
                      Rev Winner App
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setLocation('/subscribe')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-pricing">
                      Pricing
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setLocation('/register')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-trial">
                      Start Free Trial
                    </button>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <button onClick={() => setLocation('/terms')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-terms">
                      Terms & Conditions
                    </button>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-sitemap">
                      Sitemap
                    </a>
                  </li>
                  <li>
                    <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-robots">
                      Robots.txt
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-purple-200/50 dark:border-purple-500/20 pt-8 text-center text-slate-600 dark:text-slate-400">
              <p>© 2025 Rev Winner. All rights reserved.</p>
              <p className="text-sm mt-2">A Product from Healthcaa Technologies</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
