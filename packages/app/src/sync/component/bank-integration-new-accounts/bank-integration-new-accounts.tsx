import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useBankIntegrationKeyModal } from '../../context/bank-integration-key-modal.context';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useBankIntegrationAccountPreviewsQuery } from '../../query/use-bank-integration-account-previews.query';
import { BankIntegrationAccountRowSkeleton } from '../bank-integration-account-row-skeleton/bank-integration-account-row-skeleton';
import { BankIntegrationNewAccountRow } from '../bank-integration-new-account-row/bank-integration-new-account-row';
import { BankIntegrationStatusBanner } from '../bank-integration-status-banner/bank-integration-status-banner';

interface Props {
    readonly linkedExternalIds: ReadonlySet<string>;
}

export const BankIntegrationNewAccounts = ({ linkedExternalIds }: Props) => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const [openKeyModal] = useBankIntegrationKeyModal();
    const { previews, isLoading, isKeyRejected, hasError, refresh } = useBankIntegrationAccountPreviewsQuery(integration.id);

    const newAccountPreviews = previews.filter(
        preview => !isDefined(preview.existingAccountId) && !linkedExternalIds.has(preview.externalId)
    );
    const handleUpdateKey = () => void openKeyModal(integration.id);

    if (isLoading) {
        return (
            <View className="gap-y-lg" testID={BankIntegrationSelector.NewAccountsStatus}>
                <BankIntegrationAccountRowSkeleton />
                <BankIntegrationAccountRowSkeleton />
            </View>
        );
    }

    if (isKeyRejected) {
        return (
            <BankIntegrationStatusBanner
                variant="destructive"
                text={t`Monobank rejected this key`}
                testID={BankIntegrationSelector.NewAccountsStatus}
            >
                <Button
                    variant="default"
                    size="sm"
                    onPress={handleUpdateKey}
                    content={t`Update key`}
                    testID={BankIntegrationSelector.UpdateKeyButton}
                />
            </BankIntegrationStatusBanner>
        );
    }

    if (hasError) {
        return (
            <BankIntegrationStatusBanner
                variant="warning"
                text={t`Couldn’t check Monobank for new accounts`}
                testID={BankIntegrationSelector.NewAccountsStatus}
            >
                <Button
                    variant="default"
                    size="sm"
                    onPress={refresh}
                    content={t`Retry`}
                    testID={BankIntegrationSelector.RetryNewAccountsButton}
                />
            </BankIntegrationStatusBanner>
        );
    }

    if (isEmptyArray(newAccountPreviews)) {
        return null;
    }

    return (
        <View className="gap-y-lg">
            <View className="gap-y-xs">
                <Text className="text-xs uppercase text-secondary-foreground">
                    <Trans>New in Monobank</Trans>
                </Text>
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Switch on to start syncing</Trans>
                </Text>
            </View>
            {newAccountPreviews.map(preview => (
                <BankIntegrationNewAccountRow key={preview.externalId} preview={preview} />
            ))}
        </View>
    );
};
