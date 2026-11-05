import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { getInzhurShortTitle } from '../../utils/get-inzhur-short-title.util';
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
    const spentTitle = boughtFunds.length === 1 ? t`Funding for ${boughtFundName}` : t`Funding for these buys`;
    const isSpent = cashMoved < 0;
    const title = isSpent ? spentTitle : t`Added to Inzhur cash`;
    const cashLabel = isSpent ? t`From Inzhur cash` : t`To Inzhur cash`;
    const cashAmount = isSpent ? Math.abs(cashMoved) - uncoveredCashAmount : cashMoved;

    return (
        <GroupedListSection title={title}>
            <View className="min-h-[64px] justify-center px-3xl py-[12px]">
                <InzhurMoneyRow
                    label={cashLabel}
                    {...(isSpent && { caption: t`Used for this purchase` })}
                    amount={cashAmount}
                    instrumentSymbol={symbol}
                    icon={UserIconNameEnum.Banknote}
                />
            </View>
            {isPositiveNumber(uncoveredCashAmount) ? (
                <View className="min-h-[64px] justify-center px-3xl py-[12px]">
                    <InzhurMoneyRow
                        label={t`From a bank top-up`}
                        caption={t`Bank transaction not matched yet`}
                        amount={uncoveredCashAmount}
                        instrumentSymbol={symbol}
                        icon={UserIconNameEnum.Clock}
                        iconClassName="text-warning-strong"
                    />
                </View>
            ) : null}
        </GroupedListSection>
    );
};
