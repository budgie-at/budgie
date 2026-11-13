import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Pressable, View } from 'react-native';

import { cn } from '../../utils/cn.util';
import { Icon } from '../icon/icon';

interface Props {
    readonly onPress: () => void;
    readonly className?: string;
}

export const InputClearButton = ({ onPress, className }: Props) => {
    const { t } = useLingui();

    return (
        <Pressable
            accessibilityLabel={t`Tap to clear`}
            accessibilityRole="button"
            className={cn('h-[32px] w-[32px] items-center justify-center', className)}
            hitSlop={8}
            onPress={onPress}
        >
            <View className="h-[18px] w-[18px] items-center justify-center rounded-full bg-secondary-foreground/70">
                <Icon icon={UserIconNameEnum.X} size={11} className="text-primary-reverse" />
            </View>
        </Pressable>
    );
};
