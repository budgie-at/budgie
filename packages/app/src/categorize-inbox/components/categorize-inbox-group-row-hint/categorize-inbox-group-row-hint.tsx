import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxMatchedAccount } from '../../hook/use-categorize-inbox-matched-account.hook';
import { getCategorizeInboxJarName } from '../../utils/get-categorize-inbox-jar-name.util';
import { getCategorizeInboxTransferKey } from '../../utils/get-categorize-inbox-transfer-key.util';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'displayTitle' | 'candidateLabelIds'>;
}

export const CategorizeInboxGroupRowHint = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { strategy, learnedTransferAccountIds } = useCategorizeInboxContext();
    const matchedAccount = useCategorizeInboxMatchedAccount(cluster);

    const { displayTitle, candidateLabelIds } = cluster;
    const candidateId = candidateLabelIds.at(0);
    const candidateTitle = isDefined(candidateId) ? strategy?.labelsById.get(candidateId)?.title : null;
    const isTransfer =
        isDefined(matchedAccount) ||
        isDefined(getCategorizeInboxJarName(displayTitle)) ||
        learnedTransferAccountIds.has(getCategorizeInboxTransferKey(displayTitle));
    const label = isTransfer ? t`Transfer` : candidateTitle;
    const icon = isTransfer ? UserIconNameEnum.ArrowLeftRight : UserIconNameEnum.Sparkles;

    return isNotEmptyString(label) ? (
        <View className="h-[24px] shrink flex-row items-center gap-x-xs rounded-full bg-secondary-background px-sm">
            <Icon icon={icon} size={12} className="text-secondary-foreground" />
            <Text className="shrink text-xs font-semibold text-secondary-foreground" numberOfLines={1}>
                {label}
            </Text>
        </View>
    ) : null;
};
