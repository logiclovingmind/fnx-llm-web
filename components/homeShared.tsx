import { BRAND } from '@/lib/scenes';

export const waHref = `https://wa.me/${BRAND.waNumber}?text=${encodeURIComponent(BRAND.waMessage)}`;
export const callHref = `tel:${BRAND.callNumber}`;

export const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M5.2 2.5 6.6 5.3a1 1 0 0 1-.23 1.18l-1 .86a8.5 8.5 0 0 0 3.1 3.1l.86-1a1 1 0 0 1 1.18-.23l2.8 1.4a1 1 0 0 1 .54 1.02 2.6 2.6 0 0 1-2.6 2.27A9.7 9.7 0 0 1 2.3 5.06 2.6 2.6 0 0 1 4.57 2.46a1 1 0 0 1 .63.04Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

export const LANGS = [
  { flag: 'English', q: 'Still available? Can I see it Saturday?', a: 'Yes! Saturday 11 or 2. Shall I keep a slot?' },
  { flag: 'Hinglish', q: 'Abhi khali hai kya? Saturday dekhne aau?', a: 'Ji bilkul! Saturday 11 ya 2 baje aa jaiye.' },
  { flag: 'Gujarati', q: 'Haji male chhe? Saturday jova aavu?', a: 'Ha chokkas! Saturday 11 ke bapore 2 vagye aavo.' },
];
