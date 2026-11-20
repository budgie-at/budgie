import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../context/yield-screen.context';

import { useYieldSummary } from './use-yield-summary.hook';

export const useYieldScopeTitle = (): string => {
    const { screenKey } = use(YieldScreenContext);
    const summary = useYieldSummary();

    const { positionAccountId } = screenKey.key;
    const positionTitle = summary?.positions.find(position => position.accountId === positionAccountId)?.title;
    const instrumentCode = summary?.positions.at(0)?.instrumentCode ?? '';

    return isDefined(positionAccountId) ? (positionTitle ?? '') : instrumentCode;
};
