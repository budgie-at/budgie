import { UserIconNameEnum } from '@budgie/contracts';
import { InzhurImportOutcomeEnum } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { Icon } from '../../../@generic/component/icon/icon';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
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
            {isNotEmptyArray(funds) ? (
                <GroupedListSection>
                    {funds.map(fund => (
                        <InzhurImportSummaryFundRow key={fund.isin} fund={fund} symbol={symbol} />
                    ))}
                </GroupedListSection>
            ) : null}

            {isCashMovementShown ? (
                <GroupedListSection>
                    <View className="min-h-[50px] flex-row items-center gap-x-xl px-3xl py-lg">
                        <Text className="flex-1 text-[17px] text-primary">{cashLabel}</Text>
                        <InzhurImportSummaryValue>{formatAmount(Math.abs(cashMoved), symbol)}</InzhurImportSummaryValue>
                    </View>
                </GroupedListSection>
            ) : null}

            {isPositiveNumber(uncoveredCashAmount) ? (
                <View
                    className="min-h-[52px] flex-row items-center gap-x-md rounded-3xl bg-warning-background px-3xl py-lg"
                    style={CONTINUOUS_CORNERS}
                    testID={InzhurSelector.SummaryUncoveredCash}
                >
                    <Icon icon={UserIconNameEnum.Clock} size={20} className="text-warning-strong" />
                    <Text className="flex-1 text-[15px] leading-[20px] font-medium text-warning-strong">
                        {t`Waiting for a ${uncoveredLabel} top-up from your bank`}
                    </Text>
                </View>
            ) : null}

            <Text className="px-3xl text-[13px] leading-[18px] text-secondary-foreground">{footnote}</Text>
        </View>
    );
};
