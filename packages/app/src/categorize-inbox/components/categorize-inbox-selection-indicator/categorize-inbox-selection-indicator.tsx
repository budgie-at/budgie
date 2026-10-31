import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly variant: 'positive' | 'neutral';
    readonly isSelected: boolean;
}

const discVariants = cva('size-[24px] items-center justify-center rounded-full', {
    variants: { variant: { positive: 'bg-positive-action', neutral: 'bg-primary' } }
});

const checkVariants = cva('', {
    variants: { variant: { positive: 'text-positive-action-foreground', neutral: 'text-primary-reverse' } }
});

export const CategorizeInboxSelectionIndicator = ({ variant, isSelected }: Props) => {
    if (isSelected) {
        return (
            <View className={discVariants({ variant })}>
                <Icon icon={UserIconNameEnum.Check} size={15} className={checkVariants({ variant })} />
            </View>
        );
    }

    return <View className="size-[24px] rounded-full border-2 border-secondary-foreground/50" />;
};
