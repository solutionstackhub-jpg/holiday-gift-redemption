import { ArrowRight, Download, Mail } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ImportPanel from '@/components/admin/import-panel';
import { btn, Card, CardHeader, PageHeader } from '@/components/admin/ui';
import { photos } from '@/lib/images';

export const metadata: Metadata = { title: 'Import clients' };

const COLUMNS = [
  ['Email Address', 'or email. Used for Mailchimp and duplicate checks.'],
  ['First Name + Last Name', 'or name. Shown on the gift page and postcard.'],
  ['Address, City, State, Zip', 'Goes into the postcard print file.'],
  ['code', 'Optional. Leave it out and a code is created for each client.'],
];

export default function ImportPage() {
  return (
    <>
      <PageHeader
        title="Import clients"
        description="Upload your client list once. Every new client gets a unique code automatically."
        actions={
          <a href="/sample-clients.csv" download className={btn.secondary}>
            <Download className="size-4" /> Sample CSV
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Upload a CSV" description="Re-importing is safe: clients already on the list are skipped." />
          <div className="p-5 sm:p-6">
            <ImportPanel />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="relative h-44">
            <Image src={photos.deskCards.src} alt={photos.deskCards.alt} fill placeholder="blur" sizes="(min-width: 1024px) 420px, 100vw" className="object-cover object-[50%_35%]" />
          </div>
          <div className="p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold text-zinc-900">Columns we recognize</h2>
            <p className="mt-1 text-[13px] text-zinc-500">A Mailchimp audience export works without any editing.</p>
            <ul className="mt-4 space-y-3">
              {COLUMNS.map(([name, text]) => (
                <li key={name} className="text-sm">
                  <span className="font-medium text-zinc-900">{name}</span>
                  <span className="text-zinc-500"> · {text}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-600/10">
              <Mail className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-zinc-900">Your list already lives in Mailchimp?</p>
              <p className="text-sm text-zinc-500">Pull contacts straight from your audience instead of exporting a file.</p>
            </div>
          </div>
          <Link href="/admin/mailchimp" className={btn.secondary}>
            Import from Mailchimp <ArrowRight className="size-4" />
          </Link>
        </div>
      </Card>
    </>
  );
}
