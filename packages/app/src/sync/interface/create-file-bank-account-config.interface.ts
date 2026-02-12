import type { BankAccountPreviewInterface } from './bank-account-preview.interface';

export interface CreateFileBankAccountConfigInterface {
    readonly mimeType: string;
    readonly title: string;
    readonly description: string;
    readonly instructionText: string;
    readonly selectFileText: string;
    readonly importPreview: (uri: string) => Promise<BankAccountPreviewInterface[]>;
    readonly executeImportForSelectedAccounts: (uri: string, selectedAccountIds: string[]) => Promise<void>;
}
