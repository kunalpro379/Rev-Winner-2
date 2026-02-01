import React from 'react';

/**
 * Parse markdown text and convert to React elements
 * Supports: bold (**text**), italic (*text*), lists, headers
 */
export function parseMarkdown(text: string): React.ReactNode {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let elementKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines but add spacing
    if (!trimmed) {
      elements.push(<div key={`empty-${elementKey++}`} className="h-1" />);
      i++;
      continue;
    }

    // Headers
    if (trimmed.startsWith('##')) {
      const headerText = trimmed.replace(/^#+\s*/, '').trim();
      elements.push(
        <h3 key={`h3-${elementKey++}`} className="font-bold text-base mb-2 mt-3 text-foreground">
          {parseInlineMarkdown(headerText)}
        </h3>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('#')) {
      const headerText = trimmed.replace(/^#+\s*/, '').trim();
      elements.push(
        <h2 key={`h2-${elementKey++}`} className="font-bold text-lg mb-2 mt-3 text-foreground">
          {parseInlineMarkdown(headerText)}
        </h2>
      );
      i++;
      continue;
    }

    // Bullet lists
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        if (currentLine.startsWith('-') || currentLine.startsWith('*')) {
          listItems.push(currentLine.substring(1).trim());
          i++;
        } else if (currentLine === '') {
          i++;
          break;
        } else {
          break;
        }
      }
      elements.push(
        <ul key={`ul-${elementKey++}`} className="list-disc list-inside space-y-1 mb-2 pl-2">
          {listItems.map((item, idx) => (
            <li key={`li-${idx}`} className="text-sm text-foreground">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered lists
    if (/^\d+\./.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        if (/^\d+\./.test(currentLine)) {
          listItems.push(currentLine.replace(/^\d+\.\s*/, '').trim());
          i++;
        } else if (currentLine === '') {
          i++;
          break;
        } else {
          break;
        }
      }
      elements.push(
        <ol key={`ol-${elementKey++}`} className="list-decimal list-inside space-y-1 mb-2 pl-2">
          {listItems.map((item, idx) => (
            <li key={`ol-li-${idx}`} className="text-sm text-foreground">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraphs
    elements.push(
      <p key={`p-${elementKey++}`} className="text-sm text-foreground mb-2 leading-relaxed">
        {parseInlineMarkdown(trimmed)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

/**
 * Parse inline markdown formatting: bold, italic, code
 */
function parseInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold (**text**)
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*(.*)$/);
    if (boldMatch) {
      parts.push(
        <strong key={`bold-${key++}`} className="font-bold text-foreground">
          {boldMatch[1]}
        </strong>
      );
      remaining = boldMatch[2];
      continue;
    }

    // Italic (*text*)
    const italicMatch = remaining.match(/^\*(.+?)\*(.*)$/);
    if (italicMatch) {
      parts.push(
        <em key={`italic-${key++}`} className="italic text-foreground">
          {italicMatch[1]}
        </em>
      );
      remaining = italicMatch[2];
      continue;
    }

    // Inline code (`text`)
    const codeMatch = remaining.match(/^`(.+?)`(.*)$/);
    if (codeMatch) {
      parts.push(
        <code key={`code-${key++}`} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">
          {codeMatch[1]}
        </code>
      );
      remaining = codeMatch[2];
      continue;
    }

    // Find next formatting marker
    const nextBold = remaining.indexOf('**');
    const nextItalic = remaining.indexOf('*');
    const nextCode = remaining.indexOf('`');

    let nextIndex = remaining.length;
    if (nextBold !== -1) nextIndex = Math.min(nextIndex, nextBold);
    if (nextItalic !== -1) nextIndex = Math.min(nextIndex, nextItalic);
    if (nextCode !== -1) nextIndex = Math.min(nextIndex, nextCode);

    if (nextIndex === remaining.length) {
      // No more formatting
      parts.push(<span key={`text-${key++}`}>{remaining}</span>);
      remaining = '';
    } else {
      // Add text up to next formatting
      parts.push(<span key={`text-${key++}`}>{remaining.substring(0, nextIndex)}</span>);
      remaining = remaining.substring(nextIndex);
    }
  }

  return parts.length === 0 ? text : parts;
}
