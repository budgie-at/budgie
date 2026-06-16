import { UserIconNameEnum } from '@budgie/contracts';
import { type VariantProps, cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

const containerVariants = cva('rounded-2xl', {
    variants: {
        density: {
            default: 'bg-secondary-background/50 p-xl gap-y-lg border border-secondary-corner',
            compact: 'bg-secondary-background/40 p-md gap-y-md'
        }
    },
    defaultVariants: { density: 'default' }
});

interface Props extends VariantProps<typeof containerVariants> {
    readonly title?: ReactNode;
    readonly children: ReactNode;
    readonly canRemove?: boolean;
    readonly onRemove: EmptyFn;
    readonly testID?: string;
    readonly removeTestID?: string;
}

export const RemovableFormRow = ({ title, children, canRemove = true, onRemove, testID, removeTestID, density }: Props) => {
    const hasTitle = isDefined(title);
    const headerLayoutClassName = hasTitle ? 'flex-row items-center justify-between' : 'flex-row items-center justify-end';

    return (
        <View testID={testID} className={containerVariants({ density })}>
            {(hasTitle || canRemove) && (
                <View className={headerLayoutClassName}>
                    {hasTitle && <Text className="text-secondary-foreground text-sm font-medium">{title}</Text>}

                    {canRemove && (
                        <HapticPressable testID={removeTestID} onPress={onRemove} className="p-xs">
                            <Icon icon={UserIconNameEnum.Trash2} className="text-destructive-foreground" size={18} />
                        </HapticPressable>
                    )}
                </View>
            )}

            {children}
        </View>
    );
};
