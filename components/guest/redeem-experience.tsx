'use client';

import { AlertCircle, ArrowRight, Check, Copy, ExternalLink, Loader2, Mail, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import DemoBar from '@/components/demo-bar';
import { GiftCardVisual } from '@/components/gift-card';
import { photos } from '@/lib/images';

export interface GuestSettings {
  firmName: string;
  rewardBrand: string;
  amount: number;
  message: string;
  supportEmail: string;
  endsOn: string;
}

interface Gift {
  status: 'sent' | 'processing' | 'queued';
  returning: boolean;
  code: string;
  name: string;
  amount: number;
  brand: string;
  link: string | null;
}

type ErrorReason = 'invalid' | 'already_claimed' | 'rate_limited' | 'network' | 'ended' | 'paused' | 'budget';

function bodyFrom(value: string, prefix: string) {
  let raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (raw.startsWith(prefix) && raw.length > 8) raw = raw.slice(prefix.length);
  return raw.slice(0, 8);
}

const formatBody = (body: string) => (body.length > 4 ? `${body.slice(0, 4)}-${body.slice(4)}` : body);

export default function RedeemExperience({
  prefix,
  initialCode,
  source,
  preview,
  demoMode,
  settings,
}: {
  prefix: string;
  initialCode: string;
  source: 'email' | 'qr' | 'web';
  preview: 'success' | null;
  demoMode: boolean;
  settings: GuestSettings;
}) {
  const [body, setBody] = useState(() => bodyFrom(initialCode, prefix));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ reason: ErrorReason; claimedAt?: string } | null>(null);
  const [gift, setGift] = useState<Gift | null>(() =>
    preview === 'success'
      ? { status: 'sent', returning: false, code: `${prefix}-8K42-P9QR`, name: 'Linda', amount: settings.amount, brand: settings.rewardBrand, link: null }
      : null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCode) document.getElementById('redeem')?.scrollIntoView({ block: 'center' });
  }, [initialCode]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (busy) return;
    if (body.length < 8) {
      setError({ reason: 'invalid' });
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: `${prefix}-${body}`, src: source }),
      });
      const data = await res.json();
      if (data.ok) setGift(data as Gift);
      else setError({ reason: (data.reason as ErrorReason) ?? 'invalid', claimedAt: data.claimedAt });
    } catch {
      setError({ reason: 'network' });
    } finally {
      setBusy(false);
    }
  }

  function applyTestCode(code: string) {
    setBody(bodyFrom(code, prefix));
    setError(null);
    setGift(null);
    document.getElementById('redeem')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputRef.current?.focus();
  }

  return (
    <>
      <form
        id="redeem"
        onSubmit={submit}
        className="animate-rise rounded-[28px] border border-white/15 bg-white/[0.08] p-2 shadow-2xl shadow-black/20 backdrop-blur-2xl [animation-delay:200ms]"
      >
        <div className="rounded-[22px] bg-white p-5 sm:p-6">
          <label htmlFor="code" className="text-[13px] font-semibold text-pine-900">
            Your gift code
          </label>
          <p className="mt-0.5 text-[13px] text-pine-900/55">Printed on your postcard or in our holiday email.</p>

          <div
            className={`mt-4 flex items-center rounded-2xl border bg-cream/60 transition focus-within:border-pine-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-pine-500/10 ${
              error ? 'border-berry-400' : 'border-pine-900/10'
            }`}
          >
            <span className="select-none py-4 pl-4 pr-1 font-mono text-lg font-medium tracking-[0.12em] text-pine-900/40 sm:text-xl">
              {prefix}-
            </span>
            <input
              ref={inputRef}
              id="code"
              name="code"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="XXXX-XXXX"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'code-error' : undefined}
              value={formatBody(body)}
              onChange={(e) => {
                setBody(bodyFrom(e.target.value, prefix));
                if (error) setError(null);
              }}
              className="w-full min-w-0 bg-transparent py-4 pr-4 font-mono text-lg font-medium tracking-[0.12em] text-pine-950 outline-none placeholder:text-pine-900/25 sm:text-xl"
            />
          </div>

          {error && <InlineError reason={error.reason} claimedAt={error.claimedAt} supportEmail={settings.supportEmail} />}

          <button
            type="submit"
            disabled={busy}
            className="group mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-berry-500 px-5 py-4 text-[15px] font-semibold text-white shadow-lg shadow-berry-500/25 transition hover:bg-berry-600 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Unwrapping your gift…
              </>
            ) : (
              <>
                Unlock my ${settings.amount} gift card
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[12px] text-pine-900/45">
            One code per guest · Codes never use 0, O, 1 or I
          </p>
        </div>
      </form>

      {gift && <GiftReveal gift={gift} settings={settings} onClose={() => setGift(null)} />}
      {demoMode && <DemoBar onTestCode={applyTestCode} />}
    </>
  );
}

