import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ComponentProps } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { cn } from '../../../@generic/utils/cn.util';

import type { ClassValue } from 'clsx';

type RecordButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type RecordButtonVariant = 'default' | 'recording' | 'loading' | 'processing';

interface Props extends Omit<ComponentProps<typeof HapticPressable>, 'children'> {
    readonly size?: RecordButtonSize;
    readonly isReady: boolean;
    readonly isRecording: boolean;
    readonly isProcessing: boolean;
    readonly downloadProgress?: number;
    readonly labelClassName?: string;
}

const buttonVariants = cva<{
    variant: Record<RecordButtonVariant, ClassValue>;
    size: Record<RecordButtonSize, ClassValue>;
}>('rounded-full items-center justify-center shadow-lg', {
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
    lg: 'large',
    xl: 'large'
};

export const RecordButton = (props: Props) => {
    const { size = 'lg', isReady, isRecording, isProcessing, downloadProgress = 0, className, labelClassName, ...rest } = props;
    const { t } = useLingui();

    const getVariant = (): RecordButtonVariant => {
        if (!isReady) {
            return 'loading';
        }
        if (isProcessing) {
            return 'processing';
        }
        if (isRecording) {
            return 'recording';
        }

        return 'default';
    };

    const getLabel = (): string => {
        if (!isReady) {
            const progress = Math.round(downloadProgress * 100);

            return t`Loading AI... ${progress}%`;
        }
        if (isProcessing) {
            return t`Processing...`;
        }
        if (isRecording) {
            return t`Recording...`;
        }

        return t`Tap to speak`;
    };

    const variant = getVariant();
    const label = getLabel();
    const isLoading = variant === 'loading';
    const isDisabled = !isReady || isProcessing;
    const icon = isRecording ? ICONS.Square : ICONS.Mic;

    const renderButtonContent = () => {
        if (isLoading) {
            return <ActivityIndicator size={activityIndicatorSize[size]} color="white" />;
        }

        if (isProcessing) {
            return <Icon icon={ICONS.Sparkles} size={iconSize[size]} className="text-white" />;
        }

        return <Icon icon={icon} size={iconSize[size]} className="text-white" />;
    };

    return (
        <View className="items-center">
            <HapticPressable disabled={isDisabled} className={cn(buttonVariants({ variant, size }), className)} {...rest}>
                {renderButtonContent()}
            </HapticPressable>

            <Text className={cn('mt-3', labelVariants({ variant }), labelClassName)}>{label}</Text>
        </View>
    );
};
