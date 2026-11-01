import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly isDisabled: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const TransactionKeypadConfirmButton = ({ isDisabled, onPress, testID }: Props) => {
    const { t } = useLingui();
    const backgroundClassName = isDisabled ? 'bg-cta-disabled-background' : 'bg-cta-background active:opacity-80';
    const contentClassName = isDisabled ? 'text-cta-disabled-foreground' : 'text-cta-foreground';
    const accessibilityState = { disabled: isDisabled };

    return (
        <HapticPressable
            accessibilityLabel={t`Save`}
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            className={cn('h-[56px] flex-[2] items-center justify-center rounded-xl', backgroundClassName)}
            disabled={isDisabled}
            onPress={onPress}
            style={CONTINUOUS_CORNERS}
        >
            <View className="flex-row items-center gap-x-sm" collapsable={false} testID={testID}>
                <Icon className={contentClassName} icon={UserIconNameEnum.Check} size={20} />
                <Text className={cn('text-[17px] font-semibold', contentClassName)}>
                    <Trans>Save</Trans>
                </Text>
            </View>
        </HapticPressable>
    );
};
