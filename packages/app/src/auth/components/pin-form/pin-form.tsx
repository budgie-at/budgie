import { UserIconNameEnum } from '@budgie/contracts';
import React from 'react';
import { Text, View } from 'react-native';

import { EmptyFn, emptyFn, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { Shake } from '../../../@generic/component/shake/shake';
import { PinFormButton } from '../pin-form-button/pin-form-button';
import { PinFormDots } from '../pin-form-dots/pin-form-dots';
import { PinFormSelector as PinPageSelectors } from './pin-form.selector';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly currentInput: string;
    readonly error: string | null;
    readonly isLoading: boolean;
    readonly onDigitPress: (digit: string) => void;
    readonly onDeletePress: EmptyFn;
    readonly onScanPress?: EmptyFn;
    readonly canScan?: boolean;
}

export const PinForm = (props: Props) => {
    const { title, currentInput, description, error, isLoading, onDigitPress, onDeletePress, canScan, onScanPress = emptyFn } = props;
    const canDelete = isNotEmptyString(currentInput) && !isLoading;

    return (
        <View className="flex-1 justify-center" testID={PinPageSelectors.Container}>
            <View className="border border-secondary-corner bg-secondary-background rounded-7xl p-5xl mx-auto mb-7xl">
                <Icon icon={UserIconNameEnum.Lock} className="text-primary" size={40} />
            </View>

            <Text className="text-3xl font-semibold text-primary text-center mb-md" testID={PinPageSelectors.Title}>
                {title}
            </Text>
            <Text className="text-md text-secondary-foreground text-center mb-7xl">{description}</Text>

            <Shake isEnabled={isNotEmptyString(error)}>
                <PinFormDots filled={currentInput.length} />
            </Shake>

            {isNotEmptyString(error) ? (
                <Text className="text-sm text-destructive-foreground text-center mt-5xl" testID={PinPageSelectors.Error}>
                    {error}
                </Text>
            ) : null}

            <View className="mt-8xl gap-y-lg items-center">
                <View className="flex-row gap-x-lg">
                    {['1', '2', '3'].map(digit => (
                        <PinFormButton key={digit} digit={digit} onPress={onDigitPress} disabled={isLoading} />
                    ))}
                </View>

                <View className="flex-row gap-x-lg">
                    {['4', '5', '6'].map(digit => (
                        <PinFormButton key={digit} digit={digit} onPress={onDigitPress} disabled={isLoading} />
                    ))}
                </View>

                <View className="flex-row gap-x-lg">
                    {['7', '8', '9'].map(digit => (
                        <PinFormButton key={digit} digit={digit} onPress={onDigitPress} disabled={isLoading} />
                    ))}
                </View>

                <View className="flex-row gap-x-lg items-center">
                    <HapticPressable
                        disabled={!canScan}
                        onPress={onScanPress}
                        testID={PinPageSelectors.BiometricButton}
                        className="flex-1 aspect-square rounded-3xl justify-center items-center max-w-23"
                    >
                        {canScan ? <Icon icon={UserIconNameEnum.ScanFace} className="text-primary" size={16} /> : null}
                    </HapticPressable>

                    <PinFormButton digit="0" onPress={onDigitPress} disabled={isLoading} />

                    <HapticPressable
                        disabled={!canDelete}
                        onPress={onDeletePress}
                        testID={PinPageSelectors.DeleteButton}
                        className="flex-1 aspect-square border border-secondary-corner bg-secondary-background rounded-3xl justify-center items-center max-w-23"
                    >
                        <Icon icon={UserIconNameEnum.Delete} className="text-primary" size={16} />
                    </HapticPressable>
                </View>
            </View>
        </View>
    );
};
