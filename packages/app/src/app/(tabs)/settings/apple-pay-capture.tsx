import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { ApplePayCaptureHero } from '../../../wallet-capture/component/apple-pay-capture-hero/apple-pay-capture-hero';
import { ApplePayCaptureHistoryNotice } from '../../../wallet-capture/component/apple-pay-capture-history-notice/apple-pay-capture-history-notice';
import { ApplePayCaptureInstructionsButton } from '../../../wallet-capture/component/apple-pay-capture-instructions-button/apple-pay-capture-instructions-button';
import { ApplePayCaptureOpenShortcutsButton } from '../../../wallet-capture/component/apple-pay-capture-open-shortcuts-button/apple-pay-capture-open-shortcuts-button';
import { ApplePayCaptureSetupCard } from '../../../wallet-capture/component/apple-pay-capture-setup-card/apple-pay-capture-setup-card';
import { ApplePayCaptureTroubleshootingCard } from '../../../wallet-capture/component/apple-pay-capture-troubleshooting-card/apple-pay-capture-troubleshooting-card';
import { WalletCaptureReviewList } from '../../../wallet-capture/component/wallet-capture-review-list/wallet-capture-review-list';
import { useWalletCaptureSettings } from '../../../wallet-capture/hook/use-wallet-capture-settings.hook';

import { ApplePayCaptureSettingsSelector } from './apple-pay-capture.selector';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function ApplePayCaptureSettingsPage() {
    const { t } = useLingui();
    const {
        dismissCapture,
        errorMessage,
        getAccountInstrumentSymbol,
        getAccountTitle,
        hasReviewItems,
        importCapture,
        mutatingCaptureIds,
        refresh,
        reviewItems
    } = useWalletCaptureSettings();

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <CollapsibleChromePage
            title={t`Apple Pay capture`}
            leading={<GoBackButton onPress={handleGoBack} />}
            testID={ApplePayCaptureSettingsSelector.Container}
        >
            <View className="gap-y-xl pb-5xl">
                <ApplePayCaptureHero>
                    <ApplePayCaptureOpenShortcutsButton testID={ApplePayCaptureSettingsSelector.OpenShortcutsButton} />
                    <ApplePayCaptureInstructionsButton testID={ApplePayCaptureSettingsSelector.InstructionsGuideLink} />
                </ApplePayCaptureHero>

                {errorMessage ? (
                    <Card testID={ApplePayCaptureSettingsSelector.ErrorCard} variant="destructive" className="gap-y-sm">
                        <Text className="text-primary text-base font-semibold">
                            <Trans>Could not read Wallet captures</Trans>
                        </Text>
                        <Text className="text-secondary-foreground text-sm" selectable>
                            {errorMessage}
                        </Text>
                    </Card>
                ) : null}

                <SettingsGroup title={t`Setup`}>
                    <ApplePayCaptureSetupCard testID={ApplePayCaptureSettingsSelector.SetupCard} />
                </SettingsGroup>

                <ApplePayCaptureHistoryNotice />

                {hasReviewItems ? (
                    <SettingsGroup title={t`Needs review`}>
                        <Card testID={ApplePayCaptureSettingsSelector.ReviewGroup} className="gap-y-lg">
                            <WalletCaptureReviewList
                                reviewItems={reviewItems}
                                mutatingCaptureIds={mutatingCaptureIds}
                                getAccountTitle={getAccountTitle}
                                getAccountInstrumentSymbol={getAccountInstrumentSymbol}
                                importCapture={importCapture}
                                dismissCapture={dismissCapture}
                            />
                        </Card>
                    </SettingsGroup>
                ) : null}

                <SettingsGroup title={t`Troubleshooting`}>
                    <ApplePayCaptureTroubleshootingCard />
                </SettingsGroup>

                <MenuSpacer />
            </View>
        </CollapsibleChromePage>
    );
}
