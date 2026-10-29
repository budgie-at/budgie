import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

import { CategorizeInboxOneOffsLinkSelector } from './categorize-inbox-one-offs-link.selector';

export const CategorizeInboxOneOffsLink = () => {
    const { t } = useLingui();
    const { items } = useCategorizeInboxContext();

    const oneOffs = items.flatMap(item => ('rows' in item && item.section === CategorizeInboxSectionEnum.ONE_OFFS ? [item] : []));

    if (isEmptyArray(oneOffs)) {
        return null;
    }

    const groupsText = t({ message: plural(oneOffs.length, { one: '# smaller group', other: '# smaller groups' }) });
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
                <Text className="shrink text-sm text-secondary-foreground" numberOfLines={1}>
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
