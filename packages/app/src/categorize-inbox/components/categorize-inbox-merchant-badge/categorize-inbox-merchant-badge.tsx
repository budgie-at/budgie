import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxIsTransfer } from '../../hook/use-categorize-inbox-is-transfer.hook';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'section' | 'displayTitle' | 'candidateLabelIds' | 'isCashDeposit' | 'rows'>;
}

export const CategorizeInboxMerchantBadge = ({ cluster }: Props) => {
    const { strategy } = useCategorizeInboxContext();
    const isTransfer = useCategorizeInboxIsTransfer(cluster);

    const { section, candidateLabelIds } = cluster;
    const candidateId = candidateLabelIds.at(0);
    const candidateIcon = (isDefined(candidateId) ? strategy?.labelsById.get(candidateId)?.icon : null) ?? UserIconNameEnum.Receipt;
    const isCash = section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS;
    const isLikelyTransfer = section !== CategorizeInboxSectionEnum.CONFIDENT && isTransfer;
    const transferIcon = isLikelyTransfer ? UserIconNameEnum.ArrowLeftRight : candidateIcon;
    const icon = isCash ? UserIconNameEnum.Banknote : transferIcon;

    return (
        <View
            className="h-[36px] w-[36px] items-center justify-center rounded-full bg-surface-disc"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <Icon icon={icon} size={18} className="text-secondary-foreground" />
        </View>
    );
};
