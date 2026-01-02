import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { BankAccountPreviewInterface } from '../../interface/bank-account-preview.interface';
import { BankAccountPreviewCard } from '../bank-account-preview-card/bank-account-preview-card';

interface Props {
    readonly accountPreviews: BankAccountPreviewInterface[];
    readonly selectedAccounts: Set<string>;
    readonly isLoading: boolean;
    readonly onToggle: (externalId: string) => void;
    readonly onSetupSync: () => void;
}

export const AccountSelectionStep = ({ accountPreviews, selectedAccounts, isLoading, onToggle, onSetupSync }: Props) => {
    const { t } = useLingui();
    const isStartSyncDisabled = isLoading || selectedAccounts.size === 0;

    return (
        <>
            <Text className="text-primary text-muted-foreground text-sm px-md">
                <Trans>Select accounts to sync:</Trans>
            </Text>

            {accountPreviews.map(preview => (
                <BankAccountPreviewCard
                    key={preview.externalId}
                    preview={preview}
                    isSelected={selectedAccounts.has(preview.externalId)}
                    onToggle={onToggle}
                />
            ))}

            <Button onPress={onSetupSync} disabled={isStartSyncDisabled} content={t`Start Sync`} />
        </>
    );
};
