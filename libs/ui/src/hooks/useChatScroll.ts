'use client';

import { useEffect, useRef, useState } from 'react';

export const useChatScroll = <T>(items: T[]) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showNewMessageNotice, setShowNewMessageNotice] = useState(false);

  const isAtBottom = () => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  };

  const scrollToBottom = () => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // 새 아이템(메시지) 생길 때
  useEffect(() => {
    if (!containerRef.current) return;

    if (autoScroll) {
      scrollToBottom();
      setShowNewMessageNotice(false);
    } else {
      setShowNewMessageNotice(true);
    }
  }, [items, autoScroll]);

  // 초기 렌더링 시 맨 밑으로 스크롤
  useEffect(() => {
    scrollToBottom();
    setAutoScroll(true);
  }, []);

  const handleScroll = () => {
    const atBottom = isAtBottom();
    setAutoScroll(atBottom);
    if (atBottom) setShowNewMessageNotice(false);
  };

  return {
    containerRef,
    handleScroll,
    scrollToBottom,
    showNewMessageNotice,
  };
};
