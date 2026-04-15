import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { BankAccountPreviewInterface } from '../../interface/bank-account-preview-interface.type';
import { BankAccountPreviewCard } from '../bank-account-preview-card/bank-account-preview-card';

interface Props {
    readonly accountPreviews: BankAccountPreviewInterface[];
    readonly selectedAccounts: Set<string>;
    readonly onToggle: (externalId: string) => void;
}

export const AccountSelectionStep = ({ accountPreviews, selectedAccounts, onToggle }: Props) => (
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
    </>
);
