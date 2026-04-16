import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly steps: readonly string[];
    readonly fileIcon: UserIconNameEnum;
    readonly fileTypeLabel: string;
    readonly selectFileText: string;
    readonly onSelectFile: () => void;
    readonly isLoading: boolean;
}

const STEP_STAGGER_MS = 80;
const STEP_INITIAL_DELAY_MS = 40;
const STEP_ANIMATION_DURATION_MS = 240;
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
            <View className="gap-y-md">
                <Text className="px-md text-xs font-semibold uppercase tracking-widest text-secondary-foreground">{t`How to export`}</Text>

                <View className="gap-y-sm">
                    {steps.map((step, index) => (
                        <Animated.View
                            key={step}
                            entering={FadeInDown.delay(STEP_INITIAL_DELAY_MS + STEP_STAGGER_MS * index).duration(
                                STEP_ANIMATION_DURATION_MS
                            )}
                            className="flex-row items-center gap-x-md rounded-2xl bg-secondary-background p-md"
                        >
                            <View className="h-7 w-7 items-center justify-center rounded-full bg-primary-reverse">
                                <Text className="text-sm font-bold text-primary">{index + 1}</Text>
                            </View>
                            <Text className="flex-1 text-sm leading-snug text-primary">{step}</Text>
                        </Animated.View>
                    ))}
                </View>
            </View>

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
