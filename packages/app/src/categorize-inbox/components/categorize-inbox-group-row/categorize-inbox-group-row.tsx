import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';
import { formatCategorizeInboxMerchantTitle } from '../../utils/format-categorize-inbox-merchant-title.util';
import { CategorizeInboxCardRow } from '../categorize-inbox-card-row/categorize-inbox-card-row';
import { CategorizeInboxGroupRowAmount } from '../categorize-inbox-group-row-amount/categorize-inbox-group-row-amount';
import { CategorizeInboxGroupRowCashButton } from '../categorize-inbox-group-row-cash-button/categorize-inbox-group-row-cash-button';
import { CategorizeInboxGroupRowFileButton } from '../categorize-inbox-group-row-file-button/categorize-inbox-group-row-file-button';
import { CategorizeInboxGroupRowHint } from '../categorize-inbox-group-row-hint/categorize-inbox-group-row-hint';
import { CategorizeInboxMerchantBadge } from '../categorize-inbox-merchant-badge/categorize-inbox-merchant-badge';
import { CategorizeInboxOptionChevron } from '../categorize-inbox-option-chevron/categorize-inbox-option-chevron';

import { CategorizeInboxGroupRowSelector } from './categorize-inbox-group-row.selector';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { CategorizeInboxClusterInterface } from '@budgie/categorization';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly position: TransactionListRowPositionEnum;
}

export const CategorizeInboxGroupRow = ({ cluster, position }: Props) => {
    const { t } = useLingui();
    const [actionWidth, setActionWidth] = useState(0);

    const { key, displayTitle, rows, section } = cluster;
    const isCash = section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS;
    const isConfident = section === CategorizeInboxSectionEnum.CONFIDENT;
    const hasAction = isCash || isConfident;
    const countText = isCash
        ? t({ message: plural(rows.length, { one: '# ATM withdrawal', other: '# ATM withdrawals' }) })
        : t({ message: plural(rows.length, { one: '# payment', other: '# payments' }) });

    const merchantTitle = formatCategorizeInboxMerchantTitle(displayTitle);
    const href = { pathname: '/categorize/group/[key]', params: { key } } as const;
    const actionSpacerStyle = { width: actionWidth };
    const trailing = hasAction ? <View style={actionSpacerStyle} /> : <CategorizeInboxGroupRowHint cluster={cluster} />;
    const action = isCash ? (
        <CategorizeInboxGroupRowCashButton cluster={cluster} />
    ) : (
        <CategorizeInboxGroupRowFileButton cluster={cluster} />
    );

    const handleActionLayout = (event: LayoutChangeEvent) => void setActionWidth(event.nativeEvent.layout.width);

    return (
        <CategorizeInboxCardRow position={position}>
            <Link href={href} asChild>
                <HapticPressable
                    className="flex-row items-center gap-x-xl px-3xl py-xl active:opacity-70"
                    accessibilityRole="link"
                    {...testID(CategorizeInboxGroupRowSelector.Row, key)}
                >
                    <CategorizeInboxMerchantBadge cluster={cluster} />
                    <View className="min-w-0 flex-1 gap-y-xxs">
                        <View className="flex-row items-baseline gap-x-md">
                            <Text className="flex-1 text-[15px] font-semibold text-primary" numberOfLines={1}>
                                {merchantTitle}
                            </Text>
                            <CategorizeInboxGroupRowAmount cluster={cluster} />
                        </View>
                        <View className="h-[26px] flex-row items-center justify-between gap-x-md">
                            <Text className="shrink text-[13px] text-secondary-foreground tabular-nums" numberOfLines={1}>
                                {countText}
                            </Text>
                            {trailing}
                        </View>
                    </View>
                    <CategorizeInboxOptionChevron />
                </HapticPressable>
            </Link>

            {hasAction ? (
                <View className="absolute bottom-[12px] left-[140px] right-[46px] items-end" pointerEvents="box-none">
                    <View className="max-w-full" onLayout={handleActionLayout}>
                        {action}
                    </View>
                </View>
            ) : null}
        </CategorizeInboxCardRow>
    );
};
