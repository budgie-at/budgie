import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../constant/max-chrome-font-size-multiplier.constant';
import { useIsLargeTextSize } from '../../hook/use-is-large-text-size.hook';
import { CircleIcon } from '../circle-icon/circle-icon';
import { ContactSelectorSettingsButton } from '../contact-selector-settings-button/contact-selector-settings-button';
import { ContactSelectorSelector } from '../contact-selector/contact-selector.selector';
import { LoadingContent } from '../loading-content/loading-content';

interface Props {
    readonly isLoading: boolean;
}

export const ContactSelectorDenied = ({ isLoading }: Props) => {
    const { t } = useLingui();
    const isLargeText = useIsLargeTextSize();
    const accessibilityState = { busy: isLoading };
    const icon = isLargeText ? null : (
        <View accessible accessibilityLabel={t`Contacts`} accessibilityState={accessibilityState}>
            <LoadingContent isLoading={isLoading}>
                <CircleIcon
                    icon={UserIconNameEnum.Lock}
                    variant="secondary"
                    size={36}
                    iconSize={24}
                    radius={18}
                    border={false}
                    className="bg-surface-disc"
                />
            </LoadingContent>
        </View>
    );

    return (
        <View className="w-full items-center gap-y-md" testID={ContactSelectorSelector.State} accessibilityState={accessibilityState}>
            {icon}
            <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
                className="self-stretch text-primary text-center text-lg font-semibold leading-[24px]"
            >
                <Trans>Contacts access is off</Trans>
            </Text>
            <Text
                maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
                className="self-stretch text-secondary-foreground text-center text-sm leading-[20px]"
            >
                <Trans>Allow contacts access in Settings.</Trans>
            </Text>
            <ContactSelectorSettingsButton />
        </View>
    );
};
