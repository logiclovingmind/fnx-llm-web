'use client';

import { useEffect, useId, useState } from 'react';

// One buyer intent — "is it available, can I view Saturday?" — arriving the three
// ways a real Indian agency fields it: English, Hinglish, and Gujarati in Latin
// script. The AI answers in the buyer's own language: the multilingual proof.
const CHATS: { q: string; a: string; ch: 'wa' | 'ig' }[] = [
  {
    ch: 'wa',
    q: 'Hi, saw your 3 BHK in Bandra. Still available? Can I come see it Saturday?',
    a: "Yes, still up! I'm free Saturday 11 or 2, whichever suits you. Shall I keep a slot?",
  },
  {
    ch: 'ig',
    q: 'Namaste, Dwarka wala 3 BHK abhi khali hai kya? Saturday ko dekhne aa sakta hu?',
    a: 'Ji bilkul! Saturday ko 11 ya 2 baje aa jaiye, jo time theek lage bata dijiye, main rakh leta hu.',
  },
  {
    ch: 'wa',
    q: 'Namaste, Bopal no 3 BHK haji male chhe? Saturday e jova aavu to chale?',
    a: 'Ha chokkas! Saturday e 11 vagye ke bapore 2 vagye aavo, tamne fave e time kaho, hu rakhi laun.',
  },
];

const WaIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="#25D366" aria-label="WhatsApp">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.82c2.16 0 4.18.84 5.71 2.37a8.04 8.04 0 0 1 2.37 5.72c0 4.46-3.63 8.09-8.09 8.09a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.07.81.82-3-.19-.31a8.04 8.04 0 0 1-1.24-4.3c0-4.46 3.63-8.09 8.09-8.09Zm-3.7 4.32c-.18 0-.46.07-.7.33-.24.26-.92.9-.92 2.2s.94 2.56 1.07 2.73c.13.18 1.85 2.83 4.49 3.97.63.27 1.11.43 1.49.55.63.2 1.2.17 1.65.1.5-.07 1.55-.63 1.77-1.25.22-.61.22-1.14.15-1.25-.07-.11-.24-.18-.5-.31-.26-.13-1.55-.76-1.79-.85-.24-.09-.41-.13-.59.13-.18.26-.67.85-.83 1.03-.15.18-.31.2-.57.07-.26-.13-1.1-.41-2.1-1.29-.78-.69-1.3-1.55-1.45-1.81-.15-.26-.02-.4.11-.53.12-.12.26-.31.39-.46.13-.16.18-.27.26-.44.09-.18.04-.33-.02-.46-.07-.13-.59-1.42-.8-1.94-.21-.51-.43-.44-.59-.45-.15-.01-.33-.01-.5-.01Z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
    <path d="M4 11.5 20 4l-7.5 16-2.2-6.3L4 11.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const IgIcon = () => {
  // unique per instance — TypingChat renders in both the desktop and mobile
  // views, so a shared gradient id would collide (and the desktop copy lives in
  // a display:none subtree, making its paint server unavailable on mobile)
  const gid = useId();
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={`url(#${gid})`} strokeWidth="2" aria-label="Instagram">
      <defs>
        <linearGradient id={gid} x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#feda75" />
          <stop offset="0.35" stopColor="#fa7e1e" />
          <stop offset="0.6" stopColor="#d62976" />
          <stop offset="0.85" stopColor="#962fbf" />
          <stop offset="1" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.2" fill={`url(#${gid})`} stroke="none" />
    </svg>
  );
};

export default function TypingChat() {
  const [lang, setLang] = useState(0);
  const [phase, setPhase] = useState<0 | 1 | 2>(0); // 0 question, 1 typing, 2 reply

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 750);
    const t2 = setTimeout(() => setPhase(2), 2150);
    const t3 = setTimeout(() => setLang((l) => (l + 1) % CHATS.length), 5400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [lang]);

  const c = CHATS[lang];

  return (
    <>
    {/* the animated card is decorative; this gives screen readers and search
        engines the real proof — that the AI replies in the buyer's own language */}
    <div className="sr-only">
      <p>
        See how the AI replies to a property buyer in their own language, within
        seconds, on WhatsApp and Instagram:
      </p>
      <ul>
        {CHATS.map((chat, i) => (
          <li key={i}>
            <span>Buyer: {chat.q}</span> <span>AI: {chat.a}</span>
          </li>
        ))}
      </ul>
    </div>

    <div className="chat" aria-hidden>
      <div className="chat-top">
        <span className="chat-av">
          <span className={`av-ico ${c.ch === 'wa' ? 'on' : ''}`}>
            <WaIcon />
          </span>
          <span className={`av-ico ${c.ch === 'ig' ? 'on' : ''}`}>
            <IgIcon />
          </span>
        </span>
        <div>
          <div className="who">Real Estate AI</div>
          <div className="stat">
            <i />
            online · replies in seconds
          </div>
        </div>
      </div>

      <div className="chat-body">
        <div className="row in">
          <div key={'q' + lang} className="bubble in pop">
            {c.q}
          </div>
        </div>

        {phase === 1 && (
          <div className="row out">
            <span className="typing pop">
              <i />
              <i />
              <i />
            </span>
          </div>
        )}

        {phase === 2 && (
          <>
            <div className="row out">
              <div key={'a' + lang} className="bubble out pop">
                {c.a}
              </div>
            </div>
            <div className="chat-cap">Replied in 4s · any language</div>
          </>
        )}
      </div>

      <div className="chat-input">
        <span className="ci-field">Type a message…</span>
        <span className="ci-send">
          <SendIcon />
        </span>
      </div>
    </div>
    </>
  );
}
