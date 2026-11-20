import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { YieldBreakdownCryptoToday } from '../yield-breakdown-crypto-today/yield-breakdown-crypto-today';
import { YieldBreakdownNet } from '../yield-breakdown-net/yield-breakdown-net';
import { YieldBreakdownRunRate } from '../yield-breakdown-run-rate/yield-breakdown-run-rate';
import { YieldBreakdownVsRate } from '../yield-breakdown-vs-rate/yield-breakdown-vs-rate';

export const YieldBreakdown = () => {
    const summary = useYieldSummary();

    if (!isDefined(summary)) {
        return null;
    }

    const { runRate, cryptoRewardsToday, vsRate } = summary;
    const hasRows = isPositiveNumber(summary.tax) || isDefined(runRate) || isDefined(cryptoRewardsToday) || isDefined(vsRate);

    if (!hasRows) {
        return null;
    }

    return (
        <GroupedListSection>
            {isPositiveNumber(summary.tax) ? <YieldBreakdownNet net={summary.net} /> : null}
            {isDefined(runRate) ? <YieldBreakdownRunRate runRate={runRate} /> : null}
            {isDefined(cryptoRewardsToday) ? <YieldBreakdownCryptoToday rewards={cryptoRewardsToday} /> : null}
            {isDefined(vsRate) ? <YieldBreakdownVsRate vsRate={vsRate} /> : null}
        </GroupedListSection>
    );
};
