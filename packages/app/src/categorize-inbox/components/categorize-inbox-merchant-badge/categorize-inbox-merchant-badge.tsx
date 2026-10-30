import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxIsTransfer } from '../../hook/use-categorize-inbox-is-transfer.hook';
import { formatCategorizeInboxMerchantTitle } from '../../utils/format-categorize-inbox-merchant-title.util';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'section' | 'displayTitle' | 'candidateLabelIds'>;
}

const DISC_CLASS_NAME: Record<CategorizeInboxSectionEnum, string> = {
    [CategorizeInboxSectionEnum.CONFIDENT]: 'bg-positive-background',
    [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: 'bg-warning-background',
    [CategorizeInboxSectionEnum.REVIEW]: 'bg-secondary-foreground/15',
    [CategorizeInboxSectionEnum.ONE_OFFS]: 'bg-secondary-foreground/15'
};

const GLYPH_CLASS_NAME: Record<CategorizeInboxSectionEnum, string> = {
    [CategorizeInboxSectionEnum.CONFIDENT]: 'text-positive-foreground',
    [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: 'text-warning-foreground',
    [CategorizeInboxSectionEnum.REVIEW]: 'text-secondary-foreground',
    [CategorizeInboxSectionEnum.ONE_OFFS]: 'text-secondary-foreground'
};

export const CategorizeInboxMerchantBadge = ({ cluster }: Props) => {
    const { strategy } = useCategorizeInboxContext();
    const isTransfer = useCategorizeInboxIsTransfer(cluster);

    const { section, displayTitle, candidateLabelIds } = cluster;
    const candidateId = candidateLabelIds.at(0);
    const candidateIcon = isDefined(candidateId) ? strategy?.labelsById.get(candidateId)?.icon : null;
    const isCash = section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS;
    const isLikelyTransfer = section !== CategorizeInboxSectionEnum.CONFIDENT && isTransfer;
    const transferIcon = isLikelyTransfer ? UserIconNameEnum.ArrowLeftRight : candidateIcon;
    const icon = isCash ? UserIconNameEnum.Banknote : transferIcon;
    const initial = formatCategorizeInboxMerchantTitle(displayTitle).match(/\p{L}/u)?.[0]?.toLocaleUpperCase() ?? '#';
    const glyphClassName = GLYPH_CLASS_NAME[section];

    return (
        <View
            className={cn('h-[36px] w-[36px] items-center justify-center rounded-full', DISC_CLASS_NAME[section])}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            {isDefined(icon) ? (
                <Icon icon={icon} size={18} className={glyphClassName} />
            ) : (
                <Text className={cn('text-[15px] font-semibold', glyphClassName)}>{initial}</Text>
            )}
        </View>
    );
};
