import { readStorage, writeStorage } from './Storage';

const STORAGE_KEY = 'ni-mbaya-daily-challenge';
export const DAILY_TARGET = 20;
export const DAILY_REWARD = 250;
export type DailyChallenge = { date: string; defeats: number; claimed: boolean; rewardChapatis: number };
const calendar = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit' });

export function getDailyDate(now = new Date()) {
  const parts = calendar.formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function getDailyChallenge(now = new Date()): DailyChallenge {
  const date = getDailyDate(now);
  try {
    const stored = JSON.parse(readStorage(STORAGE_KEY) ?? 'null');
    const rewardChapatis = Number.isSafeInteger(stored?.rewardChapatis) && stored.rewardChapatis >= 0 ? stored.rewardChapatis : 0;
    if (stored?.date !== date) return { date, defeats: 0, claimed: false, rewardChapatis };
    const defeats = Number.isInteger(stored.defeats) ? Math.min(DAILY_TARGET, Math.max(0, stored.defeats)) : 0;
    return { date, defeats, claimed: defeats === DAILY_TARGET && stored.claimed === true, rewardChapatis };
  } catch { return { date, defeats: 0, claimed: false, rewardChapatis: 0 }; }
}

export function recordDailyDefeat(now = new Date()) {
  const challenge = getDailyChallenge(now);
  if (challenge.defeats < DAILY_TARGET) {
    challenge.defeats++;
    writeStorage(STORAGE_KEY, JSON.stringify(challenge));
  }
  return challenge;
}

/** One record updates both the claim flag and the permanent reward bank. */
export function claimDailyReward(now = new Date()) {
  const challenge = getDailyChallenge(now);
  if (challenge.defeats < DAILY_TARGET || challenge.claimed) return 0;
  challenge.claimed = true;
  challenge.rewardChapatis += DAILY_REWARD;
  writeStorage(STORAGE_KEY, JSON.stringify(challenge));
  return DAILY_REWARD;
}

export function getDailyRewardBalance() { return getDailyChallenge().rewardChapatis; }
