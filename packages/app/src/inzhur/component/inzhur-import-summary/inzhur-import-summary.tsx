import { UserIconNameEnum } from '@budgie/contracts';
import { InzhurImportOutcomeEnum } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { Icon } from '../../../@generic/component/icon/icon';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { useInzhurValueQuery } from '../../query/use-inzhur-value.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurImportSummaryFundRow } from '../inzhur-import-summary-fund-row/inzhur-import-summary-fund-row';
import { InzhurImportSummaryValue } from '../inzhur-import-summary-value/inzhur-import-summary-value';

import type { InzhurImportSummaryInterface } from '@budgie/sync';

interface Props {
    readonly summary: InzhurImportSummaryInterface;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const InzhurImportSummary = ({ summary }: Props) => {
    const { t } = useLingui();
    const formatAmount = useFormatDigits(2);
    const formatFundQuantity = useFormatFundQuantity();
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';
    const inzhurValue = useInzhurValueQuery();
    const { outcome, cashMoved, uncoveredCashAmount, funds } = summary;

    const footnote = {
        [InzhurImportOutcomeEnum.BASELINE]: t`Your holdings were taken as the starting point. Cash was not changed.`,
        [InzhurImportOutcomeEnum.APPLIED]: t`Recorded automatically. You can edit any entry like a normal transaction.`,
        [InzhurImportOutcomeEnum.UNCHANGED]: t`This statement is not newer than the last one you imported, so nothing changed.`
    }[outcome];
    const totalDelta = funds.reduce((total, fund) => total + fund.deltaQuantity, 0);
    const heroLabel = `${totalDelta < 0 ? '−' : '+'}${formatFundQuantity(Math.abs(totalDelta))}`;
    const totalLabel = isDefined(inzhurValue) ? formatAmount(inzhurValue.total, symbol) : null;
    const cashLabel = cashMoved < 0 ? t`Cash used` : t`Cash added`;
    const uncoveredLabel = formatAmount(uncoveredCashAmount, symbol);
    const isCashMovementShown = outcome === InzhurImportOutcomeEnum.APPLIED && cashMoved !== 0;

    return (
        <View className="gap-y-3xl pt-md" testID={InzhurSelector.Summary}>
            <View accessible className="items-center gap-y-xs py-3xl">
                <Text className="text-[40px] font-semibold tracking-[-1px] text-primary tabular-nums">{heroLabel}</Text>
                {isDefined(totalLabel) ? (
                    <Text className="text-[15px] text-secondary-foreground tabular-nums">{t`Inzhur now ${totalLabel}`}</Text>
                ) : null}
            </View>

            {isNotEmptyArray(funds) ? (
                <GroupedListSection>
                    {funds.map(fund => (
                        <InzhurImportSummaryFundRow key={fund.isin} fund={fund} symbol={symbol} />
                    ))}
                </GroupedListSection>
            ) : null}

            {isCashMovementShown ? (
                <GroupedListSection>
                    <View className="min-h-[50px] flex-row items-center gap-x-xl p-3xl">
                        <Text className="flex-1 text-[17px] text-primary">{cashLabel}</Text>
                        <InzhurImportSummaryValue>{formatAmount(Math.abs(cashMoved), symbol)}</InzhurImportSummaryValue>
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
                        <Text className="text-[15px] leading-[20px] font-semibold text-warning-strong tabular-nums">
                            {t`${uncoveredLabel} not matched to a bank top-up yet`}
                        </Text>
                        <Text className="text-[15px] leading-[20px] text-warning-strong">
                            {t`Budgie matches it automatically when the top-up arrives from your bank.`}
                        </Text>
                    </View>
                </View>
            ) : null}

            <Text className="px-3xl text-[13px] leading-[18px] text-secondary-foreground">{footnote}</Text>
        </View>
    );
};
