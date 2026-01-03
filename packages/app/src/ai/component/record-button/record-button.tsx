import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ComponentProps } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

import type { ClassValue } from 'clsx';

type RecordButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type RecordButtonVariant = 'default' | 'recording' | 'loading' | 'processing';

interface Props extends Omit<ComponentProps<typeof HapticPressable>, 'children'> {
    readonly size?: RecordButtonSize;
    readonly isReady: boolean;
    readonly downloadProgress: number;
    readonly isGenerating: boolean;
    readonly isRecording: boolean;
    readonly labelClassName?: string;
}

const buttonVariants = cva<{
    variant: Record<RecordButtonVariant, ClassValue>;
    size: Record<RecordButtonSize, ClassValue>;
}>('rounded-full items-center  justify-center shadow-lg dark:shadow-white/20', {
    variants: {
        variant: {
            default: 'bg-accent',
            recording: 'bg-red-500',
            loading: 'bg-gray-400 dark:bg-gray-600',
            processing: 'bg-accent'
        },
        size: {
            sm: 'w-14 h-14',
            md: 'w-16 h-16',
            lg: 'w-20 h-20',
            xl: 'w-24 h-24'
        }
    }
});

const labelVariants = cva<{
    variant: Record<RecordButtonVariant, ClassValue>;
}>('text-sm font-medium', {
    variants: {
        variant: {
            default: 'text-secondary-foreground',
            recording: 'text-red-500',
            loading: 'text-secondary-foreground',
            processing: 'text-default-foreground'
        }
    }
});

const iconSize: Record<RecordButtonSize, number> = {
    sm: 24,
    md: 28,
    lg: 32,
    xl: 40
};

const activityIndicatorSize: Record<RecordButtonSize, 'small' | 'large'> = {
    sm: 'small',
    md: 'small',
    lg: 'small',
    xl: 'small'
};

const getVariant = (isReady: boolean, isGenerating: boolean, isRecording: boolean): RecordButtonVariant => {
    if (!isReady) {
        return 'loading';
    }

    if (isRecording) {
        return 'recording';
    }

    if (isGenerating) {
        return 'processing';
    }

    return 'default';
};

interface GetLabelParams {
    variant: RecordButtonVariant;
    downloadProgress: number;
    t: ReturnType<typeof useLingui>['t'];
}

const getLabel = ({ variant, downloadProgress, t }: GetLabelParams): string => {
    if (variant === 'loading') {
        const progress = Math.round(downloadProgress * 100);

        return t`Loading AI... ${progress}%`;
    }

    if (variant === 'processing') {
        return t`Processing...`;
    }

    if (variant === 'recording') {
        return t`Listening...`;
    }

    return t`Tap to speak`;
};

export const RecordButton = (props: Props) => {
    const { size = 'lg', isRecording, isGenerating, isReady, downloadProgress, className, labelClassName, ...rest } = props;

    const { t } = useLingui();
    const variant = getVariant(isReady, isGenerating, isRecording);
    const label = getLabel({ variant, downloadProgress, t });
    const isDisabled = ['processing', 'loading'].includes(variant);

    return (
        <View className="items-center">
            <HapticPressable disabled={isDisabled} className={cn(buttonVariants({ variant, size }), className)} {...rest}>
                {variant === 'loading' && <ActivityIndicator size={activityIndicatorSize[size]} color="white" />}
                {variant === 'processing' && <Icon icon={UserIconNameEnum.Sparkles} size={iconSize[size]} className="text-primary" />}
                {variant === 'recording' && <Icon icon={UserIconNameEnum.Square} size={iconSize[size]} className="text-primary" />}
                {variant === 'default' && <Icon icon={UserIconNameEnum.Mic} size={iconSize[size]} className="text-primary" />}
            </HapticPressable>

            <Text className={cn('mt-3', labelVariants({ variant }), labelClassName)}>{label}</Text>
        </View>
    );
};
