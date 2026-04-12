'use client';

import type { ReactNode } from 'react';
import { typography, colors } from '../../design';

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'em'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; value: string; href: string };

function parseInlineMarkdown(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      tokens.push({
        type: 'link',
        value: linkMatch[1],
        href: linkMatch[2],
      });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    const strongMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (strongMatch) {
      tokens.push({ type: 'strong', value: strongMatch[1] });
      remaining = remaining.slice(strongMatch[0].length);
      continue;
    }

    const emMatch = remaining.match(/^\*([^*]+)\*/);
    if (emMatch) {
      tokens.push({ type: 'em', value: emMatch[1] });
      remaining = remaining.slice(emMatch[0].length);
      continue;
    }

    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push({ type: 'code', value: codeMatch[1] });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    const nextSpecialIndex = (() => {
      const indices = [
        remaining.indexOf('['),
        remaining.indexOf('**'),
        remaining.indexOf('*'),
        remaining.indexOf('`'),
      ].filter((index) => index >= 0);

      return indices.length > 0 ? Math.min(...indices) : -1;
    })();

    if (nextSpecialIndex === -1) {
      tokens.push({ type: 'text', value: remaining });
      break;
    }

    if (nextSpecialIndex > 0) {
      tokens.push({ type: 'text', value: remaining.slice(0, nextSpecialIndex) });
      remaining = remaining.slice(nextSpecialIndex);
      continue;
    }

    tokens.push({ type: 'text', value: remaining[0] });
    remaining = remaining.slice(1);
  }

  return tokens;
}

function renderInlineTokens(text: string): ReactNode[] {
  return parseInlineMarkdown(text).map((token, index) => {
    switch (token.type) {
      case 'strong':
        return <strong key={index}>{token.value}</strong>;
      case 'em':
        return <em key={index}>{token.value}</em>;
      case 'code':
        return (
          <code
            key={index}
            className="rounded bg-black/30 px-1.5 py-0.5 text-[#ffb17a]"
          >
            {token.value}
          </code>
        );
      case 'link':
        return (
          <a
            key={index}
            href={token.href}
            target="_blank"
            rel="noreferrer"
            className="text-[#ff8a42] underline underline-offset-4"
          >
            {token.value}
          </a>
        );
      default:
        return <span key={index}>{token.value}</span>;
    }
  });
}

export function MeetingMarkdown({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(
      <p
        key={`paragraph-${blocks.length}`}
        style={{ ...typography.body.BodyM, color: colors.white[100] }}
        className="leading-7"
      >
        {renderInlineTokens(paragraph.join(' '))}
      </p>
    );
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul
        key={`list-${blocks.length}`}
        className="list-disc space-y-2 pl-5"
        style={{ ...typography.body.BodyM, color: colors.white[100] }}
      >
        {listItems.map((item, index) => (
          <li key={index}>{renderInlineTokens(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const sizeStyle =
        level <= 2 ? typography.body.BodyB : typography.label.labelB;

      blocks.push(
        <div
          key={`heading-${blocks.length}`}
          style={{ ...sizeStyle, color: colors.white[100] }}
          className="mt-1"
        >
          {renderInlineTokens(headingText)}
        </div>
      );
      return;
    }

    const listMatch = line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      listItems.push(listMatch[1]);
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();

  return <div className="space-y-3">{blocks}</div>;
}
