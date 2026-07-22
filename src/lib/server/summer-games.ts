import { getSummerGamesConfig } from './settings';
import {
  isWithinSummerGames,
  resolveSummerGamesPeriod,
  SummerGamesPeriod,
} from '@/lib/shared/summer-games';

export interface SummerGamesState {
  period: SummerGamesPeriod | null;
  isActive: boolean;
  feeCents: number;
}

/**
 * Load the current summer games state (period + whether we are inside it).
 */
export async function getSummerGamesState(now: Date = new Date()): Promise<SummerGamesState> {
  const config = await getSummerGamesConfig();
  const period = resolveSummerGamesPeriod(config);

  return {
    period,
    isActive: isWithinSummerGames(period, now),
    feeCents: config.feeCents,
  };
}
