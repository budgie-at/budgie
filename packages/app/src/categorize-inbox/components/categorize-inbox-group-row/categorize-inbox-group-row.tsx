import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { UserIconNameEnum } from '@budgie/contracts';
import { Link } from 'expo-router';
import { useWindowDimensions, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { CategorizeInboxCardRow } from '../categorize-inbox-card-row/categorize-inbox-card-row';
import { CategorizeInboxGroupRowCashButton } from '../categorize-inbox-group-row-cash-button/categorize-inbox-group-row-cash-button';
import { CategorizeInboxGroupRowColumns } from '../categorize-inbox-group-row-columns/categorize-inbox-group-row-columns';
import { CategorizeInboxGroupRowFileButton } from '../categorize-inbox-group-row-file-button/categorize-inbox-group-row-file-button';
import { CategorizeInboxGroupRowStackedBody } from '../categorize-inbox-group-row-stacked-body/categorize-inbox-group-row-stacked-body';
import { CategorizeInboxMerchantBadge } from '../categorize-inbox-merchant-badge/categorize-inbox-merchant-badge';

import { CategorizeInboxGroupRowSelector } from './categorize-inbox-group-row.selector';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly position: TransactionListRowPositionEnum;
}

const STACKED_FONT_SCALE = 1.3;

export const CategorizeInboxGroupRow = ({ cluster, position }: Props) => {
    const { fontScale } = useWindowDimensions();

    const { key, section } = cluster;
    const isCash = section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS;
    const hasAction = isCash || section === CategorizeInboxSectionEnum.CONFIDENT;

    const href = { pathname: '/categorize/group/[key]', params: { key } } as const;
    const linkClassName = hasAction
        ? 'min-h-[64px] min-w-0 flex-1 flex-row items-center gap-x-lg py-xl pr-xl pl-3xl active:opacity-70'
        : 'min-h-[64px] min-w-0 flex-1 flex-row items-center gap-x-lg py-xl pr-3xl pl-3xl active:opacity-70';
    const body =
        fontScale >= STACKED_FONT_SCALE ? (
            <CategorizeInboxGroupRowStackedBody cluster={cluster} />
        ) : (
            <CategorizeInboxGroupRowColumns cluster={cluster} />
        );
    const actionButton = isCash ? (
        <CategorizeInboxGroupRowCashButton cluster={cluster} />
    ) : (
        <CategorizeInboxGroupRowFileButton cluster={cluster} />
    );
    const actionSlot = hasAction ? <View className="mr-3xl items-center justify-center">{actionButton}</View> : null;
    const chevronSlot = hasAction ? null : (
        <View className="w-[24px] items-end">
            <Icon icon={UserIconNameEnum.ChevronRight} size={13} className="text-secondary-foreground" />
        </View>
    );

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
                        {body}
                        {chevronSlot}
                    </HapticPressable>
                </Link>
                {actionSlot}
            </View>
        </CategorizeInboxCardRow>
    );
};
