import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import { useEffect } from 'react';
import { Linking, ScrollView, Text } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { Page } from '../../../@generic/component/page/page';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { ApplePayCaptureHistoryNotice } from '../../../wallet-capture/component/apple-pay-capture-history-notice/apple-pay-capture-history-notice';
import { ApplePayCaptureOpenShortcutsButton } from '../../../wallet-capture/component/apple-pay-capture-open-shortcuts-button/apple-pay-capture-open-shortcuts-button';
import { ApplePayCaptureSetupCard } from '../../../wallet-capture/component/apple-pay-capture-setup-card/apple-pay-capture-setup-card';
import { ApplePayCaptureTroubleshootingCard } from '../../../wallet-capture/component/apple-pay-capture-troubleshooting-card/apple-pay-capture-troubleshooting-card';
import { WalletCaptureReviewList } from '../../../wallet-capture/component/wallet-capture-review-list/wallet-capture-review-list';
import { useWalletCaptureSettings } from '../../../wallet-capture/hook/use-wallet-capture-settings.hook';

import { ApplePayCaptureSettingsSelector } from './apple-pay-capture.selector';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function ApplePayCaptureSettingsPage() {
    const { t } = useLingui();
    const language = useSetting('language');
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
        void refresh();
    }, [refresh]);

    const handlePressInstructionsGuide = () => {
        appRuntime.runFork(
            Effect.promise(() => Linking.openURL(`https://budgie.at/${language}/blog/apple-pay-shortcuts-instructions`)).pipe(
                Effect.tapCause(Effect.logError),
                Effect.catchCause(cause =>
                    Effect.sync(() => {
                        Toast.show({ type: 'error', text1: t`Could not open instructions`, text2: getErrorMessage(Cause.squash(cause)) });
                    })
                )
            )
        );
    };

    return (
        <Page
            testID={ApplePayCaptureSettingsSelector.Container}
            header={<PageHeader title={t`Apple Pay capture`} onGoBack={handleGoBack} />}
        >
            <ScrollView className="flex-1" contentContainerClassName="gap-y-xl pb-5xl pt-3xl" showsVerticalScrollIndicator={false}>
                <ApplePayCaptureHistoryNotice />

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

                <ApplePayCaptureOpenShortcutsButton testID={ApplePayCaptureSettingsSelector.OpenShortcutsButton} />

                <Button
                    testID={ApplePayCaptureSettingsSelector.InstructionsGuideLink}
                    onPress={handlePressInstructionsGuide}
                    content={t`View step-by-step instructions`}
                    leftIcon={UserIconNameEnum.ExternalLink}
                    variant="ghost"
                />

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
            </ScrollView>
        </Page>
    );
}
