import { RotateCcw } from 'lucide-react';
import type { Metadata } from 'next';
import { ActionButton } from '@/components/admin/actions';
import SettingsForm from '@/components/admin/settings-form';
import { btn, Card, CardHeader, PageHeader } from '@/components/admin/ui';
import { adminPasswordSet } from '@/lib/auth';
import { config } from '@/lib/config';
import { PROVIDER_LABEL, providerMode } from '@/lib/giftcards';
import { mailchimpConfigured } from '@/lib/mailchimp';
import { getStore } from '@/lib/store';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const store = getStore();
  const settings = await store.getSettings();
  const system: [string, string][] = [
    ['Data storage', store.mode === 'memory' ? 'In-memory demo data (resets on restart)' : 'Supabase Postgres'],
    ['Gift card provider', PROVIDER_LABEL[providerMode()]],
    ['Mailchimp', mailchimpConfigured() ? 'Connected' : 'Demo mode'],
    ['Admin access', adminPasswordSet() ? 'Password protected' : 'Open (demo mode only)'],
    ['Code format', `${config.codePrefix}-XXXX-XXXX · no 0/O or 1/I`],
    ['Wrong-code limit', `${config.rateLimit.maxFailures} tries per ${config.rateLimit.windowMinutes} min per device`],
    ['Time zone', config.timezone],
  ];

  return (
    <>
      <PageHeader title="Settings" description="Change the wording, amount and limits. Updates go live immediately." />
      <SettingsForm initial={settings} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="System" description="Set with environment variables on the server." />
          <dl className="divide-y divide-zinc-100">
            {system.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-5 py-3 text-sm sm:px-6">
                <dt className="text-zinc-500">{k}</dt>
                <dd className="text-right font-medium text-zinc-800">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        {config.demoMode && store.mode === 'memory' && (
          <Card className="h-fit">
            <CardHeader title="Reset demo" description="Put the 4,000 sample clients and default settings back." />
            <div className="p-5 sm:p-6">
              <ActionButton
                endpoint="/api/admin/reset"
                className={btn.secondary}
                confirm="Reset all demo data and settings?"
                success="Demo data restored"
              >
                <RotateCcw className="size-4" /> Reset demo data
              </ActionButton>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
