import type { StaticImageData } from 'next/image';
import coffeeShop from '@/public/images/coffee-shop.jpg';
import cookiesCoffee from '@/public/images/cookies-coffee.jpg';
import deskCards from '@/public/images/desk-cards.jpg';
import heroCoffee from '@/public/images/hero-coffee.jpg';
import heroGift from '@/public/images/hero-gift.jpg';
import latteArt from '@/public/images/latte-art.jpg';
import ornaments from '@/public/images/ornaments.jpg';
import phoneEmail from '@/public/images/phone-email.jpg';
import pineTexture from '@/public/images/pine-texture.jpg';
import postcard from '@/public/images/postcard.jpg';
import snowWindow from '@/public/images/snow-window.jpg';
import thankYou from '@/public/images/thank-you.jpg';
import treeLights from '@/public/images/tree-lights.jpg';
import winterHands from '@/public/images/winter-hands.jpg';

export interface Photo {
  src: StaticImageData;
  alt: string;
}

// Unsplash photos (see public/images/CREDITS.md). Static imports give Next.js the size
// and a blur placeholder, so pages don't jump while images load.
export const photos = {
  heroCoffee: { src: heroCoffee, alt: 'A mug of latte with pine and holiday berries on a dark wooden table' },
  heroGift: { src: heroGift, alt: 'A gold gift box tied with twine among festive confetti' },
  postcard: { src: postcard, alt: 'Kraft envelopes, twine and warm string lights ready for holiday mail' },
  latteArt: { src: latteArt, alt: 'Latte art in a white cup on a wooden café table' },
  winterHands: { src: winterHands, alt: 'Hands in a cream knit sweater holding a mug of coffee' },
  treeLights: { src: treeLights, alt: '' },
  phoneEmail: { src: phoneEmail, alt: 'Hands holding a smartphone beside a lit Christmas tree' },
  coffeeShop: { src: coffeeShop, alt: 'A café espresso machine with stacked cups' },
  snowWindow: { src: snowWindow, alt: 'Frost on a window against a snowy winter sky' },
  ornaments: { src: ornaments, alt: 'Red and gold Christmas ornaments on rustic wood' },
  deskCards: { src: deskCards, alt: 'A desk with a hand-painted Christmas card, a sealed envelope and a wrapped parcel' },
  cookiesCoffee: { src: cookiesCoffee, alt: 'A cup of cocoa with gingerbread cookies, cinnamon and orange slices' },
  pineTexture: { src: pineTexture, alt: '' },
  thankYou: { src: thankYou, alt: 'Hands offering a small wrapped red gift' },
} satisfies Record<string, Photo>;
