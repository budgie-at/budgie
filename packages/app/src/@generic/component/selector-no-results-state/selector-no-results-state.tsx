import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';
import { SelectorSearchEmptyState } from '../selector-search-empty-state/selector-search-empty-state';

interface Props {
    readonly query: string;
    readonly hint: string;
    readonly onCreate: () => void;
}

export const SelectorNoResultsState = ({ query, hint, onCreate }: Props) => {
    const { t } = useLingui();
    const createLabel = t`Create “${query}”`;

    return (
        <SelectorSearchEmptyState query={query} hint={hint}>
            <HapticPressable
                onPress={onCreate}
                className="mt-md h-[44px] flex-row items-center gap-x-sm rounded-full bg-surface-disc px-2xl active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={createLabel}
            >
                <Icon icon={UserIconNameEnum.Plus} size={16} className="text-primary" />
                <Text className="text-primary text-[15px] font-semibold" numberOfLines={1}>
                    {createLabel}
                </Text>
            </HapticPressable>
        </SelectorSearchEmptyState>
    );
};
