import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { Icon } from '../../icon/icon';

interface Props {
    readonly isSelected: boolean;
    readonly isPartiallySelected?: boolean;
    readonly testID?: string;
}

const checkboxVariants = cva('size-[22px] items-center justify-center rounded-full', {
    variants: {
        isFilled: {
            true: 'bg-primary',
            false: 'border-2 border-secondary-corner'
        }
    }
});

export const FilterSheetCheckbox = ({ isSelected, isPartiallySelected = false, testID }: Props) => {
    const isFilled = isSelected || isPartiallySelected;
    const icon = isSelected ? UserIconNameEnum.Check : UserIconNameEnum.Minus;

    return (
        <View className={checkboxVariants({ isFilled })} testID={testID} pointerEvents="none">
            {isFilled ? <Icon icon={icon} size={14} className="text-primary-reverse" /> : null}
        </View>
    );
};
