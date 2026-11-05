import { InzhurImportOutcomeEnum } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurImportSummaryFundRow } from '../inzhur-import-summary-fund-row/inzhur-import-summary-fund-row';
import { InzhurImportSummaryFunding } from '../inzhur-import-summary-funding/inzhur-import-summary-funding';
import { InzhurImportSummaryHero } from '../inzhur-import-summary-hero/inzhur-import-summary-hero';

import type { InzhurImportSummaryInterface } from '@budgie/sync';

interface Props {
    readonly summary: InzhurImportSummaryInterface;
}

export const InzhurImportSummary = ({ summary }: Props) => {
    const { t } = useLingui();
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';
    const { outcome, cashMoved, funds } = summary;

    const footnote = {
        [InzhurImportOutcomeEnum.BASELINE]: t`Your holdings were taken as the starting point. Cash was not changed.`,
        [InzhurImportOutcomeEnum.APPLIED]: t`Recorded automatically. You can edit any entry like a normal transaction.`,
        [InzhurImportOutcomeEnum.UNCHANGED]: t`This statement is not newer than the last one you imported, so nothing changed.`
    }[outcome];
    const isCashMovementShown = outcome === InzhurImportOutcomeEnum.APPLIED && cashMoved !== 0;

    return (
        <View className="gap-y-3xl" testID={InzhurSelector.Summary}>
            <InzhurImportSummaryHero funds={funds} />

            {isNotEmptyArray(funds) ? (
                <GroupedListSection title={t`Added by this statement`}>
                    {funds.map(fund => (
                        <InzhurImportSummaryFundRow key={fund.isin} fund={fund} symbol={symbol} />
                    ))}
                </GroupedListSection>
            ) : null}

            {isCashMovementShown ? <InzhurImportSummaryFunding summary={summary} symbol={symbol} /> : null}

            <Text className="px-3xl text-[13px] leading-[18px] text-secondary-foreground">{footnote}</Text>
        </View>
    );
};
