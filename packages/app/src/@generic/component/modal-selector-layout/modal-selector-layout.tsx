import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface ModalSelectorLayoutProps {
    readonly title?: string;
    readonly showSearch?: boolean;
    readonly search?: string;
    readonly onSearchChange?: (value: string) => void;
    readonly searchPlaceholder?: string;
    readonly footer?: ReactNode;
    readonly children: ReactNode;
    readonly rightActionIcon?: UserIconNameEnum;
    readonly rightActionOnPress?: () => void;
    readonly emptyState?: ReactNode;
    readonly isEmpty?: boolean;
    readonly className?: string;
}

export const ModalSelectorLayout = (props: ModalSelectorLayoutProps) => {
    const {
        title,
        showSearch = true,
        search,
        onSearchChange,
        searchPlaceholder,
        footer,
        children,
        rightActionIcon,
        rightActionOnPress,
        emptyState,
        isEmpty = false,
        className
    } = props;

    const { bottom } = useSafeAreaInsets();
    const footerPaddingStyle = { paddingBottom: bottom + 16 };
    const hasFooter = isDefined(footer);
    const contentContainerStyle = hasFooter ? {} : { paddingBottom: bottom };

    return (
        <View className={cn('flex-1 bg-primary-reverse', className)}>
            {isDefined(title) && (
                <View className="px-xl pt-lg pb-md">
                    <Text className="text-primary text-lg font-semibold text-center">{title}</Text>
                </View>
            )}

            {showSearch && (
                <View className="py-md px-xl border-b border-b-secondary-corner">
                    <View className="flex-row items-center gap-x-md">
                        <View className="flex-1 flex-row items-center rounded-5xl bg-secondary-background h-[44px] px-xl border border-secondary-corner">
                            <Icon icon={UserIconNameEnum.Search} size={18} className="text-secondary-foreground mr-sm" />
                            <TextInput
                                className="flex-1 text-primary text-md placeholder-secondary-foreground"
                                value={search}
                                onChangeText={onSearchChange}
                                placeholder={searchPlaceholder}
                                placeholderTextColor="rgba(128, 128, 128, 0.6)"
                                autoCapitalize="none"
                                autoCorrect={false}
                                clearButtonMode="while-editing"
                            />
                        </View>
                        {isDefined(rightActionIcon) && isDefined(rightActionOnPress) && (
                            <HapticPressable
                                onPress={rightActionOnPress}
                                className="h-[44px] w-[44px] items-center justify-center rounded-full bg-primary"
                            >
                                <Icon icon={rightActionIcon} size={20} className="text-primary-foreground" />
                            </HapticPressable>
                        )}
                    </View>
                </View>
            )}

            <ScrollView
                className="flex-1"
                contentContainerStyle={contentContainerStyle}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                {isEmpty && isDefined(emptyState) ? emptyState : children}
            </ScrollView>

            {hasFooter && (
                <View className="px-xl pt-md border-t border-t-secondary-corner" style={footerPaddingStyle}>
                    {footer}
                </View>
            )}
        </View>
    );
};
