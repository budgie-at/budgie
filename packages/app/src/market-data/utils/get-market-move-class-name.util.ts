import { NEUTRAL_CHANGE_SHARE } from '../constant/neutral-change-share.constant';

import { getMarketChangeClassName } from './get-market-change-class-name.util';

export const getMarketMoveClassName = (share: number): string =>
    Math.abs(share) < NEUTRAL_CHANGE_SHARE ? 'text-secondary-foreground' : getMarketChangeClassName(share);
