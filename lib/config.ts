function positive(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Server settings that come from environment variables and never change at runtime. */
export const config = {
  codePrefix: (process.env.CODE_PREFIX || 'XMAS').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'XMAS',
  timezone: process.env.TIMEZONE || 'America/New_York',
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, ''),
  demoMode: process.env.DEMO_MODE !== 'false',
  rateLimit: {
    maxFailures: positive(process.env.RATE_LIMIT_MAX_FAILURES, 10),
    windowMinutes: positive(process.env.RATE_LIMIT_WINDOW_MINUTES, 15),
  },
};

/** Starting values for the campaign settings the admin can edit. */
export const settingsDefaults = {
  firmName: process.env.FIRM_NAME || 'Your Law Firm',
  rewardBrand: process.env.REWARD_BRAND || 'Starbucks',
  amount: positive(process.env.GIFT_AMOUNT, 10),
  headline: 'A little holiday cheer, on us.',
  message:
    'Thank you for trusting us this year. We hope this coffee brings a warm moment to your holiday season. From all of us, happy holidays.',
  endsAt: process.env.CAMPAIGN_ENDS_AT || '2027-01-31',
  budgetCap: positive(process.env.BUDGET_CAP, 40_000),
  active: true,
  supportEmail: process.env.SUPPORT_EMAIL || 'hello@yourfirm.com',
};
