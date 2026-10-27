import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import Sidebar from '@/components/admin/sidebar';
import DemoBar from '@/components/demo-bar';
import { adminPasswordSet, isAdmin } from '@/lib/auth';
import { config } from '@/lib/config';
import { photos } from '@/lib/images';
import { daysLeft } from '@/lib/settings';
import { getStore } from '@/lib/store';
import { loadSettings } from '@/lib/demo-state';

export const dynamic = 'force-dynamic';

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  if (!(await isAdmin())) redirect('/admin/login');
  const settings = await loadSettings(getStore());

  return (
    <div className="min-h-screen bg-zinc-50/70 text-zinc-900">
      <Sidebar
        firmName={settings.firmName}
        active={settings.active}
        daysLeft={daysLeft(settings)}
        passwordProtected={adminPasswordSet()}
        banner={photos.pineTexture.src}
      />
      <div className="lg:pl-[260px]">
        <main className="mx-auto max-w-[1240px] px-4 pb-28 pt-6 sm:px-8 sm:pt-10">{children}</main>
      </div>
      {config.demoMode && <DemoBar />}
    </div>
  );
}
