import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useEffectAction } from '../../../@generic/hook/use-effect-action.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { useAiModelDownloadAmounts } from '../../../ai/hook/use-ai-model-download-amounts.hook';
import { AiModelDownloadService } from '../../../ai/service/ai-model-download.service';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { useGetBankIntegrationCountQuery } from '../../../sync/query/use-get-bank-integration-count.query';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';
import { SettingsGroup } from '../settings-group/settings-group';

import { YourDataLocalItemsSelector } from './your-data-local-items.selector';

export const YourDataLocalItems = () => {
    const { t } = useLingui();
    const bankIntegrationCount = useGetBankIntegrationCountQuery();
    const { summary, downloaded } = useAiModelDownloadAmounts();
    const { budget } = useGetActiveBudgetQuery();
    const [run, isRemovingAi] = useEffectAction(t`Could not remove the AI models`);

    const handleRemoveAiPress = async () => {
        const isConfirmed = await confirmAlert({
            title: t`Remove on-device AI?`,
            message: t`AI is turned off and its ${downloaded} GB of model files are deleted from this phone.`,
            confirmText: t`Remove`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (isConfirmed) {
            run(
                updateSettingsMutation({ isAiEnabled: false }).pipe(
                    Effect.andThen(Effect.flatMap(AiModelDownloadService, downloadService => downloadService.cancel()))
                )
            );
        }
    };

    const handleBudgetPress = () => {
        if (isDefined(budget)) {
            router.push({ pathname: '/budget/edit', params: { id: String(budget.id) } });

            return;
        }

        router.push('/budget/create');
    };

    const hasBankTokens = isPositiveNumber(bankIntegrationCount);
    const hasAiModels = isPositiveNumber(summary.downloadedBytes);
    const budgetStatus = isDefined(budget) ? t`Set up` : t`Not set up`;
    const bankTokensSlot = (
        <Text className="text-sm text-secondary-foreground">
            <Trans>Kept in this file</Trans>
        </Text>
    );
    const budgetSlot = <Text className="text-sm text-secondary-foreground">{budgetStatus}</Text>;

    return (
        <SettingsGroup title={t`On this phone`}>
            {hasBankTokens ? (
                <SettingsCard
                    testID={YourDataLocalItemsSelector.BankTokensRow}
                    icon={UserIconNameEnum.Landmark}
                    variant="violet"
                    title={t`Bank tokens`}
                    description={t`Sent only to the bank they belong to.`}
                    right={bankTokensSlot}
                />
            ) : null}
            {hasAiModels ? (
                <SettingsCard
                    testID={YourDataLocalItemsSelector.AiRow}
                    icon={UserIconNameEnum.Sparkles}
                    variant="pink"
                    title={t`On-device AI · ${downloaded} GB`}
                    description={t`Remove`}
                    isLoading={isRemovingAi}
                    onPress={handleRemoveAiPress}
                />
            ) : null}
            <SettingsCard
                testID={YourDataLocalItemsSelector.BudgetRow}
                icon={UserIconNameEnum.Target}
                variant="positive"
                title={t`Monthly budget`}
                right={budgetSlot}
                onPress={handleBudgetPress}
            />
        </SettingsGroup>
    );
};
