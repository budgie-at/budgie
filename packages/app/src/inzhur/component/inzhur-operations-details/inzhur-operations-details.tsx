import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { InzhurOperationsNoteRow } from '../inzhur-operations-note-row/inzhur-operations-note-row';

import type { InzhurOperationsImportSummaryInterface } from '@budgie/sync';

interface Props {
    readonly summary: InzhurOperationsImportSummaryInterface;
}

export const InzhurOperationsDetails = ({ summary }: Props) => {
    const { t } = useLingui();
    const { bankMatches, unrecognised, conversionCount, isFullHistory, replacedPurchaseCount, unmatchedBankCount } = summary;

    const conversionLabel = t({ message: plural(conversionCount, { one: '# operation', other: '# operations' }) });
    const conversionDetail = summary.surchargeAmount > 0 ? t`${conversionLabel} · with a surcharge` : conversionLabel;
    const pairedLabel = t({
        message: plural(bankMatches.paired, {
            one: 'Linked # past Inzhur payment from your bank',
            other: 'Linked # past Inzhur payments from your bank'
        })
    });
    const unpairedLabel = t({ message: plural(bankMatches.unpaired, { one: '# transfer waiting', other: '# transfers waiting' }) });
    const replacedLabel = t({
        message: plural(replacedPurchaseCount, { one: 'Replaced # purchase you entered', other: 'Replaced # purchases you entered' })
    });
    const unmatchedLabel = t({
        message: plural(unmatchedBankCount, {
            one: '# bank payment to Inzhur has no matching row in the file',
            other: '# bank payments to Inzhur have no matching row in the file'
        })
    });
    const skippedNames = unrecognised.map(item => item.operation).join(', ');

    return (
        <GroupedListSection title={t`Details`}>
            {isFullHistory ? null : (
                <InzhurOperationsNoteRow
                    label={t`Partial export`}
                    detail={t`The balance before the export was estimated. Export the full history for exact numbers.`}
                />
            )}
            {conversionCount > 0 ? <InzhurOperationsNoteRow label={t`Conversions`} detail={conversionDetail} /> : null}
            {isPositiveNumber(replacedPurchaseCount) ? <InzhurOperationsNoteRow label={t`Purchases`} detail={replacedLabel} /> : null}
            {isPositiveNumber(bankMatches.paired) ? <InzhurOperationsNoteRow label={t`Matched to your bank`} detail={pairedLabel} /> : null}
            {isPositiveNumber(bankMatches.unpaired) ? (
                <InzhurOperationsNoteRow label={t`Waiting for your bank`} detail={unpairedLabel} />
            ) : null}
            {isPositiveNumber(unmatchedBankCount) ? <InzhurOperationsNoteRow label={t`Bank payments`} detail={unmatchedLabel} /> : null}
            {isNotEmptyArray(unrecognised) ? <InzhurOperationsNoteRow label={t`Skipped, not recognised`} detail={skippedNames} /> : null}
        </GroupedListSection>
    );
};
