import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxIsTransfer } from '../../hook/use-categorize-inbox-is-transfer.hook';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'displayTitle' | 'candidateLabelIds'>;
}

export const CategorizeInboxGroupRowHint = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { strategy } = useCategorizeInboxContext();
    const isTransfer = useCategorizeInboxIsTransfer(cluster);

    const candidateId = cluster.candidateLabelIds.at(0);
    const candidateTitle = isDefined(candidateId) ? strategy?.labelsById.get(candidateId)?.title : null;
    const label = isTransfer ? t`Transfer` : candidateTitle;
    const icon = isTransfer ? UserIconNameEnum.ArrowLeftRight : UserIconNameEnum.Sparkles;

    return isNotEmptyString(label) ? (
        <View className="shrink flex-row items-center gap-x-xs">
            <Icon icon={icon} size={12} className="text-secondary-foreground" />
            <Text className="shrink text-[13px] text-secondary-foreground" numberOfLines={1}>
                {label}
            </Text>
        </View>
    ) : null;
};
