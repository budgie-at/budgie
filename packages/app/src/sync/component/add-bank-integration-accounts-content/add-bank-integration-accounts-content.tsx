import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { EmptyFn, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { BankAccountPreviewInterface } from '../../interface/bank-account-preview.interface';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';

import { AddBankIntegrationAccountsContentSelector } from './add-bank-integration-accounts-content.selector';

interface Props {
    readonly isLoading: boolean;
    readonly fetchErrorMessage: string | null;
    readonly accountPreviews: BankAccountPreviewInterface[];
    readonly selectedAccounts: Set<string>;
    readonly onToggle: (externalId: string) => void;
    readonly onSelectAll: EmptyFn;
    readonly onDeselectAll: EmptyFn;
    readonly onRetry: EmptyFn;
}

export const AddBankIntegrationAccountsContent = (props: Props) => {
    const { isLoading, fetchErrorMessage, accountPreviews, selectedAccounts, onToggle, onSelectAll, onDeselectAll, onRetry } = props;
    const { t } = useLingui();

    if (isLoading) {
        return (
            <View className="items-center py-7xl" testID={AddBankIntegrationAccountsContentSelector.Loading}>
                <ActivityIndicator size="large" color="var(--color-primary)" />
            </View>
        );
    }

    if (isDefined(fetchErrorMessage)) {
        return (
            <View className="items-center gap-y-lg py-7xl" testID={AddBankIntegrationAccountsContentSelector.ErrorState}>
                <CircleIcon icon={UserIconNameEnum.CloudOff} variant="destructive" size={64} iconSize={32} border={false} />
                <Text className="text-primary text-md text-center">
                    <Trans>Could not load accounts from the bank</Trans>
                </Text>
                <Text className="text-secondary-foreground text-sm text-center">
                    <Trans>Update the token from any account already syncing with this integration, then try again.</Trans>
                </Text>
                <Button
                    variant="secondary"
                    onPress={onRetry}
                    content={t`Try again`}
                    testID={AddBankIntegrationAccountsContentSelector.RetryButton}
                />
            </View>
        );
    }

    if (!isNotEmptyArray(accountPreviews)) {
        return (
            <EmptyState
                testID={AddBankIntegrationAccountsContentSelector.EmptyState}
                circleIcon={UserIconNameEnum.CircleCheck}
                title={t`All accounts already added`}
                description={t`Every account from this bank is already linked.`}
            />
        );
    }

    return (
        <AccountSelectionStep
            accountPreviews={accountPreviews}
            selectedAccounts={selectedAccounts}
            onToggle={onToggle}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
        />
    );
};
