import { AccountTypeEnum, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useSearchAccountsSortedQuery } from '../../../account/query/use-search-accounts-sorted.query';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingBalancesOptionInterface } from '../../interface/onboarding-balances-option.interface';
import { OnboardingOptionRow } from '../onboarding-option-row/onboarding-option-row';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingBalancesSelector } from './onboarding-balances.selector';

export const OnboardingBalances = () => {
    const { t } = useLingui();
    const { goToNextStep } = useOnboardingNavigation();
    const { accounts } = useSearchAccountsSortedQuery();

    const firstAccount = accounts.at(0);
    const hasBankOrCryptoAccount = accounts.some(
        account =>
            account.type === AccountTypeEnum.BANK ||
            account.type === AccountTypeEnum.BANK_SYNC ||
            account.type === AccountTypeEnum.CRYPTO ||
            account.type === AccountTypeEnum.CRYPTO_SYNC
    );

    const handlePrimary = () => void goToNextStep(OnboardingStepEnum.BALANCES);

    const handleConnectMonobankPress = () =>
        void router.push({ pathname: '/create-account/[type]', params: { type: ExternalSourceEnum.MONOBANK } });

    const handleImportStatementPress = () => void router.push('/settings/import');

    const handleEnterBalancesPress = () => {
        if (isDefined(firstAccount)) {
            void router.push({ pathname: '/account/[id]/update', params: { id: String(firstAccount.id) } });
        }
    };

    const connectMonobankOption: OnboardingBalancesOptionInterface = {
        key: 'connect-monobank',
        icon: UserIconNameEnum.Landmark,
        title: t`Connect Monobank`,
        onPress: handleConnectMonobankPress
    };
    const importStatementOption: OnboardingBalancesOptionInterface = {
        key: 'import-statement',
        icon: UserIconNameEnum.Upload,
        title: t`Import a statement`,
        onPress: handleImportStatementPress
    };
    const enterBalancesOption: OnboardingBalancesOptionInterface = {
        key: 'enter-balances',
        icon: UserIconNameEnum.PenLine,
        title: t`Enter balances by hand`,
        onPress: handleEnterBalancesPress
    };

    const leadOptions = hasBankOrCryptoAccount
        ? [connectMonobankOption, importStatementOption]
        : [importStatementOption, connectMonobankOption];
    const balancesOptions = isDefined(firstAccount) ? [...leadOptions, enterBalancesOption] : leadOptions;

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.BALANCES}
            icon={UserIconNameEnum.Landmark}
            title={t`Your bank, with nobody in between`}
            description={t`Your own token talks to the bank directly. No Plaid, no aggregator, no third party holding your data.`}
            primaryLabel={t`Continue`}
            onPrimary={handlePrimary}
        >
            <View className="gap-y-md">
                {balancesOptions.map(option => (
                    <OnboardingOptionRow
                        key={option.key}
                        icon={option.icon}
                        title={option.title}
                        isSelected={false}
                        onPress={option.onPress}
                        testID={OnboardingBalancesSelector.OptionRow(option.key)}
                    />
                ))}
            </View>
        </OnboardingStepLayout>
    );
};
