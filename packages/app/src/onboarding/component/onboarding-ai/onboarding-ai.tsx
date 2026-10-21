import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { NetworkTypeEnum } from '../../../@generic/enum/network-type.enum';
import { useFormatGigabytes } from '../../../@generic/hook/use-format-gigabytes.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { useAiDownloadPreflight } from '../../../ai/hook/use-ai-download-preflight.hook';
import { AiModelDownloadService } from '../../../ai/service/ai-model-download.service';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingFileState } from '../../hook/use-onboarding-file-state.hook';
import { OnboardingService } from '../../service/onboarding.service';
import { OnboardingInfoRow } from '../onboarding-info-row/onboarding-info-row';
import { OnboardingNote } from '../onboarding-note/onboarding-note';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingAiSelector } from './onboarding-ai.selector';

import type { OnboardingNetworkRowInterface } from '../../interface/onboarding-network-row.interface';

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const OnboardingAi = () => {
    const { t } = useLingui();

    const [isSaving, setIsSaving] = useState(false);

    const { state, isSealed } = useOnboardingFileState();
    const { totalBytes, networkType, freeDiskBytes, missingBytes, hasEnoughSpace } = useAiDownloadPreflight();
    const formatGigabytes = useFormatGigabytes();

    const finishWith = (settings: Parameters<typeof updateSettingsMutation>[0], allowMobileData: boolean) => {
        setIsSaving(true);
        appRuntime.runFork(
            logAndContinue(
                updateSettingsMutation(settings).pipe(
                    Effect.andThen(
                        allowMobileData
                            ? Effect.flatMap(AiModelDownloadService, downloadService => downloadService.allowMobileData())
                            : Effect.void
                    ),
                    Effect.andThen(Effect.flatMap(OnboardingService, onboardingService => onboardingService.complete())),
                    Effect.ensuring(Effect.sync(() => void setIsSaving(false)))
                )
            )
        );
    };

    const isOnWifi = networkType === NetworkTypeEnum.WIFI;
    const isOnCellular = networkType === NetworkTypeEnum.CELLULAR;

    const aiFeatures = (isEnabled: boolean) => ({
        isAiEnabled: isEnabled,
        isAiVoiceInputEnabled: isEnabled,
        isAiSuggestionsEnabled: isEnabled,
        isAiTranslationsEnabled: isEnabled
    });
    const handleDownloadPress = () => void finishWith(aiFeatures(true), isOnCellular);
    const handleLaterPress = () => void finishWith({ ...aiFeatures(true), isAiWifiOnly: true }, false);
    const handleNoThanksPress = () => void finishWith(aiFeatures(false), false);

    const totalSize = formatGigabytes(totalBytes);
    const freeSize = formatGigabytes(freeDiskBytes);
    const missingSize = formatGigabytes(missingBytes);
    const downloadLabel = isOnCellular ? t`Download ${totalSize} GB on mobile data` : t`Download ${totalSize} GB now`;
    const isDownloadDisabled = !hasEnoughSpace || networkType === NetworkTypeEnum.OFFLINE;
    const networkRows: Partial<Record<NetworkTypeEnum, OnboardingNetworkRowInterface>> = {
        [NetworkTypeEnum.WIFI]: { icon: UserIconNameEnum.Wifi, text: t`You're on Wi-Fi` },
        [NetworkTypeEnum.CELLULAR]: { icon: UserIconNameEnum.Signal, text: t`You're on mobile data` },
        [NetworkTypeEnum.OFFLINE]: { icon: UserIconNameEnum.WifiOff, text: t`You're offline right now` }
    };
    const networkRow = networkRows[networkType];

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.AI}
            fileState={state}
            isFileSealed={isSealed}
            footer={
                <>
                    <Button
                        testID={OnboardingAiSelector.DownloadButton}
                        variant="cta"
                        content={downloadLabel}
                        disabled={isDownloadDisabled}
                        isLoading={isSaving}
                        onPress={handleDownloadPress}
                    />
                    {isOnWifi ? null : (
                        <Button
                            testID={OnboardingAiSelector.LaterButton}
                            variant="secondary"
                            content={t`Later, next time I'm on Wi-Fi`}
                            disabled={isSaving}
                            onPress={handleLaterPress}
                        />
                    )}
                    <Button
                        testID={OnboardingAiSelector.NoThanksButton}
                        variant="ghost"
                        content={t`No thanks`}
                        disabled={isSaving}
                        onPress={handleNoThanksPress}
                    />
                </>
            }
        >
            <OnboardingStepIntro icon={UserIconNameEnum.Sparkles} iconVariant="pink" title={t`Help sorting, without leaving the phone?`} />

            <View className="gap-y-md">
                <OnboardingInfoRow icon={UserIconNameEnum.Tags} text={t`Sorts transactions into categories and suggests tags`} />
                <OnboardingInfoRow icon={UserIconNameEnum.Mic} text={t`Turns a voice note into an expense`} />
                <OnboardingInfoRow icon={UserIconNameEnum.ShieldCheck} text={t`Runs on this phone. Nothing it reads is sent anywhere.`} />
            </View>

            <Card variant="secondary" size="md" className="gap-y-lg">
                <View className="flex-row items-baseline gap-x-md">
                    <Text className="text-primary text-(length:--text-5xl) font-semibold">
                        <Trans>{totalSize} GB</Trans>
                    </Text>
                    <Text className="text-secondary-foreground text-sm">
                        <Trans>one-time download</Trans>
                    </Text>
                </View>

                <View className="gap-y-md border-t border-secondary-corner pt-lg">
                    {isDefined(networkRow) ? <OnboardingInfoRow icon={networkRow.icon} text={networkRow.text} /> : null}
                    <OnboardingInfoRow icon={UserIconNameEnum.HardDrive} text={t`${freeSize} GB free on this phone`} />
                </View>
            </Card>

            {hasEnoughSpace ? null : (
                <OnboardingNote
                    icon={UserIconNameEnum.HardDrive}
                    variant="warning"
                    text={t`This phone needs ${missingSize} GB more free space first. Your money data isn't affected.`}
                />
            )}
        </OnboardingStepLayout>
    );
};
