import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly canAddEntry: boolean;
    readonly onAddEntry: () => void;
}

const ADD_ICON_SIZE = 20;
const ANIMATION_DURATION = 200;

export const SplitEntriesAddItemFooter = ({ canAddEntry, onAddEntry }: Props) => (
    <View>
        {canAddEntry ? (
            <Animated.View entering={FadeIn.duration(ANIMATION_DURATION)} exiting={FadeOut.duration(ANIMATION_DURATION)}>
                <HapticPressable
                    className="flex-row items-center justify-center gap-x-md py-xl mt-md rounded-3xl border-2 border-dashed border-secondary-corner"
                    onPress={onAddEntry}
                >
                    <Icon icon={UserIconNameEnum.Plus} size={ADD_ICON_SIZE} className="text-primary" />
                    <Text className="text-sm font-semibold text-primary">
                        <Trans>Add item</Trans>
                    </Text>
                </HapticPressable>
            </Animated.View>
        ) : null}
    </View>
);
