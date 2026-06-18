export type Scene = {
  id: string;
  /** scroll-progress window over which this beat is visible (flat-top fade) */
  a: number;
  b: number;
  kicker: string;
  /** headline HTML — <b> renders as a gold accent, <br/> for line breaks */
  titleHtml: string;
  body: string;
  /** lift the copy above the AI core when the orb shares this beat */
  lift?: boolean;
};

/**
 * Six narrative beats mapped onto the continuous scroll journey, ported 1:1
 * from the standalone index.html.
 * CHAOS -> CONTROL -> AUTOMATION -> SCALE
 */
export const SCENES: Scene[] = [
  {
    id: 'storm',
    a: -0.06,
    b: 0.15,
    kicker: 'The Flood',
    titleHtml: 'Buyers never<br/>stop <b>messaging</b>.',
    body: 'Enquiries pour in day and night across WhatsApp, Instagram and your forms. No team can answer them all, fast.',
  },
  {
    id: 'leak',
    a: 0.18,
    b: 0.3,
    kicker: 'The Cost',
    titleHtml: 'A slow reply is<br/>a deal, <b>lost</b>.',
    body: 'Most buyers go cold within five minutes. The one left waiting simply messages the next agent who answers.',
  },
  {
    id: 'core',
    a: 0.33,
    b: 0.45,
    kicker: 'The Answer',
    titleHtml: 'One AI. <b>Always on</b>.',
    body: 'Trained on your listings, pricing and tone, it replies to every buyer in seconds, day or night.',
  },
  {
    id: 'limits',
    a: 0.56,
    b: 0.68,
    kicker: 'Human vs. Machine',
    titleHtml: 'Your AI does<br/><b>none of that</b>.',
    body: 'It never sleeps, never eats, never panics. No off days, no bad days, no missed messages. Every lead answered, always.',
  },
  {
    id: 'transform',
    a: 0.69,
    b: 0.78,
    kicker: 'What It Does',
    titleHtml: "It doesn't just reply.<br/>It <b>closes</b>.",
    body: 'It qualifies the lead, answers the questions, books the viewing, follows up, and routes hot buyers straight to you.',
    lift: true,
  },
  {
    id: 'scale',
    a: 0.80,
    b: 0.88,
    kicker: 'At Any Volume',
    titleHtml: 'Ten chats or<br/><b>ten thousand</b>.',
    body: "The same instant, personal reply, whether it's a quiet Tuesday or a launch-day flood of enquiries.",
    lift: true,
  },
  {
    id: 'skyline',
    a: 0.89,
    b: 1.01,
    kicker: 'The Outcome',
    titleHtml: 'Your always-on<br/><b>lead engine</b>.',
    body: 'Logic Loving Mind captures and converts every enquiry while you sleep. Own your market.',
    lift: true,
  },
];

export const BRAND = {
  name: 'Logic Loving Mind',
  cta: 'Chat on WhatsApp',
  // WhatsApp business number, country code first, digits only (no + or spaces).
  // TODO: replace with the real number before launch.
  waNumber: '910000000000',
  waMessage:
    'Hi Logic Loving Mind, I want to automate my real-estate lead capture.',
};
