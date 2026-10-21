import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useBankIntegrationNewAccountsQuery } from '../../query/use-bank-integration-new-accounts.query';
import { BankIntegrationNewAccountRow } from '../bank-integration-new-account-row/bank-integration-new-account-row';

interface Props {
    readonly linkedExternalIds: ReadonlySet<string>;
}

export const BankIntegrationNewAccounts = ({ linkedExternalIds }: Props) => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const { newAccountPreviews, isLoading, isKeyRejected, hasError, refresh } = useBankIntegrationNewAccountsQuery(
        integration.id,
        linkedExternalIds
    );

    if (isLoading) {
        return (
            <Text className="text-secondary-foreground text-xs" testID={BankIntegrationSelector.NewAccountsStatus}>
                <Trans>Checking Monobank for new accounts…</Trans>
            </Text>
        );
    }

    if (isKeyRejected) {
        return (
            <Text className="text-secondary-foreground text-xs" testID={BankIntegrationSelector.NewAccountsStatus}>
                <Trans>Monobank rejected this key. Update it above.</Trans>
            </Text>
        );
    }

    if (hasError) {
        return (
            <View className="flex-row items-center justify-between" testID={BankIntegrationSelector.NewAccountsStatus}>
                <Text className="text-secondary-foreground text-xs">
                    <Trans>Couldn’t check Monobank for new accounts</Trans>
                </Text>
                <Button variant="default" size="sm" onPress={refresh} content={t`Retry`} />
            </View>
        );
    }

    if (isEmptyArray(newAccountPreviews)) {
        return null;
    }

    return (
        <View className="gap-y-sm">
            <Text className="text-xs uppercase text-secondary-foreground">
                <Trans>Not synced yet</Trans>
            </Text>
            {newAccountPreviews.map(preview => (
                <BankIntegrationNewAccountRow key={preview.externalId} preview={preview} />
            ))}
        </View>
    );
};
