import { issueGiftCard } from './giftcards';
import { tagRedeemed } from './mailchimp';
import type { CampaignSettings } from './settings';
import type { CodeRow, Store } from './store/types';

/**
 * Orders the gift card for a code that is already locked as "pending".
 * On failure the code stays pending so an admin can retry; the provider's
 * external_id makes the retry safe from double charges.
 */
export async function fulfill(store: Store, row: CodeRow, settings: CampaignSettings) {
  const result = await issueGiftCard(row, settings);
  if (result.ok) {
    await store.markIssued(row.id, result.orderId, result.link, result.delivered ? 'sent' : 'processing');
    // Tag the Mailchimp contact so the firm can follow up with people who haven't redeemed.
    if (row.email) void tagRedeemed(row.email).catch(() => undefined);
  } else {
    await store.markFailed(row.id, result.error);
  }
  return result;
}
