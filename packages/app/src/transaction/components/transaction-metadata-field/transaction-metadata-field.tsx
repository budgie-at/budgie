import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Text, useWindowDimensions, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly value?: string;
    readonly accessibilityValue?: string;
    readonly onPress: () => void;
    readonly testID: string;
}

export const TransactionMetadataField = ({ icon, label, value, accessibilityValue, onPress, testID }: Props) => {
    const { fontScale } = useWindowDimensions();
    const hasValue = isNotEmptyString(value);
    const accessibilityLabel = `${label}: ${accessibilityValue ?? value ?? t`not set`}`;
    const displayValue = hasValue ? value : t`not set`;
    const valueClassName = hasValue ? 'text-[17px] leading-[22px] text-primary' : 'text-[17px] leading-[22px] text-secondary-foreground';

    if (fontScale > 1) {
        return (
            <TransactionFieldIcon
                icon={icon}
                label={label}
                value={displayValue}
                accessibilityValue={accessibilityValue}
                onPress={onPress}
                testID={testID}
            />
        );
    }

    return (
        <HapticPressable
            className="min-h-[60px] min-w-0 flex-1 flex-row items-center gap-x-[12px] bg-grouped-surface-row px-[16px] py-[8px] active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={onPress}
            testID={testID}
        >
            <View className="h-[28px] w-[28px] items-center justify-center">
                <Icon icon={icon} size={20} className="text-secondary-foreground" />
            </View>
            <View className="min-w-0 flex-1 gap-y-[4px]">
                <Text className="text-[13px] leading-[18px] text-secondary-foreground" numberOfLines={1}>
                    {label}
                </Text>

                <Text className={valueClassName} numberOfLines={2} ellipsizeMode="tail" {...testIDProps(testID, TestIDPartEnum.TITLE)}>
                    {displayValue}
                </Text>
            </View>
            <Icon icon={UserIconNameEnum.ChevronRight} size={12} className="text-secondary-foreground" />
        </HapticPressable>
    );
};
