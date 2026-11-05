import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { getInzhurShortTitle } from '../../utils/get-inzhur-short-title.util';
import { InzhurAwaitingTopUpRow } from '../inzhur-awaiting-top-up-row/inzhur-awaiting-top-up-row';
import { InzhurMoneyRow } from '../inzhur-money-row/inzhur-money-row';

import type { InzhurImportSummaryInterface } from '@budgie/sync';

interface Props {
    readonly summary: Pick<InzhurImportSummaryInterface, 'funds' | 'cashMoved' | 'uncoveredCashAmount'>;
    readonly symbol: string;
}

export const InzhurImportSummaryFunding = ({ summary, symbol }: Props) => {
    const { t } = useLingui();
    const { funds, cashMoved, uncoveredCashAmount } = summary;

    const boughtFunds = funds.filter(fund => fund.deltaQuantity > 0 && fund.exchangedAmount > fund.dividendAmount);
    const boughtFundName = getInzhurShortTitle(boughtFunds.at(0)?.name ?? '');
    const spentTitle = boughtFunds.length === 1 ? t`Paid for the ${boughtFundName} buy` : t`Paid for these buys`;
    const isSpent = cashMoved < 0;
    const title = isSpent ? spentTitle : t`Added to Inzhur cash`;
    const cashAmount = isSpent ? Math.abs(cashMoved) - uncoveredCashAmount : cashMoved;

    return (
        <GroupedListSection title={title}>
            <View className="gap-y-md px-3xl py-md">
                <InzhurMoneyRow label={t`Inzhur cash`} amount={cashAmount} instrumentSymbol={symbol} />
                {isPositiveNumber(uncoveredCashAmount) ? (
                    <InzhurAwaitingTopUpRow amount={uncoveredCashAmount} instrumentSymbol={symbol} />
                ) : null}
            </View>
        </GroupedListSection>
    );
};
