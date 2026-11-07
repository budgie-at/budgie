import { UserIconNameEnum } from '@budgie/contracts';
import { useController } from 'react-hook-form';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { NeutralIconTile } from '../../../@generic/component/neutral-icon-tile/neutral-icon-tile';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { InzhurSelector } from '../../selector/inzhur.selector';

import type { InzhurPurchaseFormValues } from '../../constant/inzhur-purchase-form-schema.constant';
import type { InzhurFundOptionInterface } from '../../interface/inzhur-fund-option.interface';

interface Props {
    readonly fund: InzhurFundOptionInterface;
}

export const InzhurPurchaseFundOption = ({ fund }: Props) => {
    const { field } = useController<InzhurPurchaseFormValues, 'fundName'>({ name: 'fundName' });

    const accessibilityState = { selected: field.value === fund.name };
    const handlePress = () => void field.onChange(fund.name);

    return (
        <HapticPressable
            className="min-h-[50px] flex-row items-center gap-x-xl px-3xl py-lg active:opacity-70"
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            onPress={handlePress}
            pressFeedback={HapticPressFeedbackEnum.SELECTION}
            testID={InzhurSelector.PurchaseFund(fund.name)}
        >
            <NeutralIconTile icon={fund.icon} />
            <Text className="text-primary flex-1 text-[17px]" numberOfLines={1}>
                {fund.title}
            </Text>
            <View className="size-5">
                {field.value === fund.name ? <Icon icon={UserIconNameEnum.Check} size={20} className="text-primary" /> : null}
            </View>
        </HapticPressable>
    );
};
