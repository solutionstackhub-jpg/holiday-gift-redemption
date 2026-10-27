import { config, settingsDefaults } from './config';
import { dayKey } from './format';

export interface CampaignSettings {
  firmName: string;
  rewardBrand: string;
  amount: number;
  headline: string;
  message: string;
  /** Last day codes can be redeemed, YYYY-MM-DD in the campaign time zone. */
  endsAt: string;
  /** Hard stop on total gift card spend. */
  budgetCap: number;
  /** Pause switch for the whole campaign. */
  active: boolean;
  supportEmail: string;
}

export function defaultSettings(): CampaignSettings {
  return { ...settingsDefaults };
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);

/** Merges an untrusted patch into the current settings, keeping only valid values. */
export function mergeSettings(current: CampaignSettings, patch: Record<string, unknown>): CampaignSettings {
  const next = { ...current };
  const firmName = text(patch.firmName, 80);
  if (firmName) next.firmName = firmName;
  const rewardBrand = text(patch.rewardBrand, 40);
  if (rewardBrand) next.rewardBrand = rewardBrand;
  const headline = text(patch.headline, 90);
  if (headline) next.headline = headline;
  const message = text(patch.message, 400);
  if (message) next.message = message;
  const supportEmail = text(patch.supportEmail, 120);
  if (supportEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) next.supportEmail = supportEmail;
  const endsAt = text(patch.endsAt, 10);
  if (endsAt && /^\d{4}-\d{2}-\d{2}$/.test(endsAt)) next.endsAt = endsAt;
  const amount = Number(patch.amount);
  if (Number.isFinite(amount) && amount >= 1 && amount <= 500) next.amount = Math.round(amount * 100) / 100;
  const budgetCap = Number(patch.budgetCap);
  if (Number.isFinite(budgetCap) && budgetCap >= 1 && budgetCap <= 10_000_000) next.budgetCap = Math.round(budgetCap);
  if (typeof patch.active === 'boolean') next.active = patch.active;
  return next;
}

export function campaignEnded(s: CampaignSettings, now = new Date()) {
  return dayKey(now, config.timezone) > s.endsAt;
}

export function daysLeft(s: CampaignSettings, now = new Date()) {
  const today = Date.parse(`${dayKey(now, config.timezone)}T00:00:00Z`);
  const end = Date.parse(`${s.endsAt}T00:00:00Z`);
  return Math.max(0, Math.round((end - today) / 86_400_000));
}

export function formatEndDate(s: CampaignSettings) {
  const [y, m, d] = s.endsAt.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
