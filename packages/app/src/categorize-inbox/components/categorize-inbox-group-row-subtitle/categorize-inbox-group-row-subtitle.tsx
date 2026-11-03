import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxIsTransfer } from '../../hook/use-categorize-inbox-is-transfer.hook';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'section' | 'displayTitle' | 'candidateLabelIds'>;
}

export const CategorizeInboxGroupRowSubtitle = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { strategy } = useCategorizeInboxContext();
    const isTransfer = useCategorizeInboxIsTransfer(cluster);

    const { section, candidateLabelIds } = cluster;
    const candidateId = candidateLabelIds.at(0);
    const candidateTitle = isDefined(candidateId) ? strategy?.labelsById.get(candidateId)?.title : null;
    const isLikelyTransfer = section !== CategorizeInboxSectionEnum.CONFIDENT && isTransfer;
    const transferOrSuggestionText = isLikelyTransfer ? t`Transfer` : candidateTitle;
    const labelText = section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS ? t`Cash withdrawal` : transferOrSuggestionText;

    if (!isNotEmptyString(labelText)) {
        return null;
    }

    return (
        <Text className="text-[13px] leading-[17px] text-secondary-foreground" numberOfLines={1}>
            {labelText}
        </Text>
    );
};
