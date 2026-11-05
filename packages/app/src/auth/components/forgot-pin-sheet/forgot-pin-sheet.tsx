import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ScreenChromeFrame, ScreenChromeHeader, ScreenChromeScrollView } from '@rnw-community/react-native-screen-chrome';

import { Button } from '../../../@generic/component/button/button';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { ForgotPinRecoveryOptions } from '../forgot-pin-recovery-options/forgot-pin-recovery-options';
import { PinFormHeader } from '../pin-form-header/pin-form-header';

import { ForgotPinSheetSelector } from './forgot-pin-sheet.selector';

interface Props {
    readonly onTryAgain: () => void;
}

export const ForgotPinSheet = ({ onTryAgain }: Props) => {
    const { t } = useLingui();

    return (
        <GroupedSurface testID={ForgotPinSheetSelector.Root}>
            <ScreenChromeThemeProvider>
                <ScreenChromeFrame>
                    <ScreenChromeHeader inFlow>
                        <GoBackButton onPress={onTryAgain} />
                    </ScreenChromeHeader>

                    <ScreenChromeScrollView includeTopSafeArea={false}>
                        <View className="px-5xl pt-md pb-3xl gap-y-5xl">
                            <PinFormHeader
                                icon={UserIconNameEnum.KeyRound}
                                iconVariant="destructive"
                                title={t`Budgie can't reset your PIN`}
                                description={t`It's the only key to your file. There's no account and no copy on a server, so there's nothing to reset it from.`}
                            />

                            <ForgotPinRecoveryOptions />
                        </View>
                    </ScreenChromeScrollView>

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
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
};
