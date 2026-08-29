import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { NumberedSteps } from '../numbered-steps/numbered-steps';

interface Props {
    readonly steps: readonly string[];
    readonly fileIcon: UserIconNameEnum;
    readonly fileTypeLabel: string;
    readonly selectFileText: string;
    readonly onSelectFile: () => void;
    readonly isLoading: boolean;
}

const DROP_ZONE_DELAY_MS = 260;
const DROP_ZONE_ANIMATION_DURATION_MS = 320;
const DROP_ZONE_ICON_SIZE = 72;
const DROP_ZONE_ICON_RADIUS = 36;
const DROP_ZONE_ICON_INNER = 36;

export const FileUploadStep = (props: Props) => {
    const { steps, fileIcon, fileTypeLabel, selectFileText, onSelectFile, isLoading } = props;
    const { t } = useLingui();

    return (
        <View className="gap-y-2xl pt-md">
            <NumberedSteps title={t`How to export`} steps={steps} />

            <Animated.View entering={FadeInDown.delay(DROP_ZONE_DELAY_MS).duration(DROP_ZONE_ANIMATION_DURATION_MS)}>
                <HapticPressable onPress={onSelectFile} disabled={isLoading}>
                    <View className="items-center rounded-3xl border-2 border-dashed border-secondary-corner bg-secondary-background/40 px-xl py-3xl">
                        <CircleIcon
                            icon={fileIcon}
                            variant="primary"
                            size={DROP_ZONE_ICON_SIZE}
                            iconSize={DROP_ZONE_ICON_INNER}
                            radius={DROP_ZONE_ICON_RADIUS}
                        />
                        <Text className="mt-lg text-2xl font-bold tracking-tight text-primary">{fileTypeLabel}</Text>
                        <Text className="mt-xs px-md text-center text-sm text-secondary-foreground">{selectFileText}</Text>
                        <View className="mt-lg flex-row items-center gap-x-xs rounded-full bg-primary-reverse px-md py-xs">
                            <Text className="text-xs font-semibold text-primary">{t`Tap to select`}</Text>
                        </View>
                    </View>
                </HapticPressable>
            </Animated.View>
        </View>
    );
};
