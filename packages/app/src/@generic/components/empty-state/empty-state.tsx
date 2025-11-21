import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { IconName, ICONS } from '../../constant/icons.constant';
import { cn } from '../../utils/cn.util';
import { CircleIcon } from '../circle-icon/circle-icon';
import { Icon } from '../icon/icon';

interface Props {
    readonly title: string;
    readonly icon?: IconName;
    readonly className?: string;
    readonly description: string;
    readonly circleIcon?: IconName;
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

export const EmptyState = (props: Props) => {
    const { title, description, className, circleIcon, titleClassName, descriptionClassName, icon, iconClassName } = props;

    return (
        <View className={cn(wrapperVariants({ hasIcon: isNotEmptyString(icon) }), className)}>
            {isNotEmptyString(icon) && (
                <Icon icon={ICONS[icon]} className={cn('text-secondary-foreground mb-xl', iconClassName)} size={48} />
            )}
            {isNotEmptyString(circleIcon) && (
                <CircleIcon
                    icon={ICONS[circleIcon]}
                    size="3xl"
                    variant="ghost"
                    className={cn('text-secondary-foreground mb-xl rounded-5xl', iconClassName)}
                />
            )}

            <Text className={cn('text-secondary-foreground text-md mb-sm', titleClassName)}>{title}</Text>
            <Text className={cn('text-secondary-foreground/70 text-xs', descriptionClassName)}>{description}</Text>
        </View>
    );
};
