import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { cn } from '../../utils/cn.util';
import { CircleIcon } from '../circle-icon/circle-icon';
import { Icon } from '../icon/icon';

interface Props {
    readonly title: string;
    readonly icon?: UserIconNameEnum;
    readonly className?: string;
    readonly description: string;
    readonly circleIcon?: UserIconNameEnum;
    readonly iconClassName?: string;
    readonly titleClassName?: string;
    readonly descriptionClassName?: string;
    readonly testID?: string;
}

const wrapperVariants = cva('items-center justify-center', {
    variants: {
        hasIcon: {
            true: 'py-[30px]',
            false: 'pb-[30px] pt-[65px]'
        }
    }
});

export const EmptyState = (props: Props) => {
    const { title, description, className, circleIcon, titleClassName, descriptionClassName, icon, iconClassName, testID } = props;

    return (
        <View className={cn(wrapperVariants({ hasIcon: isNotEmptyString(icon) }), className)} testID={testID}>
            {isNotEmptyString(icon) && <Icon icon={icon} className={cn('text-secondary-foreground mb-xl', iconClassName)} size={48} />}
            {isNotEmptyString(circleIcon) && (
                <CircleIcon
                    icon={circleIcon}
                    size={64}
                    iconSize={32}
                    variant="ghost"
                    className={cn('text-secondary-foreground mb-xl rounded-5xl', iconClassName)}
                />
            )}

            <Text className={cn('text-secondary-foreground text-md mb-sm', titleClassName)}>{title}</Text>
            <Text className={cn('text-secondary-foreground/70 text-xs', descriptionClassName)}>{description}</Text>
        </View>
    );
};
