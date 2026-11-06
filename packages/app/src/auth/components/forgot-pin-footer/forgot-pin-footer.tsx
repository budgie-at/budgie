import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';

import { Button } from '../../../@generic/component/button/button';
import { ForgotPinSheetSelector } from '../forgot-pin-sheet/forgot-pin-sheet.selector';

interface Props {
    readonly onTryAgain: () => void;
}

const IN_FLOW_STYLE = { position: 'relative' } as const;

export const ForgotPinFooter = ({ onTryAgain }: Props) => {
    const { t } = useLingui();

    return (
        <ScreenChromeFooter includeBottomSafeArea={false} style={IN_FLOW_STYLE}>
            <View className="bg-surface px-5xl pt-lg pb-safe-offset-[8px] gap-y-md">
                <Button
                    testID={ForgotPinSheetSelector.TryAgainButton}
                    accessibilityLabel={t`Try again`}
                    variant="cta"
                    content={
                        <Text className="text-primary-reverse text-sm" maxFontSizeMultiplier={1.6}>
                            <Trans>Try again</Trans>
                        </Text>
                    }
                    onPress={onTryAgain}
                />
                <Text className="text-secondary-foreground text-xs text-center" maxFontSizeMultiplier={1.6}>
                    <Trans>After 5 wrong tries, Budgie waits a little longer between attempts.</Trans>
                </Text>
            </View>
        </ScreenChromeFooter>
    );
};
