import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { Icon } from '../../icon/icon';

interface Props {
    readonly isSelected: boolean;
    readonly testID?: string;
}

const checkVariants = cva('h-5 w-5 items-center justify-center rounded-full border', {
    variants: {
        isSelected: {
            true: 'border-primary bg-primary',
            false: 'border-secondary-corner bg-transparent'
        }
    }
});

export const FilterRowCheck = ({ isSelected, testID }: Props) => (
    <View className={checkVariants({ isSelected })} testID={testID}>
        {isSelected ? <Icon size={12} icon={UserIconNameEnum.Check} className="text-primary-reverse" /> : null}
    </View>
);
