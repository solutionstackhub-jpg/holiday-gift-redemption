import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Monogram } from '@/components/brand';
import { adminPasswordSet, isAdmin } from '@/lib/auth';
import { photos } from '@/lib/images';
import { getStore } from '@/lib/store';
import LoginForm from './login-form';

export const metadata: Metadata = { title: 'Admin sign in' };
// Auth depends on runtime env and cookies, so never prerender this page.
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await isAdmin()) redirect('/admin');
  const settings = await getStore().getSettings();

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12">
        <div className="flex items-center gap-3">
          <Monogram name={settings.firmName} tone="dark" />
          <span className="text-sm font-semibold text-zinc-900">{settings.firmName}</span>
        </div>
        <div className="mx-auto w-full max-w-sm py-16">
          <h1 className="font-display text-5xl leading-tight text-pine-950">Welcome back.</h1>
          <p className="mt-2 text-zinc-500">Sign in to manage the holiday gift campaign.</p>
          {adminPasswordSet() ? (
            <LoginForm />
          ) : (
            <p className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              The admin is locked. Set ADMIN_PASSWORD on the server to enable sign-in.
            </p>
          )}
        </div>
        <p className="text-[12px] text-zinc-400">Holiday Gift admin</p>
      </div>
      <div className="relative hidden lg:block">
        <Image src={photos.ornaments.src} alt={photos.ornaments.alt} fill priority placeholder="blur" sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-pine-950/80 via-pine-950/10 to-transparent" />
        <blockquote className="absolute inset-x-12 bottom-12 font-display text-4xl leading-tight text-white">
          &ldquo;{settings.headline}&rdquo;
        </blockquote>
      </div>
    </div>
  );
}
