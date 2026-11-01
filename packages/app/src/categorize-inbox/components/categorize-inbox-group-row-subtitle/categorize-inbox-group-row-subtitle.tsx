import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxIsTransfer } from '../../hook/use-categorize-inbox-is-transfer.hook';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'section' | 'rows' | 'displayTitle' | 'candidateLabelIds'>;
}

export const CategorizeInboxGroupRowSubtitle = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { strategy } = useCategorizeInboxContext();
    const isTransfer = useCategorizeInboxIsTransfer(cluster);

    const { section, rows, candidateLabelIds } = cluster;
    const candidateId = candidateLabelIds.at(0);
    const candidateTitle = isDefined(candidateId) ? strategy?.labelsById.get(candidateId)?.title : null;
    const isLikelyTransfer = section !== CategorizeInboxSectionEnum.CONFIDENT && isTransfer;
    const suggestionText = isNotEmptyString(candidateTitle) ? candidateTitle : t`No suggestion`;
    const transferOrSuggestionText = isLikelyTransfer ? t`Transfer` : suggestionText;
    const labelText = section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS ? t`Cash withdrawal` : transferOrSuggestionText;
    const countText = t({ message: plural(rows.length, { one: '# payment', other: '# payments' }) });

    return (
        <View className="flex-row items-start gap-x-md">
            <Text className="min-w-0 flex-1 text-[13px] leading-[17px] text-secondary-foreground" numberOfLines={1}>
                {labelText}
            </Text>
            <Text className="shrink-0 text-[13px] leading-[17px] text-secondary-foreground tabular-nums">{countText}</Text>
        </View>
    );
};
