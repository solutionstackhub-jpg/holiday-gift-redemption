import { ChevronDown, Clock, Coffee, Gift, Mail, QrCode, ShieldCheck, Smartphone, Sparkles, Zap } from 'lucide-react';
import Image from 'next/image';
import { BrandMark, Monogram } from '@/components/brand';
import DemoBar from '@/components/demo-bar';
import { GiftCardVisual } from '@/components/gift-card';
import RedeemExperience from '@/components/guest/redeem-experience';
import { config } from '@/lib/config';
import { photos } from '@/lib/images';
import { campaignEnded, formatEndDate } from '@/lib/settings';
import { getStore } from '@/lib/store';
import { loadSettings } from '@/lib/demo-state';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function GuestPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const settings = await loadSettings(getStore());
  const code = typeof sp.code === 'string' ? sp.code.slice(0, 40) : '';
  const source = sp.src === 'email' || sp.src === 'qr' ? sp.src : 'web';
  const preview = config.demoMode && sp.preview === 'success' ? 'success' : null;
  const closed = !settings.active ? 'paused' : campaignEnded(settings) ? 'ended' : null;
  const endsOn = formatEndDate(settings);
  const amount = `$${settings.amount}`;

  const steps = [
    {
      photo: photos.postcard,
      icon: Mail,
      title: 'Find your code',
      text: 'It’s printed on your holiday postcard and included in our holiday email.',
    },
    {
      photo: photos.phoneEmail,
      icon: QrCode,
      title: 'Scan or type it',
      text: 'Scan the QR code on your card, tap the button in the email, or type the code above.',
    },
    {
      photo: photos.latteArt,
      icon: Coffee,
      title: 'Enjoy your coffee',
      text: `Your ${amount} ${settings.rewardBrand} eGift appears instantly. Use it in store or in the app.`,
    },
  ];

  const faqs = [
    {
      q: 'Where do I find my code?',
      a: `On the back of the holiday postcard we mailed you, or in the holiday email from ${settings.firmName}. It looks like ${config.codePrefix}-XXXX-XXXX.`,
    },
    {
      q: 'How do I use my eGift?',
      a: `Tap “Open my ${settings.rewardBrand} eGift” after unlocking it. You can show it at the register or add it to the ${settings.rewardBrand} app.`,
    },
    {
      q: 'I closed the page. Is my gift lost?',
      a: 'No. Enter your code again on the same phone or computer and your gift will appear right where you left it.',
    },
    {
      q: 'Can I share my code?',
      a: 'Each code is personal and works once. Please keep it to yourself, like you would a gift card.',
    },
    {
      q: 'When does the offer end?',
      a: `Codes can be redeemed until ${endsOn}.`,
    },
  ];

  return (
    <div className="bg-cream">
      {/* ───────────── Hero ───────────── */}
      <section className="relative isolate min-h-[100svh] overflow-hidden bg-pine-950">
        <Image
          src={photos.heroCoffee.src}
          alt={photos.heroCoffee.alt}
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="-z-20 -scale-x-100 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-pine-950/95 via-pine-950/75 to-pine-950/20" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-pine-950/70 to-transparent" />
        <div className="snow -z-10 opacity-60" />

        <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
          <BrandMark name={settings.firmName} />
          <nav className="flex items-center gap-1 text-sm text-white/80">
            <a href="#how" className="hidden rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white sm:block">
              How it works
            </a>
            <a href="#faq" className="hidden rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white sm:block">
              Questions
            </a>
            <a
              href={`mailto:${settings.supportEmail}`}
              className="rounded-full bg-white/10 px-4 py-2 font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
            >
              Need help?
            </a>
          </nav>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-14">
          <div className="max-w-xl">
            <p className="inline-flex animate-rise items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[12px] font-medium tracking-wide text-gold-200 ring-1 ring-white/15 backdrop-blur">
              <Sparkles className="size-3.5" /> A holiday thank-you from {settings.firmName}
            </p>
            <h1 className="mt-6 animate-rise font-display text-[54px] leading-[0.98] tracking-[-0.01em] text-white [animation-delay:80ms] sm:text-7xl lg:text-[84px]">
              {settings.headline.replace(/[.!]$/, '')}
              <span className="text-gold-300">.</span>
            </h1>
            <p className="mt-6 max-w-md animate-rise text-lg leading-relaxed text-white/75 [animation-delay:140ms]">
              Enter the code from your holiday card to unlock a{' '}
              <strong className="font-semibold text-white">
                {amount} {settings.rewardBrand} eGift
              </strong>
              . It takes about ten seconds.
            </p>

            <div className="mt-9 max-w-md">
              {closed ? (
                <>
                  <ClosedNotice reason={closed} firmName={settings.firmName} supportEmail={settings.supportEmail} />
                  {config.demoMode && <DemoBar />}
                </>
              ) : (
                <RedeemExperience
                  prefix={config.codePrefix}
                  initialCode={code}
                  source={source}
                  preview={preview}
                  demoMode={config.demoMode}
                  settings={{
                    firmName: settings.firmName,
                    rewardBrand: settings.rewardBrand,
                    amount: settings.amount,
                    message: settings.message,
                    supportEmail: settings.supportEmail,
                    endsOn,
                  }}
                />
              )}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-10 rounded-full bg-gold-300/10 blur-3xl" />
            <div className="relative ml-auto w-[440px] rotate-[-6deg] animate-card-in [animation-delay:350ms]">
              <GiftCardVisual amount={settings.amount} brand={settings.rewardBrand} from={settings.firmName} />
            </div>
            <div className="relative ml-auto mr-10 mt-8 w-fit rotate-[2deg] animate-rise rounded-2xl bg-white/95 px-4 py-3 shadow-2xl [animation-delay:800ms]">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-pine-900">
                <Zap className="size-4 text-gold-500" /> Delivered instantly
              </p>
              <p className="text-[12px] text-pine-900/55">No app or sign-up needed</p>
            </div>
          </div>
        </div>

        <a
          href="#how"
          aria-label="Scroll to how it works"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-white/60 transition hover:text-white sm:block"
        >
          <ChevronDown className="size-6 animate-bounce" />
        </a>
      </section>

      {/* ───────────── Trust strip ───────────── */}
      <section className="border-b border-pine-900/5 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:grid-cols-3 sm:px-8">
          {[
            { icon: ShieldCheck, title: 'Your personal code', text: 'Unique to you and works once' },
            { icon: Zap, title: 'Instant delivery', text: 'Your eGift opens right on the page' },
            { icon: Smartphone, title: 'Made for your phone', text: 'Scan, tap, done. No account needed' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-pine-50 text-pine-700">
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-pine-950">{title}</p>
                <p className="text-sm text-pine-900/55">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── How it works ───────────── */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-10 px-5 py-24 sm:px-8 lg:py-32">
        <div className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-berry-500">How it works</p>
          <h2 className="mt-4 font-display text-5xl leading-[1.05] text-pine-950 sm:text-6xl">
            Three small steps to a <em className="text-pine-600">warm cup.</em>
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map(({ photo, icon: Icon, title, text }, i) => (
            <article
              key={title}
              className="group overflow-hidden rounded-[28px] bg-white shadow-[0_1px_0_rgba(11,28,22,0.04),0_20px_50px_-30px_rgba(11,28,22,0.35)] ring-1 ring-pine-900/5"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  placeholder="blur"
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 grid size-9 place-items-center rounded-full bg-white/90 font-display text-lg text-pine-900 backdrop-blur">
                  {i + 1}
                </span>
              </div>
              <div className="p-7">
                <Icon className="size-5 text-berry-500" strokeWidth={1.8} />
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-pine-950">{title}</h3>
                <p className="mt-2 leading-relaxed text-pine-900/60">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ───────────── Note from the firm ───────────── */}
      <section className="bg-sand">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-32">
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] shadow-2xl shadow-pine-950/20">
              <Image
                src={photos.winterHands.src}
                alt={photos.winterHands.alt}
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-[30%_50%]"
              />
            </div>
            <div className="absolute -bottom-8 -right-4 hidden w-56 overflow-hidden rounded-3xl border-[6px] border-sand shadow-xl sm:block lg:-right-10">
              <div className="relative aspect-square">
                <Image src={photos.thankYou.src} alt={photos.thankYou.alt} fill placeholder="blur" sizes="224px" className="object-cover object-[72%_35%]" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-berry-500">A note from us</p>
            <blockquote className="mt-6 font-display text-4xl leading-[1.2] text-pine-950 sm:text-[44px]">
              &ldquo;{settings.message}&rdquo;
            </blockquote>
            <div className="mt-8 flex items-center gap-3">
              <Monogram name={settings.firmName} tone="dark" />
              <div>
                <p className="font-semibold text-pine-950">Everyone at {settings.firmName}</p>
                <p className="text-sm text-pine-900/55">Happy holidays to you and your family</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── The gift ───────────── */}
      <section className="relative isolate overflow-hidden bg-pine-950 text-white">
        <Image
          src={photos.coffeeShop.src}
          alt=""
          fill
          placeholder="blur"
          sizes="100vw"
          className="-z-20 object-cover opacity-50"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-pine-950 via-pine-950/85 to-pine-950/40" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:py-32">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-gold-300">Your gift</p>
            <h2 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl">
              {amount} at {settings.rewardBrand},<br />
              <em className="text-gold-300">on us.</em>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/70">
              A digital gift card for your next coffee, hot chocolate or holiday treat. Open it on your phone and use it
              like any other {settings.rewardBrand} card.
            </p>
          </div>
          <ul className="grid gap-4 self-end sm:grid-cols-2">
            {[
              { icon: Gift, title: 'One gift per client', text: 'Your code is linked to you personally.' },
              { icon: Smartphone, title: 'In store or in app', text: 'Show it at the register or add it to the app.' },
              { icon: Clock, title: `Redeem by ${endsOn}`, text: 'Unlock it any time before the offer ends.' },
              { icon: ShieldCheck, title: 'Safe and private', text: 'We never ask for card or bank details.' },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur">
                <Icon className="size-5 text-gold-300" strokeWidth={1.8} />
                <p className="mt-4 font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/60">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section id="faq" className="mx-auto grid max-w-7xl scroll-mt-10 gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-32">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-berry-500">Questions</p>
          <h2 className="mt-4 font-display text-5xl leading-[1.05] text-pine-950">Good to know.</h2>
          <div className="relative mt-10 aspect-[5/4] overflow-hidden rounded-[28px]">
            <Image
              src={photos.cookiesCoffee.src}
              alt={photos.cookiesCoffee.alt}
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="divide-y divide-pine-900/10 border-y border-pine-900/10 self-center">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group py-6">
              <summary className="flex cursor-pointer items-center justify-between gap-6 text-lg font-semibold tracking-tight text-pine-950">
                {q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pine-50 text-pine-700 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-xl leading-relaxed text-pine-900/65">{a}</p>
            </details>
          ))}
          <p className="py-6 text-pine-900/65">
            Still stuck?{' '}
            <a href={`mailto:${settings.supportEmail}`} className="font-semibold text-pine-700 underline underline-offset-4">
              {settings.supportEmail}
            </a>
          </p>
        </div>
      </section>

      {/* ───────────── Closing band ───────────── */}
      <section className="px-5 pb-24 sm:px-8">
        <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-pine-900 px-8 py-20 text-center sm:px-16">
          <Image
            src={photos.heroGift.src}
            alt=""
            fill
            placeholder="blur"
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="-z-20 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-pine-950/70" />
          <h2 className="font-display text-5xl leading-tight text-white sm:text-6xl">Have your card handy?</h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-white/70">Your gift is one code away.</p>
          <a
            href="#redeem"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-semibold text-pine-950 shadow-xl transition hover:bg-gold-200"
          >
            <Gift className="size-4" /> Enter my code
          </a>
        </div>
      </section>

      {/* ───────────── Footer ───────────── */}
      <footer className="relative isolate overflow-hidden bg-pine-950 text-white/60">
        <Image src={photos.pineTexture.src} alt="" fill placeholder="blur" sizes="100vw" className="-z-20 object-cover opacity-25" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-950 to-pine-950/80" />
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-14 sm:px-8 md:flex-row md:items-end md:justify-between">
          <div>
            <BrandMark name={settings.firmName} />
            <p className="mt-4 max-w-md text-sm leading-relaxed">
              A holiday thank-you for our clients. Questions? Email{' '}
              <a href={`mailto:${settings.supportEmail}`} className="text-white underline underline-offset-4">
                {settings.supportEmail}
              </a>
              .
            </p>
          </div>
          <p className="max-w-md text-[12px] leading-relaxed text-white/40">
            Offer valid through {endsOn} while supplies last. One gift per code. {settings.rewardBrand} is a registered
            trademark of its owner, which is not a sponsor of this promotion.
          </p>
        </div>
      </footer>
    </div>
  );
}

function ClosedNotice({ reason, firmName, supportEmail }: { reason: 'ended' | 'paused'; firmName: string; supportEmail: string }) {
  return (
    <div className="overflow-hidden rounded-[28px] bg-white shadow-2xl">
      <div className="relative h-36">
        <Image src={photos.snowWindow.src} alt={photos.snowWindow.alt} fill placeholder="blur" sizes="448px" className="object-cover" />
      </div>
      <div className="p-6">
        <h2 className="font-display text-3xl text-pine-950">
          {reason === 'ended' ? 'This holiday offer has ended.' : 'We’ll be right back.'}
        </h2>
        <p className="mt-2 leading-relaxed text-pine-900/60">
          {reason === 'ended'
            ? `Thank you for being part of our year. Warm wishes from everyone at ${firmName}.`
            : 'Gift redemption is paused for a moment. Please check back a little later.'}
        </p>
        <a href={`mailto:${supportEmail}`} className="mt-4 inline-block text-sm font-semibold text-pine-700 underline underline-offset-4">
          Contact {supportEmail}
        </a>
      </div>
    </div>
  );
}
