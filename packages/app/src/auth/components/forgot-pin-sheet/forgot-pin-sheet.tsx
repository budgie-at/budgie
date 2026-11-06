import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { ScreenChromeFrame, ScreenChromeHeader, ScreenChromeScrollView } from '@rnw-community/react-native-screen-chrome';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { ForgotPinFooter } from '../forgot-pin-footer/forgot-pin-footer';
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

                    <ForgotPinFooter onTryAgain={onTryAgain} />
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
};
