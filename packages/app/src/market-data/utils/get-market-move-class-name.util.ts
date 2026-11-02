import { isPositiveNumber } from '@rnw-community/shared';

import { NEUTRAL_CHANGE_SHARE } from '../constant/neutral-change-share.constant';

export const getMarketMoveClassName = (share: number): string => {
    if (Math.abs(share) < NEUTRAL_CHANGE_SHARE) {
        return 'text-secondary-foreground';
    }

    if (isPositiveNumber(share)) {
        return 'text-positive-strong';
    }

    return isPositiveNumber(-share) ? 'text-destructive-strong' : 'text-primary';
};
