import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';
import { CategorizeInboxGroupRowAmount } from '../categorize-inbox-group-row-amount/categorize-inbox-group-row-amount';
import { CategorizeInboxGroupRowHint } from '../categorize-inbox-group-row-hint/categorize-inbox-group-row-hint';

import { CategorizeInboxGroupRowSelector } from './categorize-inbox-group-row.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupRow = ({ cluster }: Props) => {
    const { t } = useLingui();

    const { key, displayTitle, rows, section } = cluster;
    const countText =
        section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS
            ? t({ message: plural(rows.length, { one: '# ATM withdrawal', other: '# ATM withdrawals' }) })
            : t({ message: plural(rows.length, { one: '# payment', other: '# payments' }) });

    const href = { pathname: '/categorize/group/[key]', params: { key } } as const;

    return (
        <Link href={href} asChild>
            <HapticPressable
                className="gap-y-xxs border-t-hairline border-secondary-corner py-lg active:bg-secondary-background"
                accessibilityRole="link"
                {...testID(CategorizeInboxGroupRowSelector.Row, key)}
            >
                <View className="flex-row items-baseline justify-between gap-x-xl">
                    <Text className="shrink text-md font-semibold text-primary" numberOfLines={1}>
                        {displayTitle}
                    </Text>
                    <CategorizeInboxGroupRowAmount cluster={cluster} />
                </View>

                <View className="flex-row items-center justify-between gap-x-xl">
                    <Text className="text-xs text-secondary-foreground tabular-nums" numberOfLines={1}>
                        {countText}
                    </Text>
                    <CategorizeInboxGroupRowHint cluster={cluster} />
                </View>
            </HapticPressable>
        </Link>
    );
};
