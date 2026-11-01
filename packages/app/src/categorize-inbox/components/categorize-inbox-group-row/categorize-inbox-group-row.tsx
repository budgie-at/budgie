import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { UserIconNameEnum } from '@budgie/contracts';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { formatCategorizeInboxMerchantTitle } from '../../utils/format-categorize-inbox-merchant-title.util';
import { CategorizeInboxCardRow } from '../categorize-inbox-card-row/categorize-inbox-card-row';
import { CategorizeInboxGroupRowAmount } from '../categorize-inbox-group-row-amount/categorize-inbox-group-row-amount';
import { CategorizeInboxGroupRowCashButton } from '../categorize-inbox-group-row-cash-button/categorize-inbox-group-row-cash-button';
import { CategorizeInboxGroupRowFileButton } from '../categorize-inbox-group-row-file-button/categorize-inbox-group-row-file-button';
import { CategorizeInboxGroupRowSubtitle } from '../categorize-inbox-group-row-subtitle/categorize-inbox-group-row-subtitle';
import { CategorizeInboxMerchantBadge } from '../categorize-inbox-merchant-badge/categorize-inbox-merchant-badge';

import { CategorizeInboxGroupRowSelector } from './categorize-inbox-group-row.selector';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly position: TransactionListRowPositionEnum;
}

export const CategorizeInboxGroupRow = ({ cluster, position }: Props) => {
    const { key, displayTitle, section } = cluster;
    const isCash = section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS;
    const hasAction = isCash || section === CategorizeInboxSectionEnum.CONFIDENT;

    const href = { pathname: '/categorize/group/[key]', params: { key } } as const;
    const linkClassName = hasAction
        ? 'min-h-[64px] min-w-0 flex-1 flex-row items-center gap-x-xl py-xl pr-xl pl-3xl active:opacity-70'
        : 'min-h-[64px] min-w-0 flex-1 flex-row items-center gap-x-xl py-xl pl-3xl active:opacity-70';
    const actionButton = isCash ? (
        <CategorizeInboxGroupRowCashButton cluster={cluster} />
    ) : (
        <CategorizeInboxGroupRowFileButton cluster={cluster} />
    );
    const chevron = <Icon icon={UserIconNameEnum.ChevronRight} size={13} className="text-secondary-foreground" />;
    const trailingContent = hasAction ? actionButton : chevron;
    const trailingSlot = <View className="mr-md w-[72px] items-center justify-center">{trailingContent}</View>;
    const linkTrailingSlot = hasAction ? null : trailingSlot;
    const rowTrailingSlot = hasAction ? trailingSlot : null;

    return (
        <CategorizeInboxCardRow position={position}>
            <View className="flex-row items-center">
                <Link href={href} asChild>
                    <HapticPressable
                        className={linkClassName}
                        accessibilityRole="link"
                        {...testID(CategorizeInboxGroupRowSelector.Row, key)}
                    >
                        <CategorizeInboxMerchantBadge cluster={cluster} />
                        <View className="min-w-0 flex-1 gap-y-xxs">
                            <View className="flex-row items-start gap-x-md">
                                <Text className="min-w-0 flex-1 text-[15px] leading-[20px] font-semibold text-primary" numberOfLines={2}>
                                    {formatCategorizeInboxMerchantTitle(displayTitle)}
                                </Text>
                                <CategorizeInboxGroupRowAmount cluster={cluster} />
                            </View>
                            <CategorizeInboxGroupRowSubtitle cluster={cluster} />
                        </View>
                        {linkTrailingSlot}
                    </HapticPressable>
                </Link>
                {rowTrailingSlot}
            </View>
        </CategorizeInboxCardRow>
    );
};
