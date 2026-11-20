import { Trans } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { Text } from 'react-native';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { yieldPriceJobsFamily } from '../../constant/yield-price-jobs-family-atom.constant';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: Pick<YieldSummaryInterface, 'hasYield' | 'instrumentIds'>;
}

const STATUS_MAX_FONT_SIZE_MULTIPLIER = 1.5;

export const YieldHeroPricesStatus = ({ summary }: Props) => {
    const isUpdatingPrices = AsyncResult.getOrElse(useLiveAtomValue(yieldPriceJobsFamily(summary.instrumentIds)), () => false);

    if (!summary.hasYield || !isUpdatingPrices) {
        return null;
    }

    return (
        <Text
            accessibilityLiveRegion="polite"
            maxFontSizeMultiplier={STATUS_MAX_FONT_SIZE_MULTIPLIER}
            className="text-[13px] leading-[18px] text-secondary-foreground"
        >
            <Trans>Updating prices…</Trans>
        </Text>
    );
};
