import Reveal from '@/components/Reveal';
import TypingChat from '@/components/TypingChat';
import SheetSync from '@/components/SheetSync';
import CalendarBook from '@/components/CalendarBook';
import Dashboard from '@/components/Dashboard';
import FlowLine from '@/components/FlowLine';
import Stats from '@/components/Stats';
import { waHref, callHref, PhoneIcon, ArrowRight } from '@/components/homeShared';
import { BRAND } from '@/lib/scenes';

export default function DesktopHome() {
  return (
    <>
      <div className="flow">
        <FlowLine />
        {/* HERO */}
        <section className="hero">
          <div className="wrap">
            <div className="copy">
              <span className="eyebrow">An AI that answers your buyers for you</span>
              <h1>
                Never lose a buyer to a <em className="accent accent--slow">slow reply</em> again.
              </h1>
              <p className="sub">
                An AI that answers every message in seconds, in your buyer’s own
                language, and books the visit.
              </p>
              <div className="trust">
                <span className="dot" />
                <b>Replies in ~4s</b>
                <span className="sep">·</span>
                <b>24/7</b>
                <span className="sep">·</span>
                English, Hindi &amp; Gujarati
              </div>
              <div className="cta-row hero-cta">
                <a className="btn btn-primary" href={waHref} target="_blank" rel="noopener noreferrer">
                  <span className="btn-label">{BRAND.cta}</span>
                </a>
                <a className="btn btn-ghost" href="#how">
                  See how it works <ArrowRight />
                </a>
              </div>
            </div>

            <img className="hero-person" src="/agent.png" alt="" />
            <TypingChat />
          </div>
        </section>

        {/* AUTOMATION — one connected flow: chat → sheet → calendar → dashboard */}
        <section id="how" className="band pipeline">
          <div className="wrap">
            <Reveal className="sec-head sec-head--center">
              <h2>
                Every message, <em className="accent accent--auto">handled for you</em>.
              </h2>
            </Reveal>

            <div className="pipeline-flow">
              <Reveal className="stage">
                <div className="stage-tag">
                  The details save themselves
                </div>
                <SheetSync />
              </Reveal>

              <Reveal className="stage" delay={80}>
                <div className="stage-tag">
                  The viewing books itself
                </div>
                <CalendarBook />
              </Reveal>

              <Reveal className="stage" delay={80}>
                <div className="stage-tag">
                  Everything in one place
                </div>
                <Dashboard />
              </Reveal>
            </div>
          </div>
        </section>
      </div>

      {/* PROOF — multilingual is already shown live by the hero chat, so this is a
          quiet stats strip instead of a repeated language-card grid */}
      <Reveal as="section" className="band tint band--tight">
        <div className="wrap">
          <Stats />
        </div>
      </Reveal>

      {/* FINAL CTA */}
      <Reveal as="section" className="final">
        <div className="wrap">
          <span className="eyebrow" style={{ justifyContent: 'center' }}>The result</span>
          <h2>
            Your buyers, <em className="accent accent--engine">always answered</em>.
          </h2>
          <p className="sub">
            Answer every buyer while you sleep.
            <br />
            Free demo, no commitment.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href={waHref} target="_blank" rel="noopener noreferrer">
              <span className="btn-label">{BRAND.cta}</span>
            </a>
            <a className="btn btn-ghost" href={callHref}>
              <PhoneIcon /> {BRAND.callCta}
            </a>
          </div>
        </div>
      </Reveal>
    </>
  );
}
