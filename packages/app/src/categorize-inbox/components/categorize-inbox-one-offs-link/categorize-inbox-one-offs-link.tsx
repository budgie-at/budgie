import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

import { CategorizeInboxOneOffsLinkSelector } from './categorize-inbox-one-offs-link.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly oneOffs: CategorizeInboxClusterInterface[];
}

export const CategorizeInboxOneOffsLink = ({ oneOffs }: Props) => {
    const { t } = useLingui();

    const groupsText = t({ message: plural(oneOffs.length, { one: 'Show # more group', other: 'Show # more groups' }) });
    const paymentsText = t({
        message: plural(
            oneOffs.reduce((total, cluster) => total + cluster.rows.length, 0),
            { one: '# payment', other: '# payments' }
        )
    });

    const href = { pathname: '/categorize/one-offs' } as const;

    return (
        <Link href={href} asChild>
            <HapticPressable
                className="flex-row items-center justify-between gap-x-xl border-t-hairline border-secondary-corner py-xl active:bg-secondary-background"
                accessibilityRole="link"
                testID={CategorizeInboxOneOffsLinkSelector.Link}
            >
                <Text className="shrink text-sm font-medium text-primary" numberOfLines={1}>
                    {groupsText}
                </Text>
                <View className="shrink-0 flex-row items-center gap-x-xs">
                    <Text className="text-xs text-secondary-foreground tabular-nums">{paymentsText}</Text>
                    <Icon icon={UserIconNameEnum.ChevronRight} size={14} className="text-secondary-foreground" />
                </View>
            </HapticPressable>
        </Link>
    );
};
