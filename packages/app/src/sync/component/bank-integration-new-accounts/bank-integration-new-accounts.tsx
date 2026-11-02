import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useBankIntegrationAccountPreviewsQuery } from '../../query/use-bank-integration-account-previews.query';
import { BankIntegrationAccountRowSkeleton } from '../bank-integration-account-row-skeleton/bank-integration-account-row-skeleton';
import { BankIntegrationNewAccountRow } from '../bank-integration-new-account-row/bank-integration-new-account-row';

interface Props {
    readonly linkedExternalIds: ReadonlySet<string>;
}

export const BankIntegrationNewAccounts = ({ linkedExternalIds }: Props) => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const { previews, isLoading, isKeyRejected, hasError, refresh } = useBankIntegrationAccountPreviewsQuery(integration.id);

    const newAccountPreviews = previews.filter(
        preview => !isDefined(preview.existingAccountId) && !linkedExternalIds.has(preview.externalId)
    );

    if (isLoading) {
        return (
            <GroupedListSection title={t`New in Monobank`} footer={t`Switch on to start syncing.`}>
                <View testID={BankIntegrationSelector.NewAccountsStatus}>
                    <BankIntegrationAccountRowSkeleton />
                    <BankIntegrationAccountRowSkeleton />
                </View>
            </GroupedListSection>
        );
    }

    if (isKeyRejected) {
        return null;
    }

    if (hasError) {
        return (
            <GroupedListSection title={t`New in Monobank`}>
                <GroupedListRow
                    title={t`Couldn’t check Monobank for new accounts`}
                    testID={BankIntegrationSelector.NewAccountsStatus}
                    right={
                        <HapticPressable
                            onPress={refresh}
                            accessibilityRole="button"
                            className="min-h-[44px] justify-center px-md"
                            testID={BankIntegrationSelector.RetryNewAccountsButton}
                        >
                            <Text className="text-[15px] text-primary-accent">
                                <Trans>Retry</Trans>
                            </Text>
                        </HapticPressable>
                    }
                />
            </GroupedListSection>
        );
    }

    if (isEmptyArray(newAccountPreviews)) {
        return null;
    }

    return (
        <GroupedListSection title={t`New in Monobank`} footer={t`Switch on to start syncing.`}>
            {newAccountPreviews.map(preview => (
                <BankIntegrationNewAccountRow key={preview.externalId} preview={preview} />
            ))}
        </GroupedListSection>
    );
};
