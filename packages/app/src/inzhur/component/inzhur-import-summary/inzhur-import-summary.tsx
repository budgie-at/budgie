import { InzhurImportOutcomeEnum } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurImportSummaryFundRow } from '../inzhur-import-summary-fund-row/inzhur-import-summary-fund-row';
import { InzhurImportSummaryValue } from '../inzhur-import-summary-value/inzhur-import-summary-value';

import type { InzhurImportSummaryInterface } from '@budgie/sync';

interface Props {
    readonly summary: InzhurImportSummaryInterface;
}

export const InzhurImportSummary = ({ summary }: Props) => {
    const { t } = useLingui();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const formatAmount = useFormatDigits(2);
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';
    const { outcome, statementDate, cashMoved, estimatedDividendAmount, uncoveredCashAmount, funds } = summary;

    const statementDateLabel = formatDayAndMonthAndYear(statementDate);
    const title = t`Statement of ${statementDateLabel}`;
    const outcomeFooter = {
        [InzhurImportOutcomeEnum.BASELINE]: t`Your holdings were taken as the starting point. Cash was not changed.`,
        [InzhurImportOutcomeEnum.APPLIED]: t`Everything was booked automatically. You can edit it like any other transaction.`,
        [InzhurImportOutcomeEnum.UNCHANGED]: t`This statement is not newer than the last one you imported, so nothing changed.`
    }[outcome];
    const cashRow =
        outcome === InzhurImportOutcomeEnum.APPLIED ? (
            <GroupedListRow
                title={t`Cash moved`}
                right={<InzhurImportSummaryValue>{formatAmount(cashMoved, symbol)}</InzhurImportSummaryValue>}
            />
        ) : null;
    const dividendRow = isPositiveNumber(estimatedDividendAmount) ? (
        <GroupedListRow
            title={t`Estimated dividends`}
            right={<InzhurImportSummaryValue>{formatAmount(estimatedDividendAmount, symbol)}</InzhurImportSummaryValue>}
        />
    ) : null;
    const uncoveredCashLabel = formatAmount(uncoveredCashAmount, symbol);
    const uncoveredCashFooter = t`Waiting for a top-up of ${uncoveredCashLabel} to appear from your bank`;
    const sectionFooter = isPositiveNumber(uncoveredCashAmount) ? `${outcomeFooter}\n${uncoveredCashFooter}` : outcomeFooter;
    const fundSection = isEmptyArray(funds) ? null : (
        <GroupedListSection title={t`Funds`}>
            {funds.map(fund => (
                <InzhurImportSummaryFundRow key={fund.isin} fund={fund} symbol={symbol} />
            ))}
        </GroupedListSection>
    );

    return (
        <View className="gap-y-3xl" testID={InzhurSelector.Summary}>
            <GroupedListSection title={title} footer={sectionFooter}>
                <GroupedListRow title={t`Funds updated`} right={<InzhurImportSummaryValue>{funds.length}</InzhurImportSummaryValue>} />
                {cashRow}
                {dividendRow}
            </GroupedListSection>
            {fundSection}
        </View>
    );
};
