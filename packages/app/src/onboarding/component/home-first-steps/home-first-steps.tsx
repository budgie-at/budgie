import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { useFormatGigabytes } from '../../../@generic/hook/use-format-gigabytes.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { useAiDownloadPreflight } from '../../../ai/hook/use-ai-download-preflight.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useGetTransactionCountQuery } from '../../../transaction/query/use-get-transaction-count.query';
import { OnboardingService } from '../../service/onboarding.service';

import { HomeFirstStepsSelector } from './home-first-steps.selector';

import type { TransactionFilterInterface } from '@budgie/contracts';

const ALL_TRANSACTIONS_FILTER: TransactionFilterInterface = {
    types: null,
    date: null,
    amount: null,
    categoryIds: null,
    accountIds: null,
    tagIds: null
};

interface Props {
    readonly accountCount: number;
}

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export const HomeFirstSteps = ({ accountCount }: Props) => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');
    const isAiEnabled = useSetting('isAiEnabled');
    const { count: transactionCount, isLoading } = useGetTransactionCountQuery(ALL_TRANSACTIONS_FILTER);
    const { totalBytes } = useAiDownloadPreflight();
    const formatGigabytes = useFormatGigabytes();

    const hasAccounts = isPositiveNumber(accountCount);

    const handleLogExpensePress = () => {
        appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(OnboardingService, onboardingService => onboardingService.ensureCashAccount(t`Cash`)).pipe(
                    Effect.andThen(Effect.sync(() => void router.push('/create-transaction/expense')))
                )
            )
        );
    };
    const handleMakePinPress = () => void router.push('/add-pin');
    const handleAddAccountsPress = () => void router.push('/create-account');
    const handleAiPress = () => void router.push('/settings/ai');

    if (isLoading || isPositiveNumber(transactionCount)) {
        return null;
    }

    const aiSize = formatGigabytes(totalBytes);
    const title = hasAccounts ? t`Log your first expense` : t`Log what you spend. That's all Budgie needs.`;
    const description = hasAccounts
        ? t`Amount first. Budgie guesses the account and category.`
        : t`Type the amount. Budgie puts it in a Cash wallet until you add accounts.`;
    const hasChecklist = !isPinEnabled || !hasAccounts || !isAiEnabled;

    return (
        <View testID={HomeFirstStepsSelector.Root} className="mx-5xl gap-y-lg">
            <Card
                testID={HomeFirstStepsSelector.LogExpenseCard}
                variant="secondary"
                size="lg"
                onPress={handleLogExpensePress}
                className="gap-y-lg"
            >
                <CircleIcon icon={UserIconNameEnum.Plus} variant="cta" size={40} iconSize={20} />
                <Text className="text-primary text-xl font-semibold">{title}</Text>
                <Text className="text-secondary-foreground text-sm">{description}</Text>
            </Card>

            {hasChecklist ? (
                <View className="gap-y-md">
                    <Text className="text-xs uppercase text-secondary-foreground">
                        <Trans>Finish when you&apos;re ready</Trans>
                    </Text>

                    {isPinEnabled ? null : (
                        <SimpleHorizontalCell
                            testID={HomeFirstStepsSelector.MakePinRow}
                            left={<CircleIcon icon={UserIconNameEnum.KeyRound} variant="warning" size={32} iconSize={16} />}
                            title={t`Make a PIN`}
                            onPress={handleMakePinPress}
                        />
                    )}
                    {hasAccounts ? null : (
                        <SimpleHorizontalCell
                            testID={HomeFirstStepsSelector.AddAccountsRow}
                            left={<CircleIcon icon={UserIconNameEnum.Wallet} variant="cyan" size={32} iconSize={16} />}
                            title={t`Add accounts and balances`}
                            onPress={handleAddAccountsPress}
                        />
                    )}
                    {isAiEnabled ? null : (
                        <SimpleHorizontalCell
                            testID={HomeFirstStepsSelector.AiRow}
                            left={<CircleIcon icon={UserIconNameEnum.Sparkles} variant="pink" size={32} iconSize={16} />}
                            title={t`On-device AI · ${aiSize} GB`}
                            onPress={handleAiPress}
                        />
                    )}
                </View>
            ) : null}
        </View>
    );
};
