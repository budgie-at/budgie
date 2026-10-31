import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { CategorizeInboxCardRow } from '../categorize-inbox-card-row/categorize-inbox-card-row';

import { CategorizeInboxOneOffsLinkSelector } from './categorize-inbox-one-offs-link.selector';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly oneOffs: CategorizeInboxClusterInterface[];
    readonly position: TransactionListRowPositionEnum;
}

export const CategorizeInboxOneOffsLink = ({ oneOffs, position }: Props) => {
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
        <CategorizeInboxCardRow position={position}>
            <Link href={href} asChild>
                <HapticPressable
                    className="flex-row items-center gap-x-xl px-3xl py-xl active:opacity-70"
                    accessibilityRole="link"
                    testID={CategorizeInboxOneOffsLinkSelector.Link}
                >
                    <View
                        className="h-[36px] w-[36px] items-center justify-center rounded-full bg-surface-disc"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    >
                        <Icon icon={UserIconNameEnum.Layers} size={18} className="text-secondary-foreground" />
                    </View>
                    <Text className="min-w-0 flex-1 text-[15px] font-semibold text-primary" numberOfLines={1}>
                        {groupsText}
                    </Text>
                    <Text className="shrink-0 text-[13px] text-secondary-foreground tabular-nums">{paymentsText}</Text>
                </HapticPressable>
            </Link>
        </CategorizeInboxCardRow>
    );
};
