import { i18n } from '@lingui/core';
import { cva } from 'class-variance-authority';
import { ComponentProps } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { LlmType } from '../../type/llm.type';

import type { ClassValue } from 'clsx';

type RecordButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type RecordButtonVariant = 'default' | 'recording' | 'loading' | 'processing';

interface Props extends Omit<ComponentProps<typeof HapticPressable>, 'children'> {
    readonly size?: RecordButtonSize;
    readonly llm: LlmType;
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

const getVariant = (llm: LlmType, isRecording: boolean): RecordButtonVariant => {
    if (!llm.isReady) {
        return 'loading';
    }

    if (llm.isGenerating) {
        return 'processing';
    }

    if (isRecording) {
        return 'recording';
    }

    return 'default';
};

const getLabel = (llm: LlmType, variant: RecordButtonVariant): string => {
    if (variant === 'loading') {
        const progress = Math.round(llm.downloadProgress * 100);

        return i18n._(`Loading AI... ${progress}%`);
    }

    if (variant === 'processing') {
        return i18n._(`Processing...`);
    }

    if (variant === 'recording') {
        return i18n._(`Recording...`);
    }

    return i18n._(`Tap to speak`);
};

export const RecordButton = (props: Props) => {
    const { size = 'lg', isRecording, llm, className, labelClassName, ...rest } = props;

    const variant = getVariant(llm, isRecording);
    const label = getLabel(llm, variant);
    const isDisabled = ['processing', 'loading'].includes(variant);

    return (
        <View className="items-center">
            <HapticPressable disabled={isDisabled} className={cn(buttonVariants({ variant, size }), className)} {...rest}>
                {variant === 'loading' && <ActivityIndicator size={activityIndicatorSize[size]} color="white" />}
                {variant === 'processing' && <Icon icon={ICONS.Sparkles} size={iconSize[size]} className="text-primary" />}
                {variant === 'recording' && <Icon icon={ICONS.Square} size={iconSize[size]} className="text-primary" />}
                {variant === 'default' && <Icon icon={ICONS.Mic} size={iconSize[size]} className="text-primary" />}
            </HapticPressable>

            <Text className={cn('mt-3', labelVariants({ variant }), labelClassName)}>{label}</Text>
        </View>
    );
};
