import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';
import { ApplePayCaptureHero } from '../../../wallet-capture/component/apple-pay-capture-hero/apple-pay-capture-hero';
import { ApplePayCaptureHistoryNotice } from '../../../wallet-capture/component/apple-pay-capture-history-notice/apple-pay-capture-history-notice';
import { ApplePayCaptureInstructionsButton } from '../../../wallet-capture/component/apple-pay-capture-instructions-button/apple-pay-capture-instructions-button';
import { ApplePayCaptureOpenShortcutsButton } from '../../../wallet-capture/component/apple-pay-capture-open-shortcuts-button/apple-pay-capture-open-shortcuts-button';
import { ApplePayCaptureSetupCard } from '../../../wallet-capture/component/apple-pay-capture-setup-card/apple-pay-capture-setup-card';
import { ApplePayCaptureTroubleshootingCard } from '../../../wallet-capture/component/apple-pay-capture-troubleshooting-card/apple-pay-capture-troubleshooting-card';
import { WalletCaptureReviewList } from '../../../wallet-capture/component/wallet-capture-review-list/wallet-capture-review-list';
import { useWalletCaptureSettings } from '../../../wallet-capture/hook/use-wallet-capture-settings.hook';

import { ApplePayCaptureSettingsSelector } from './apple-pay-capture.selector';

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
            leading={<GoBackButton onPress={goBackToSettings} />}
            testID={ApplePayCaptureSettingsSelector.Container}
        >
            <View className="gap-y-7xl pb-5xl">
                <ApplePayCaptureHero>
                    <ApplePayCaptureOpenShortcutsButton testID={ApplePayCaptureSettingsSelector.OpenShortcutsButton} />
                    <ApplePayCaptureInstructionsButton testID={ApplePayCaptureSettingsSelector.InstructionsGuideLink} />
                </ApplePayCaptureHero>

                {errorMessage ? (
                    <GroupedListSection>
                        <GroupedListRow
                            testID={ApplePayCaptureSettingsSelector.ErrorCard}
                            title={
                                <Text className="text-destructive-foreground text-[17px]">
                                    <Trans>Could not read Wallet captures</Trans>
                                </Text>
                            }
                            subtitle={
                                <Text className="text-secondary-foreground text-[13px]" selectable>
                                    {errorMessage}
                                </Text>
                            }
                        />
                    </GroupedListSection>
                ) : null}

                <GroupedListSection title={t`Setup`} footer={<ApplePayCaptureHistoryNotice />}>
                    <ApplePayCaptureSetupCard testID={ApplePayCaptureSettingsSelector.SetupCard} />
                </GroupedListSection>

                {hasReviewItems ? (
                    <GroupedListSection title={t`Needs review`}>
                        <View testID={ApplePayCaptureSettingsSelector.ReviewGroup}>
                            <WalletCaptureReviewList
                                reviewItems={reviewItems}
                                mutatingCaptureIds={mutatingCaptureIds}
                                getAccountTitle={getAccountTitle}
                                getAccountInstrumentSymbol={getAccountInstrumentSymbol}
                                importCapture={importCapture}
                                dismissCapture={dismissCapture}
                            />
                        </View>
                    </GroupedListSection>
                ) : null}

                <GroupedListSection title={t`Troubleshooting`}>
                    <ApplePayCaptureTroubleshootingCard />
                </GroupedListSection>

                <MenuSpacer />
            </View>
        </CollapsibleChromePage>
    );
}
