import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { yieldPriceJobsFamily } from '../constant/yield-price-jobs-family-atom.constant';
import { yieldSummaryFamily } from '../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../context/yield-screen.context';

import { useYieldInProgressText } from './use-yield-in-progress-text.hook';
import { useYieldIsEstimated } from './use-yield-is-estimated.hook';
import { useYieldSummary } from './use-yield-summary.hook';

export const useYieldFootnoteState = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const result = useLiveAtomValue(yieldSummaryFamily(screenKey.key));
    const summary = useYieldSummary();
    const isUpdatingPrices = AsyncResult.getOrElse(useLiveAtomValue(yieldPriceJobsFamily(summary?.instrumentIds ?? [])), () => false);
    const inProgressText = useYieldInProgressText();
    const isEstimated = useYieldIsEstimated(summary);

    const hasInProgress = isNotEmptyString(inProgressText);
    const hasDetails = isDefined(summary) && summary.hasYield && (isUpdatingPrices || hasInProgress);

    return {
        isFailure: AsyncResult.isFailure(result),
        isEstimated,
        hasDetails,
        hasSwatch: !isUpdatingPrices && hasInProgress,
        details: isUpdatingPrices ? t`Updating prices…` : inProgressText
    };
};
