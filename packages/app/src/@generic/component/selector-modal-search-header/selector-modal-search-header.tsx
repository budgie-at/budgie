import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { TextInput, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly placeholder?: string;
    readonly rightActionIcon?: UserIconNameEnum;
    readonly rightActionOnPress?: () => void;
}

export const SelectorModalSearchHeader = (props: Props) => {
    const { search, onSearchChange, placeholder, rightActionIcon, rightActionOnPress } = props;
    const { t } = useLingui();

    const hasRightAction = isDefined(rightActionIcon) && isDefined(rightActionOnPress);

    return (
        <View collapsable={false} className="absolute top-0 left-0 right-0 z-10 pt-4xl pb-lg px-xl bg-primary-reverse">
            <View className="flex-row items-center gap-x-md">
                <View className="flex-1 flex-row items-center rounded-5xl bg-secondary-background h-[50px] px-lg border border-secondary-corner">
                    <Icon icon={UserIconNameEnum.Search} size={20} className="text-secondary-foreground" />
                    <TextInput
                        className="flex-1 text-primary text-md ml-sm"
                        value={search}
                        onChangeText={onSearchChange}
                        placeholder={placeholder ?? t`Search...`}
                        placeholderTextColor="rgba(128, 128, 128, 0.6)"
                        autoCapitalize="none"
                        autoCorrect={false}
                        clearButtonMode="while-editing"
                    />
                </View>
                {hasRightAction && (
                    <HapticPressable
                        onPress={rightActionOnPress}
                        className="h-[48px] w-[48px] items-center justify-center rounded-full bg-white"
                    >
                        <Icon icon={rightActionIcon} size={22} className="text-black" />
                    </HapticPressable>
                )}
            </View>
        </View>
    );
};
