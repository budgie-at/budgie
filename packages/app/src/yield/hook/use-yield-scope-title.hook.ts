import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { yieldSummaryFamily } from '../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../context/yield-screen.context';

export const useYieldScopeTitle = (): string => {
    const { screenKey } = use(YieldScreenContext);
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);

    const { positionAccountId } = screenKey.key;
    const positionTitle = summary?.positions.find(position => position.accountId === positionAccountId)?.title;
    const instrumentCode = summary?.positions.at(0)?.instrumentCode ?? '';

    return isDefined(positionAccountId) ? (positionTitle ?? '') : instrumentCode;
};