function InlineError({ reason, claimedAt, supportEmail }: { reason: ErrorReason; claimedAt?: string; supportEmail: string }) {
  const when = claimedAt
    ? new Date(claimedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : 'an earlier date';
  const copy: Record<ErrorReason, string> = {
    invalid: "We couldn't find that code. Check each character and try again.",
    already_claimed: `This code was already used on ${when}. If that wasn't you, email ${supportEmail} and we'll sort it out.`,
    rate_limited: 'Too many tries from this device. For security, please wait a few minutes and try again.',
    network: "We couldn't reach the server. Check your connection and try again.",
    ended: 'This holiday offer has ended. Thank you for being part of our year.',
    paused: 'Gift redemption is paused for a moment. Please try again a little later.',
    budget: `All holiday gifts have been claimed. Please email ${supportEmail} if you have questions.`,
  };
  return (
    <div
      id="code-error"
      role="alert"
      className="mt-3 flex gap-2.5 rounded-xl bg-berry-500/[0.07] px-3.5 py-3 text-[13px] leading-relaxed text-berry-700"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <p>{copy[reason]}</p>
    </div>
  );
}

const CONFETTI_COLORS = ['#e9d29a', '#c9a24a', '#ffffff', '#c0353f', '#8cb9a1', '#f3e5bf'];

function GiftReveal({ gift, settings, onClose }: { gift: Gift; settings: GuestSettings; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const ready = gift.status === 'sent';
  const href = gift.link ?? (ready ? '/gift/demo-preview' : null);
  const absolute = typeof window !== 'undefined' && href ? new URL(href, window.location.origin).toString() : href ?? '';

  const confetti = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: `${(i % 14) * 0.08}s`,
        dur: `${2.6 + (i % 7) * 0.25}s`,
        drift: `${((i * 53) % 120) - 60}px`,
        spin: `${360 + ((i * 97) % 540)}deg`,
      })),
    [],
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the link is still on screen via the button */
    }
  }

  const mailto = `mailto:?subject=${encodeURIComponent(`My $${gift.amount} ${gift.brand} eGift`)}&body=${encodeURIComponent(
    `Here's my holiday eGift from ${settings.firmName}:\n${absolute}`,
  )}`;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="reveal-title" className="fixed inset-0 z-50 overflow-y-auto">
      <Image src={photos.treeLights.src} alt="" fill priority placeholder="blur" sizes="100vw" className="object-cover" />
      <div className="fixed inset-0 bg-gradient-to-b from-pine-950/80 via-pine-950/85 to-pine-950/95" />
      {!gift.returning && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
          {confetti.map((c, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={
                {
                  left: c.left,
                  background: c.color,
                  '--delay': c.delay,
                  '--dur': c.dur,
                  '--drift': c.drift,
                  '--spin': c.spin,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
      >
        <X className="size-5" />
      </button>

      <div className="relative mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-5 py-16 text-center text-white">
        <p className="animate-rise text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-300">
          {gift.returning ? 'Welcome back' : gift.name ? `Merry Christmas, ${gift.name}` : 'Merry Christmas'}
        </p>
        <h2 id="reveal-title" className="mt-3 animate-rise font-display text-5xl leading-[1.05] [animation-delay:120ms] sm:text-6xl">
          {ready ? (
            <>
              Your gift is <em className="text-gold-300">ready.</em>
            </>
          ) : (
            <>
              Your gift is <em className="text-gold-300">on its way.</em>
            </>
          )}
        </h2>

        <div className="mt-10 w-full max-w-[420px] animate-card-in [animation-delay:250ms]">
          <GiftCardVisual amount={gift.amount} brand={gift.brand} from={settings.firmName} state={ready ? 'ready' : 'preparing'} />
        </div>

        <div className="mt-10 w-full max-w-[420px] animate-rise space-y-3 [animation-delay:700ms]">
          {ready && href ? (
            <>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-[15px] font-semibold text-pine-950 shadow-xl transition hover:bg-gold-200"
              >
                Open my {gift.brand} eGift <ExternalLink className="size-4" />
              </a>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15"
                >
                  {copied ? <Check className="size-4 text-gold-300" /> : <Copy className="size-4" />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
                <a
                  href={mailto}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15"
                >
                  <Mail className="size-4" /> Email it to me
                </a>
              </div>
              <p className="pt-2 text-[13px] leading-relaxed text-white/60">
                Lost this page? Enter your code again on this device and your gift will be right here.
              </p>
            </>
          ) : (
            <p className="text-[15px] leading-relaxed text-white/75">
              We&rsquo;re preparing your gift card now. It usually takes a minute. Enter your code again shortly and it will
              open right here.
            </p>
          )}
        </div>

        <figure className="mt-12 max-w-md animate-rise border-t border-white/10 pt-8 [animation-delay:900ms]">
          <blockquote className="font-display text-xl italic leading-relaxed text-white/85">&ldquo;{settings.message}&rdquo;</blockquote>
          <figcaption className="mt-3 text-[13px] text-white/50">Everyone at {settings.firmName}</figcaption>
        </figure>
      </div>
    </div>
  );
}
