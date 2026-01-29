import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
}

export function useSEO({ title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl }: SEOProps) {
  useEffect(() => {
    document.title = title;

    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    const updateCanonicalLink = (url: string) => {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      
      canonicalLink.setAttribute('href', url);
    };

    updateMetaTag('description', description);
    
    // Always update keywords tag - set to empty string if not provided to clear stale keywords
    const keywordsElement = document.querySelector('meta[name="keywords"]');
    if (keywords) {
      updateMetaTag('keywords', keywords);
    } else if (keywordsElement) {
      // Remove keywords tag if no keywords provided (for pages that don't need keywords)
      keywordsElement.remove();
    }
    
    updateMetaTag('og:title', ogTitle || title, true);
    updateMetaTag('og:description', ogDescription || description, true);
    updateMetaTag('og:type', 'website', true);
    if (ogImage) {
      updateMetaTag('og:image', ogImage, true);
      updateMetaTag('og:image:alt', ogTitle || title, true);
      updateMetaTag('twitter:image', ogImage);
    }
    if (ogUrl) {
      updateMetaTag('og:url', ogUrl, true);
      updateCanonicalLink(ogUrl);
    }
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', ogTitle || title);
    updateMetaTag('twitter:description', ogDescription || description);
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl]);
}
