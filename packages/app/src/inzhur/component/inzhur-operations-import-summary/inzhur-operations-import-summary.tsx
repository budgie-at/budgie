import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurMoneyRow } from '../inzhur-money-row/inzhur-money-row';
import { InzhurOperationsDetails } from '../inzhur-operations-details/inzhur-operations-details';
import { InzhurOperationsFundRow } from '../inzhur-operations-fund-row/inzhur-operations-fund-row';
import { InzhurOperationsIncomeRow } from '../inzhur-operations-income-row/inzhur-operations-income-row';
import { InzhurOperationsPeriodHeader } from '../inzhur-operations-period-header/inzhur-operations-period-header';

import type { InzhurOperationsImportSummaryInterface } from '@budgie/sync';

interface Props {
    readonly summary: InzhurOperationsImportSummaryInterface;
}

export const InzhurOperationsImportSummary = ({ summary }: Props) => {
    const { t } = useLingui();
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';
    const { topUps, withdrawals, funds } = summary;

    const incomeFunds = funds.filter(fund => isPositiveNumber(fund.dividends) || isPositiveNumber(fund.tax));
    const hasCashOperations = isPositiveNumber(topUps.count) || isPositiveNumber(withdrawals.count);
    const topUpsCaption = t({ message: plural(topUps.count, { one: '# operation', other: '# operations' }) });
    const withdrawalsCaption = t({ message: plural(withdrawals.count, { one: '# operation', other: '# operations' }) });
    const topUpsSegments = [topUpsCaption];
    const withdrawalsSegments = [withdrawalsCaption];
    const recordedLabel = t({ message: plural(summary.recordedCount, { one: '# entry recorded', other: '# entries recorded' }) });
    const alreadyLabel = t({
        message: plural(summary.alreadyImportedCount, { one: '# was already imported', other: '# were already imported' })
    });

    return (
        <View className="gap-y-md" testID={InzhurSelector.OperationsSummary}>
            <InzhurOperationsPeriodHeader summary={summary} />

            {hasCashOperations ? (
                <GroupedListSection title={t`Cash`}>
                    {isPositiveNumber(topUps.count) ? (
                        <View className="min-h-[64px] justify-center px-3xl py-[12px]">
                            <InzhurMoneyRow
                                label={t`Top-ups`}
                                captionSegments={topUpsSegments}
                                amount={topUps.amount}
                                instrumentSymbol={symbol}
                                icon={UserIconNameEnum.Banknote}
                            />
                        </View>
                    ) : null}
                    {isPositiveNumber(withdrawals.count) ? (
                        <View className="min-h-[64px] justify-center px-3xl py-[12px]">
                            <InzhurMoneyRow
                                label={t`Withdrawals`}
                                captionSegments={withdrawalsSegments}
                                amount={withdrawals.amount}
                                instrumentSymbol={symbol}
                                icon={UserIconNameEnum.Landmark}
                            />
                        </View>
                    ) : null}
                </GroupedListSection>
            ) : null}

            {isNotEmptyArray(funds) ? (
                <GroupedListSection title={t`Funds`}>
                    {funds.map(fund => (
                        <InzhurOperationsFundRow key={fund.accountId} fund={fund} symbol={symbol} />
                    ))}
                </GroupedListSection>
            ) : null}

            {isNotEmptyArray(incomeFunds) ? (
                <GroupedListSection title={t`Dividends`}>
                    {incomeFunds.map(fund => (
                        <InzhurOperationsIncomeRow key={fund.accountId} fund={fund} symbol={symbol} />
                    ))}
                </GroupedListSection>
            ) : null}

            <InzhurOperationsDetails summary={summary} />

            <Text className="px-3xl text-[13px] leading-[18px] text-secondary-foreground">
                {t`${recordedLabel}, ${alreadyLabel}. You can edit any entry like a normal transaction.`}
            </Text>
        </View>
    );
};
