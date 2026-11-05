import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../button/button';
import { CircleIcon } from '../circle-icon/circle-icon';
import { ContactSelectorSelector } from '../contact-selector/contact-selector.selector';
import { LoadingContent } from '../loading-content/loading-content';

import type { ReactNode } from 'react';

interface Props {
    readonly isLoading: boolean;
    readonly title: string;
    readonly description: string;
    readonly icon: UserIconNameEnum;
    readonly onRetry?: () => void;
    readonly children?: ReactNode;
}

export const ContactSelectorState = ({ isLoading, title, description, icon, onRetry, children }: Props) => {
    const { t } = useLingui();

    const accessibilityState = { busy: isLoading };

    return (
        <View className="items-center gap-y-[12px]" testID={ContactSelectorSelector.State}>
            <View accessible accessibilityLabel={t`Contacts`} accessibilityState={accessibilityState}>
                <LoadingContent isLoading={isLoading}>
                    <CircleIcon
                        icon={icon}
                        variant="secondary"
                        size={36}
                        iconSize={24}
                        radius={18}
                        border={false}
                        className="bg-surface-disc"
                    />
                </LoadingContent>
            </View>
            <View className="gap-y-md self-stretch">
                <Text accessibilityRole="header" className="text-primary text-center text-lg font-semibold leading-[24px]">
                    {title}
                </Text>
                <Text className="text-secondary-foreground text-center text-sm leading-[20px]">{description}</Text>
            </View>
            {children}
            {isDefined(onRetry) ? (
                <Button
                    content={t`Try again`}
                    onPress={onRetry}
                    isLoading={isLoading}
                    variant="cta"
                    size="lg"
                    className="min-h-[50px] self-stretch mt-xl"
                    testID={ContactSelectorSelector.Retry}
                />
            ) : null}
        </View>
    );
};
