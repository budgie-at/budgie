import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
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
    const trailing = hasAction ? (
        <View className="items-end gap-y-xxs">
            <CategorizeInboxGroupRowAmount cluster={cluster} />
            <View className="h-[32px] w-[88px]" />
        </View>
    ) : (
        <CategorizeInboxGroupRowAmount cluster={cluster} />
    );
    const action = isCash ? (
        <CategorizeInboxGroupRowCashButton cluster={cluster} />
    ) : (
        <CategorizeInboxGroupRowFileButton cluster={cluster} />
    );

    return (
        <CategorizeInboxCardRow position={position}>
            <Link href={href} asChild>
                <HapticPressable
                    className="min-h-[64px] flex-row items-center gap-x-xl px-3xl py-lg active:opacity-70"
                    accessibilityRole="link"
                    {...testID(CategorizeInboxGroupRowSelector.Row, key)}
                >
                    <CategorizeInboxMerchantBadge cluster={cluster} />
                    <View className="min-w-0 flex-1 gap-y-xxs">
                        <Text className="text-[15px] leading-[20px] font-semibold text-primary" numberOfLines={2}>
                            {formatCategorizeInboxMerchantTitle(displayTitle)}
                        </Text>
                        <CategorizeInboxGroupRowSubtitle cluster={cluster} />
                    </View>
                    {trailing}
                </HapticPressable>
            </Link>

            {hasAction ? (
                <View className="absolute inset-y-0 right-[16px] items-end justify-center gap-y-xxs" pointerEvents="box-none">
                    <View
                        className="opacity-0"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        pointerEvents="none"
                    >
                        <CategorizeInboxGroupRowAmount cluster={cluster} />
                    </View>
                    {action}
                </View>
            ) : null}
        </CategorizeInboxCardRow>
    );
};
