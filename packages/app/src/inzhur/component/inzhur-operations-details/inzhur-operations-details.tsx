import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { getInzhurShortTitle } from '../../utils/get-inzhur-short-title.util';
import { InzhurOperationsNoteRow } from '../inzhur-operations-note-row/inzhur-operations-note-row';

import type { InzhurOperationsImportSummaryInterface } from '@budgie/sync';

interface Props {
    readonly summary: InzhurOperationsImportSummaryInterface;
}

export const InzhurOperationsDetails = ({ summary }: Props) => {
    const { t } = useLingui();
    const formatFundQuantity = useFormatFundQuantity();
    const { bankMatches, reconciliations, unrecognised, conversionCount } = summary;

    const conversionLabel = t({ message: plural(conversionCount, { one: '# operation', other: '# operations' }) });
    const conversionDetail = summary.surchargeAmount > 0 ? t`${conversionLabel} · with a surcharge` : conversionLabel;
    const pairedLabel = t({ message: plural(bankMatches.paired, { one: '# transfer matched', other: '# transfers matched' }) });
    const unpairedLabel = t({ message: plural(bankMatches.unpaired, { one: '# transfer waiting', other: '# transfers waiting' }) });
    const skippedNames = unrecognised.map(item => item.operation).join(', ');

    return (
        <GroupedListSection title={t`Details`}>
            {conversionCount > 0 ? <InzhurOperationsNoteRow label={t`Conversions`} detail={conversionDetail} /> : null}
            <InzhurOperationsNoteRow label={t`Matched to your bank`} detail={pairedLabel} />
            {bankMatches.unpaired > 0 ? <InzhurOperationsNoteRow label={t`Waiting for your bank`} detail={unpairedLabel} /> : null}
            {isNotEmptyArray(unrecognised) ? <InzhurOperationsNoteRow label={t`Skipped, not recognised`} detail={skippedNames} /> : null}
            {reconciliations.map(reconciliation => {
                const quantityLabel = formatFundQuantity(reconciliation.difference);

                return (
                    <InzhurOperationsNoteRow
                        key={reconciliation.fundName}
                        label={getInzhurShortTitle(reconciliation.fundName)}
                        detail={t`Adjusted by ${quantityLabel} to match your holdings statement`}
                    />
                );
            })}
        </GroupedListSection>
    );
};
