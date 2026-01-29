interface StructuredDataProps {
  data: Record<string, any>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Rev Winner",
  "alternateName": "Rev Winner AI Sales Assistant",
  "description": "AI-powered sales assistant providing real-time conversation intelligence, live transcription with speaker diarization, automated meeting minutes, and proactive sales coaching. Developed by Healthcaa Technologies.",
  "url": "https://revwinner.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://revwinner.com/assets/rev-winner-logo.png",
    "width": "1024",
    "height": "200"
  },
  "image": "https://revwinner.com/og-image.png",
  "foundingDate": "2024",
  "founder": {
    "@type": "Organization",
    "name": "Healthcaa Technologies",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Lucknow",
      "addressRegion": "Uttar Pradesh",
      "addressCountry": "IN"
    }
  },
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+91-8130276382",
      "contactType": "Sales",
      "areaServed": "Worldwide",
      "availableLanguage": ["English"],
      "email": "sales@revwinner.com"
    },
    {
      "@type": "ContactPoint",
      "telephone": "+91-8130276382",
      "contactType": "Customer Support",
      "areaServed": "Worldwide",
      "availableLanguage": ["English"],
      "email": "support@revwinner.com"
    }
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Business Plaza",
    "addressLocality": "Lucknow",
    "addressRegion": "Uttar Pradesh",
    "postalCode": "226001",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "26.8467",
    "longitude": "80.9462"
  },
  "sameAs": [
    "https://www.linkedin.com/company/revwinner",
    "https://twitter.com/revwinner",
    "https://www.facebook.com/revwinner"
  ],
  "knowsAbout": [
    "Sales Intelligence",
    "Conversation Intelligence",
    "AI Sales Coaching",
    "Real-time Transcription",
    "Meeting Minutes Automation",
    "Revenue Intelligence",
    "Sales Enablement",
    "B2B Sales Software"
  ],
  "slogan": "Turn Every Conversation into a Closed Deal",
  "brand": {
    "@type": "Brand",
    "name": "Rev Winner"
  }
};

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Rev Winner",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR",
    "description": "Free trial with 3 sessions and 180 minutes total"
  },
  "operatingSystem": "Web Browser",
  "description": "AI-powered sales assistant that provides real-time conversation intelligence, live transcription with speaker diarization, automated meeting minutes, and proactive sales coaching to help you close more deals.",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "127"
  },
  "featureList": [
    "Real-time AI Sales Coaching",
    "Live Transcription with Speaker Diarization",
    "Automated Meeting Minutes",
    "Conversation Analysis",
    "Multi-AI Provider Support (OpenAI, Claude, Gemini, Grok, DeepSeek, Kimi)",
    "Session Usage Tracking",
    "PDF Export"
  ]
};

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const articleSchema = (article: {
  headline: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.headline,
  "description": article.description,
  "author": {
    "@type": "Person",
    "name": article.author
  },
  "publisher": {
    "@type": "Organization",
    "name": "Rev Winner",
    "logo": {
      "@type": "ImageObject",
      "url": "https://revwinner.com/assets/rev-winner-logo.png"
    }
  },
  "datePublished": article.datePublished,
  "dateModified": article.dateModified || article.datePublished,
  "image": article.image || "https://revwinner.com/assets/rev-winner-logo.png"
});

export const faqSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});
