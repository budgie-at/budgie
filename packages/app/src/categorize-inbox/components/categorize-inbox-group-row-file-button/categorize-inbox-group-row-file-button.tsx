import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxTonalCapsuleVariantEnum } from '../../enum/categorize-inbox-tonal-capsule-variant.enum';
import { formatCategorizeInboxMerchantTitle } from '../../utils/format-categorize-inbox-merchant-title.util';
import { CategorizeInboxGroupRowPill } from '../categorize-inbox-group-row-pill/categorize-inbox-group-row-pill';
import { CategorizeInboxGroupRowSelector } from '../categorize-inbox-group-row/categorize-inbox-group-row.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'key' | 'displayTitle' | 'candidateLabelIds'>;
}

export const CategorizeInboxGroupRowFileButton = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { strategy, acceptableAssignments, assign } = useCategorizeInboxContext();

    const candidateId = cluster.candidateLabelIds.at(0);
    const candidateTitle = isDefined(candidateId) ? strategy?.labelsById.get(candidateId)?.title : null;
    const merchantTitle = formatCategorizeInboxMerchantTitle(cluster.displayTitle);
    const assignments = acceptableAssignments.filter(assignment => assignment.key === cluster.key);

    const handlePress = (): void => {
        assign(assignments);
    };

    if (!isNotEmptyString(candidateTitle)) {
        return null;
    }

    return (
        <CategorizeInboxGroupRowPill
            variant={CategorizeInboxTonalCapsuleVariantEnum.POSITIVE}
            text={t({ context: 'Apply a category action', message: 'File' })}
            label={t`File ${merchantTitle} as ${candidateTitle}`}
            isDisabled={!isNotEmptyArray(assignments)}
            onPress={handlePress}
            {...testID(CategorizeInboxGroupRowSelector.FileButton, cluster.key)}
        />
    );
};
