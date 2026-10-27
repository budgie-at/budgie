/* eslint-disable react/jsx-max-depth */
import { type PropsWithChildren } from 'react';

import { AccountSelectorModalProvider } from '../../account/provider/account-selector-modal.provider';
import { VoiceReviewModalProvider } from '../../ai/provider/voice-review-modal.provider';
import { CategoryFormModalProvider } from '../../category/provider/category-form-modal.provider';
import { CategorySelectorModalProvider } from '../../category/provider/category-selector-modal.provider';
import { LanguageSelectorModalProvider } from '../../i18n/provider/language-selector-modal.provider';
import { ImportBackupPinModalProvider } from '../../import/provider/import-backup-pin-modal.provider';
import { ImportColumnMapperModalProvider } from '../../import/provider/import-column-mapper-modal.provider';
import { ConvertToInstallmentModalProvider } from '../../installment-plan/provider/convert-to-installment-modal.provider';
import { RuleFormModalProvider } from '../../rule/provider/rule-form-modal.provider';
import { RuleMccSelectorModalProvider } from '../../rule/provider/rule-mcc-selector-modal.provider';
import { RuleSelectorModalProvider } from '../../rule/provider/rule-selector-modal.provider';
import { BankIntegrationKeyModalProvider } from '../../sync/provider/bank-integration-key-modal.provider';
import { ResyncWindowPickerModalProvider } from '../../sync/provider/resync-window-picker-modal.provider';
import { TagFormModalProvider } from '../../tag/provider/tag-form-modal.provider';
import { TagsSelectorModalProvider } from '../../tag/provider/tags-selector-modal.provider';
import { ConsolidationSourceModalProvider } from '../../transaction/context/consolidation-source-modal.context';
import { ConvertToRefundModalProvider } from '../../transaction/context/convert-to-refund-modal.context';
import { ConvertToTransferModalProvider } from '../../transaction/context/convert-to-transfer-modal.context';
import { DatePickerModalProvider } from '../../transaction/context/date-picker-modal.context';
import { NoteInputModalProvider } from '../../transaction/context/note-input-modal.context';
import { SplitEntriesModalProvider } from '../../transaction/context/split-entries-modal.context';
import { TransactionAccountFilterModalProvider } from '../../transaction/context/transaction-account-filter-modal.context';
import { TransactionAmountFilterModalProvider } from '../../transaction/context/transaction-amount-filter-modal.context';
import { TransactionCategoryFilterModalProvider } from '../../transaction/context/transaction-category-filter-modal.context';
import { TransactionFeeModalProvider } from '../../transaction/context/transaction-fee-modal.context';
import { TransactionTagFilterModalProvider } from '../../transaction/context/transaction-tag-filter-modal.context';
import { TransactionTypeFilterModalProvider } from '../../transaction/context/transaction-type-filter-modal.context';

import { ContactSelectorModalProvider } from './contact-selector-modal.provider';
import { CurrencySelectorModalProvider } from './currency-selector-modal.provider';
import { DateFilterModalProvider } from './date-filter-modal.provider';
import { IconSelectorModalProvider } from './icon-selector-modal.provider';

export const ModalProvider = ({ children }: PropsWithChildren) => (
    <IconSelectorModalProvider>
        <CategoryFormModalProvider>
            <CategorySelectorModalProvider>
                <AccountSelectorModalProvider>
                    <TagFormModalProvider>
                        <TagsSelectorModalProvider>
                            <DatePickerModalProvider>
                                <NoteInputModalProvider>
                                    <SplitEntriesModalProvider>
                                        <TransactionFeeModalProvider>
                                            <ConsolidationSourceModalProvider>
                                                <ConvertToRefundModalProvider>
                                                    <ConvertToTransferModalProvider>
                                                        <CurrencySelectorModalProvider>
                                                            <LanguageSelectorModalProvider>
                                                                <ContactSelectorModalProvider>
                                                                    <ImportBackupPinModalProvider>
                                                                        <ImportColumnMapperModalProvider>
                                                                            <ResyncWindowPickerModalProvider>
                                                                                <TransactionTypeFilterModalProvider>
                                                                                    <DateFilterModalProvider>
                                                                                        <TransactionCategoryFilterModalProvider>
                                                                                            <TransactionAccountFilterModalProvider>
                                                                                                <TransactionAmountFilterModalProvider>
                                                                                                    <TransactionTagFilterModalProvider>
                                                                                                        <VoiceReviewModalProvider>
                                                                                                            <RuleFormModalProvider>
                                                                                                                <RuleSelectorModalProvider>
                                                                                                                    <RuleMccSelectorModalProvider>
                                                                                                                        <ConvertToInstallmentModalProvider>
                                                                                                                            <BankIntegrationKeyModalProvider>
                                                                                                                                {children}
                                                                                                                            </BankIntegrationKeyModalProvider>
                                                                                                                        </ConvertToInstallmentModalProvider>
                                                                                                                    </RuleMccSelectorModalProvider>
                                                                                                                </RuleSelectorModalProvider>
                                                                                                            </RuleFormModalProvider>
                                                                                                        </VoiceReviewModalProvider>
                                                                                                    </TransactionTagFilterModalProvider>
                                                                                                </TransactionAmountFilterModalProvider>
                                                                                            </TransactionAccountFilterModalProvider>
                                                                                        </TransactionCategoryFilterModalProvider>
                                                                                    </DateFilterModalProvider>
                                                                                </TransactionTypeFilterModalProvider>
                                                                            </ResyncWindowPickerModalProvider>
                                                                        </ImportColumnMapperModalProvider>
                                                                    </ImportBackupPinModalProvider>
                                                                </ContactSelectorModalProvider>
                                                            </LanguageSelectorModalProvider>
                                                        </CurrencySelectorModalProvider>
                                                    </ConvertToTransferModalProvider>
                                                </ConvertToRefundModalProvider>
                                            </ConsolidationSourceModalProvider>
                                        </TransactionFeeModalProvider>
                                    </SplitEntriesModalProvider>
                                </NoteInputModalProvider>
                            </DatePickerModalProvider>
                        </TagsSelectorModalProvider>
                    </TagFormModalProvider>
                </AccountSelectorModalProvider>
            </CategorySelectorModalProvider>
        </CategoryFormModalProvider>
    </IconSelectorModalProvider>
);
