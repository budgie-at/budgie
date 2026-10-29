import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { getCategorizeInboxJarName } from '../../utils/get-categorize-inbox-jar-name.util';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'section' | 'displayTitle' | 'candidateLabelIds'>;
}

export const CategorizeInboxGroupRowHint = ({ cluster }: Props) => {
    const { strategy, learnedTransferAccountIds } = useCategorizeInboxContext();

    const { section, displayTitle, candidateLabelIds } = cluster;
    const candidateId = candidateLabelIds.at(0);
    const candidateTitle = isDefined(candidateId) ? strategy?.labelsById.get(candidateId)?.title : null;
    const jarName = getCategorizeInboxJarName(displayTitle);

    if (section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS) {
        return (
            <View className="shrink-0 rounded-full bg-warning-background px-sm py-xxs">
                <Text className="text-xs font-medium text-warning-foreground">
                    <Trans>Move to cash</Trans>
                </Text>
            </View>
        );
    }

    if (section === CategorizeInboxSectionEnum.CONFIDENT) {
        return isNotEmptyString(candidateTitle) ? (
            <View className="shrink rounded-full bg-positive-background px-sm py-xxs">
                <Text className="text-xs font-medium text-positive-foreground" numberOfLines={1}>
                    {candidateTitle}
                </Text>
            </View>
        ) : null;
    }

    if (isNotEmptyString(jarName) && learnedTransferAccountIds.has(jarName)) {
        return (
            <View className="shrink-0 flex-row items-center gap-x-xs">
                <Icon icon={UserIconNameEnum.ArrowLeftRight} size={13} className="text-secondary-foreground" />
                <Text className="text-[13px] text-secondary-foreground">
                    <Trans>Transfer</Trans>
                </Text>
            </View>
        );
    }

    return isNotEmptyString(candidateTitle) ? (
        <View className="shrink flex-row items-center gap-x-xs">
            <Icon icon={UserIconNameEnum.Tag} size={13} className="text-secondary-foreground" />
            <Text className="shrink text-[13px] text-secondary-foreground" numberOfLines={1}>
                {candidateTitle}
            </Text>
        </View>
    ) : null;
};
