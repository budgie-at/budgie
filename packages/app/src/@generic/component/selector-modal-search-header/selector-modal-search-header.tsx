import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';
import { SearchInput } from '../search-input/search-input';

interface Props {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly placeholder?: string;
    readonly rightActionIcon?: UserIconNameEnum;
    readonly rightActionOnPress?: () => void;
    readonly rightActionTestID?: string;
    readonly testID?: string;
}

export const SelectorModalSearchHeader = (props: Props) => {
    const { search, onSearchChange, placeholder, rightActionIcon, rightActionOnPress, rightActionTestID, testID } = props;
    const { t } = useLingui();

    const hasRightAction = isDefined(rightActionIcon) && isDefined(rightActionOnPress);

    return (
        <View collapsable={false} className="absolute top-0 left-0 right-0 z-10 pt-4xl pb-lg px-xl bg-primary-reverse">
            <View className="flex-row items-center gap-x-md">
                <SearchInput
                    value={search}
                    onChangeText={onSearchChange}
                    placeholder={placeholder ?? t`Search...`}
                    testID={testID}
                    containerClassName="flex-1"
                />
                {hasRightAction && (
                    <HapticPressable
                        onPress={rightActionOnPress}
                        className="h-[48px] w-[48px] items-center justify-center rounded-full bg-white"
                        testID={rightActionTestID}
                    >
                        <Icon icon={rightActionIcon} size={22} className="text-black" />
                    </HapticPressable>
                )}
            </View>
        </View>
    );
};
