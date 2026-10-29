import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';
import { CategorizeInboxGroupRowAmount } from '../categorize-inbox-group-row-amount/categorize-inbox-group-row-amount';
import { CategorizeInboxGroupRowCashButton } from '../categorize-inbox-group-row-cash-button/categorize-inbox-group-row-cash-button';
import { CategorizeInboxGroupRowFileButton } from '../categorize-inbox-group-row-file-button/categorize-inbox-group-row-file-button';
import { CategorizeInboxGroupRowHint } from '../categorize-inbox-group-row-hint/categorize-inbox-group-row-hint';
import { CategorizeInboxOptionChevron } from '../categorize-inbox-option-chevron/categorize-inbox-option-chevron';

import { CategorizeInboxGroupRowSelector } from './categorize-inbox-group-row.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupRow = ({ cluster }: Props) => {
    const { t } = useLingui();

    const { key, displayTitle, rows, section } = cluster;
    const isCash = section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS;
    const isConfident = section === CategorizeInboxSectionEnum.CONFIDENT;
    const countText = isCash
        ? t({ message: plural(rows.length, { one: '# ATM withdrawal', other: '# ATM withdrawals' }) })
        : t({ message: plural(rows.length, { one: '# payment', other: '# payments' }) });

    const href = { pathname: '/categorize/group/[key]', params: { key } } as const;

    return (
        <View className="border-t-hairline border-secondary-corner">
            <Link href={href} asChild>
                <HapticPressable
                    className="flex-row items-center gap-x-md py-lg active:bg-secondary-background"
                    accessibilityRole="link"
                    {...testID(CategorizeInboxGroupRowSelector.Row, key)}
                >
                    <View className="flex-1 gap-y-xxs">
                        <Text className="text-md font-semibold text-primary" numberOfLines={1}>
                            {displayTitle}
                        </Text>
                        <Text className="text-xs text-secondary-foreground tabular-nums" numberOfLines={1}>
                            {countText}
                        </Text>
                    </View>

                    <View className="max-w-[55%] items-end gap-y-xxs">
                        <CategorizeInboxGroupRowAmount cluster={cluster} />
                        {isCash || isConfident ? <View className="h-[22px]" /> : <CategorizeInboxGroupRowHint cluster={cluster} />}
                    </View>
                    <CategorizeInboxOptionChevron />
                </HapticPressable>
            </Link>

            <View className="absolute bottom-[10px] right-[30px] max-w-[55%]">
                {isCash ? <CategorizeInboxGroupRowCashButton cluster={cluster} /> : null}
                {isConfident ? <CategorizeInboxGroupRowFileButton cluster={cluster} /> : null}
            </View>
        </View>
    );
};
