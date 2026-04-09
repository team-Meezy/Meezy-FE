'use client';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

type ConsoleLike = Record<ConsoleMethod, (...args: unknown[]) => void>;

declare global {
  interface Window {
    __MEEZY_ORIGINAL_CONSOLE__?: ConsoleLike;
    __MEEZY_CONSOLE_SILENCED__?: boolean;
  }
}

const NOOP = () => {};

function getOriginalConsole(): ConsoleLike | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!window.__MEEZY_ORIGINAL_CONSOLE__) {
    window.__MEEZY_ORIGINAL_CONSOLE__ = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };
  }

  return window.__MEEZY_ORIGINAL_CONSOLE__;
}

export function silenceBrowserConsole() {
  if (typeof window === 'undefined' || window.__MEEZY_CONSOLE_SILENCED__) {
    return;
  }

  getOriginalConsole();

  console.log = NOOP;
  console.info = NOOP;
  console.warn = NOOP;
  console.error = NOOP;
  console.debug = NOOP;

  window.__MEEZY_CONSOLE_SILENCED__ = true;
}

export function logRecordingUpload(
  status: 'request' | 'success' | 'error' | 'skipped',
  payload?: unknown
) {
  const originalConsole = getOriginalConsole();

  if (!originalConsole) {
    return;
  }

  const prefix = `[Meeting Recording Upload] ${status}`;

  if (status === 'error') {
    originalConsole.error(prefix, payload);
    return;
  }

  originalConsole.log(prefix, payload);
}

export function logRecordingVoice(
  status: 'speaking' | 'silent',
  payload?: unknown
) {
  const originalConsole = getOriginalConsole();

  if (!originalConsole) {
    return;
  }

  originalConsole.log(`[Meeting Recording Voice] ${status}`, payload);
}

export function logMeetingParticipation(
  kind: 'voice' | 'chat',
  status: 'send' | 'queued',
  payload?: unknown
) {
  const originalConsole = getOriginalConsole();

  if (!originalConsole) {
    return;
  }

  originalConsole.log(`[Meeting Participation ${kind}] ${status}`, payload);
}

export function logMeetingStomp(
  status: 'connect' | 'connected' | 'queue' | 'flush' | 'send' | 'close' | 'disconnect',
  payload?: unknown
) {
  const originalConsole = getOriginalConsole();

  if (!originalConsole) {
    return;
  }

  originalConsole.log(`[Meeting STOMP] ${status}`, payload);
}
