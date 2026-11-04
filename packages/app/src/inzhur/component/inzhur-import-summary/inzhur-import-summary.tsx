import { InzhurImportOutcomeEnum } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurAwaitingTopUpRow } from '../inzhur-awaiting-top-up-row/inzhur-awaiting-top-up-row';
import { InzhurImportSummaryFundRow } from '../inzhur-import-summary-fund-row/inzhur-import-summary-fund-row';
import { InzhurImportSummaryHero } from '../inzhur-import-summary-hero/inzhur-import-summary-hero';
import { InzhurMoneyRow } from '../inzhur-money-row/inzhur-money-row';

import type { InzhurImportSummaryInterface } from '@budgie/sync';

interface Props {
    readonly summary: InzhurImportSummaryInterface;
}

export const InzhurImportSummary = ({ summary }: Props) => {
    const { t } = useLingui();
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';
    const { outcome, cashMoved, uncoveredCashAmount, funds } = summary;

    const footnote = {
        [InzhurImportOutcomeEnum.BASELINE]: t`Your holdings were taken as the starting point. Cash was not changed.`,
        [InzhurImportOutcomeEnum.APPLIED]: t`Recorded automatically. You can edit any entry like a normal transaction.`,
        [InzhurImportOutcomeEnum.UNCHANGED]: t`This statement is not newer than the last one you imported, so nothing changed.`
    }[outcome];
    const cashLabel = cashMoved < 0 ? t`From Inzhur cash` : t`Added to Inzhur cash`;
    const cashAmount = cashMoved < 0 ? Math.abs(cashMoved) - uncoveredCashAmount : cashMoved;
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
                    <View className="gap-y-md px-3xl py-md">
                        <InzhurMoneyRow label={cashLabel} amount={cashAmount} instrumentSymbol={symbol} />
                        {isPositiveNumber(uncoveredCashAmount) ? (
                            <InzhurAwaitingTopUpRow amount={uncoveredCashAmount} instrumentSymbol={symbol} />
                        ) : null}
                    </View>
                </GroupedListSection>
            ) : null}

            <Text className="px-3xl text-[13px] leading-[18px] text-secondary-foreground">{footnote}</Text>
        </View>
    );
};
