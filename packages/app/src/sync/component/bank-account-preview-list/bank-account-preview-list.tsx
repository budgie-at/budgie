import { SyncAccountPreviewInterface } from '../../interface/sync-account-preview.interface';
import { BankAccountPreviewCard } from '../bank-account-preview-card/bank-account-preview-card';

interface Props {
    readonly previews: SyncAccountPreviewInterface[];
    readonly selectedAccounts: Set<string>;
    readonly onToggle: (externalId: string) => void;
}

export const BankAccountPreviewList = ({ previews, selectedAccounts, onToggle }: Props) => (
    <>
        {previews.map(preview => (
            <BankAccountPreviewCard
                key={preview.externalId}
                preview={preview}
                isSelected={selectedAccounts.has(preview.externalId)}
                onToggle={onToggle}
            />
        ))}
    </>
);
