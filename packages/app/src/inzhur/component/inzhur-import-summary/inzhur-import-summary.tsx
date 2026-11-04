import { UserIconNameEnum } from '@budgie/contracts';
import { InzhurImportOutcomeEnum } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { Icon } from '../../../@generic/component/icon/icon';
import { AccountCardBalance } from '../../../account/component/account-card-balance/account-card-balance';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurImportSummaryFundRow } from '../inzhur-import-summary-fund-row/inzhur-import-summary-fund-row';
import { InzhurImportSummaryHero } from '../inzhur-import-summary-hero/inzhur-import-summary-hero';

import type { InzhurImportSummaryInterface } from '@budgie/sync';

interface Props {
    readonly summary: InzhurImportSummaryInterface;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const InzhurImportSummary = ({ summary }: Props) => {
    const { t } = useLingui();
    const formatAmount = useFormatDigits(2);
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';
    const { outcome, cashMoved, uncoveredCashAmount, funds } = summary;

    const footnote = {
        [InzhurImportOutcomeEnum.BASELINE]: t`Your holdings were taken as the starting point. Cash was not changed.`,
        [InzhurImportOutcomeEnum.APPLIED]: t`Recorded automatically. You can edit any entry like a normal transaction.`,
        [InzhurImportOutcomeEnum.UNCHANGED]: t`This statement is not newer than the last one you imported, so nothing changed.`
    }[outcome];
    const cashLabel = cashMoved < 0 ? t`Cash used` : t`Cash added`;
    const uncoveredLabel = formatAmount(uncoveredCashAmount, symbol);
    const isCashMovementShown = outcome === InzhurImportOutcomeEnum.APPLIED && cashMoved !== 0;

    return (
        <View className="gap-y-3xl pt-md" testID={InzhurSelector.Summary}>
            <InzhurImportSummaryHero funds={funds} />

            {isNotEmptyArray(funds) ? (
                <GroupedListSection>
                    {funds.map(fund => (
                        <InzhurImportSummaryFundRow key={fund.isin} fund={fund} symbol={symbol} />
                    ))}
                </GroupedListSection>
            ) : null}

            {isCashMovementShown ? (
                <GroupedListSection>
                    <View className="min-h-[50px] flex-row items-center gap-x-xl px-3xl py-[12px]">
                        <Text className="flex-1 text-[17px] text-primary">{cashLabel}</Text>
                        <AccountCardBalance title={cashLabel} balance={Math.abs(cashMoved)} instrumentSymbol={symbol} />
                    </View>
                </GroupedListSection>
            ) : null}

            {isPositiveNumber(uncoveredCashAmount) ? (
                <View
                    className="flex-row items-start gap-x-md rounded-3xl bg-warning-background p-3xl"
                    style={CONTINUOUS_CORNERS}
                    testID={InzhurSelector.SummaryUncoveredCash}
                >
                    <View className="h-[20px] justify-center">
                        <Icon icon={UserIconNameEnum.Clock} size={20} className="text-warning-strong" />
                    </View>
                    <View className="flex-1 gap-y-xxs">
                        <Text
                            className="text-[15px] leading-[20px] font-semibold text-warning-strong tabular-nums"
                            lineBreakStrategyIOS="standard"
                        >
                            {t`${uncoveredLabel} awaiting a bank top-up`}
                        </Text>
                        <Text className="text-[15px] leading-[20px] text-secondary-foreground" lineBreakStrategyIOS="standard">
                            {t`Budgie will match it when the top-up appears in your bank transactions.`}
                        </Text>
                    </View>
                </View>
            ) : null}

            <Text className="px-3xl text-[13px] leading-[18px] text-secondary-foreground">{footnote}</Text>
        </View>
    );
};
