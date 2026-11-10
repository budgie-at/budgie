import { UserIconNameEnum, logAndContinue } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { NetworkTypeEnum } from '../../../@generic/enum/network-type.enum';
import { useFormatGigabytes } from '../../../@generic/hook/use-format-gigabytes.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useAiDownloadPreflight } from '../../../ai/hook/use-ai-download-preflight.hook';
import { AiModelDownloadService } from '../../../ai/service/ai-model-download.service';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingFileState } from '../../hook/use-onboarding-file-state.hook';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingFooterAction } from '../onboarding-footer-action/onboarding-footer-action';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingAiSelector } from './onboarding-ai.selector';

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const OnboardingAi = () => {
    const { t } = useLingui();

    const [isSaving, setIsSaving] = useState(false);

    const { state, lock } = useOnboardingFileState();
    const { totalBytes, networkType, freeDiskBytes, missingBytes, hasEnoughSpace } = useAiDownloadPreflight();
    const formatGigabytes = useFormatGigabytes();
    const { completion } = useOnboardingNavigation();

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
                    Effect.andThen(completion),
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
    const networkNames: Partial<Record<NetworkTypeEnum, string>> = {
        [NetworkTypeEnum.WIFI]: t`Wi-Fi`,
        [NetworkTypeEnum.CELLULAR]: t`Mobile data`,
        [NetworkTypeEnum.OFFLINE]: t`Offline`
    };
    const networkName = networkNames[networkType];
    const totalSizeText = t`${totalSize} GB`;
    const freeSpaceText = t`${freeSize} GB free`;
    const downloadSubtitle = [totalSizeText, networkName, freeSpaceText].filter(isDefined).join(' · ');
    const downloadFooter = hasEnoughSpace
        ? null
        : t`This phone needs ${missingSize} GB more free space first. Your money data isn’t affected.`;

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.AI}
            fileState={state}
            fileLock={lock}
            footer={
                <>
                    <PillButton
                        testID={OnboardingAiSelector.DownloadButton}
                        label={downloadLabel}
                        isDisabled={isDownloadDisabled}
                        isLoading={isSaving}
                        onPress={handleDownloadPress}
                    />
                    {isOnWifi ? null : (
                        <OnboardingFooterAction
                            testID={OnboardingAiSelector.LaterButton}
                            label={t`Later, next time I’m on Wi-Fi`}
                            isDisabled={isSaving}
                            onPress={handleLaterPress}
                        />
                    )}
                    <OnboardingFooterAction
                        testID={OnboardingAiSelector.NoThanksButton}
                        label={t`No thanks`}
                        isDisabled={isSaving}
                        onPress={handleNoThanksPress}
                    />
                </>
            }
        >
            <OnboardingStepIntro
                icon={UserIconNameEnum.Sparkles}
                title={t`Help sorting your expenses?`}
                description={t`Runs on this phone. Nothing it reads is sent anywhere.`}
            />

            <GroupedListSection title={t`What it does`}>
                <GroupedListRow
                    left={<GroupedListIcon icon={UserIconNameEnum.Tags} />}
                    title={t`Sorts transactions into categories and suggests tags`}
                />
                <GroupedListRow left={<GroupedListIcon icon={UserIconNameEnum.Mic} />} title={t`Turns a voice note into an expense`} />
            </GroupedListSection>

            <GroupedListSection footer={downloadFooter}>
                <GroupedListRow
                    left={<GroupedListIcon icon={UserIconNameEnum.HardDrive} />}
                    title={t`On-device model`}
                    subtitle={downloadSubtitle}
                />
            </GroupedListSection>
        </OnboardingStepLayout>
    );
};
