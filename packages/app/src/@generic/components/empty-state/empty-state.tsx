import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { ICONS, IconName } from '../../constant/icons.constant';
import { cn } from '../../utils/cn.util';
import { Icon } from '../icon/icon';

interface Props {
    readonly title: string;
    readonly icon?: IconName;
    readonly className?: string;
    readonly description: string;
    readonly iconClassName?: string;
    readonly titleClassName?: string;
    readonly descriptionClassName?: string;
}

const wrapperVariants = cva('items-center justify-center ', {
    variants: {
        hasIcon: {
            true: 'py-[30px]',
            false: 'pb-[30px] pt-[65px]'
        }
    }
});

export const EmptyState = ({ title, description, className, titleClassName, descriptionClassName, icon, iconClassName }: Props) => (
    <View className={cn(wrapperVariants({ hasIcon: isNotEmptyString(icon) }), className)}>
        {isNotEmptyString(icon) && <Icon icon={ICONS[icon]} className={cn('text-secondary-foreground mb-xl', iconClassName)} size={48} />}

        <Text className={cn('text-secondary-foreground text-md mb-sm', titleClassName)}>{title}</Text>
        <Text className={cn('text-secondary-foreground/70 text-xs', descriptionClassName)}>{description}</Text>
    </View>
);
