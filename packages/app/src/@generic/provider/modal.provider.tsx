/* eslint-disable react/jsx-max-depth */
import { type PropsWithChildren } from 'react';

import { AccountSelectorModalProvider } from '../../account/provider/account-selector-modal.provider';
import { AccountTypeSelectorModalProvider } from '../../account/provider/account-type-selector-modal.provider';
import { CategoryFormModalProvider } from '../../category/provider/category-form-modal.provider';
import { CategorySelectorModalProvider } from '../../category/provider/category-selector-modal.provider';
import { LanguageSelectorModalProvider } from '../../i18n/provider/language-selector-modal.provider';
import { ImportColumnMapperModalProvider } from '../../import/provider/import-column-mapper-modal.provider';
import { TagFormModalProvider } from '../../tag/provider/tag-form-modal.provider';
import { TagsSelectorModalProvider } from '../../tag/provider/tags-selector-modal.provider';
import { ConvertToTransferModalProvider } from '../../transaction/provider/convert-to-transfer-modal.provider';
import { DatePickerModalProvider } from '../../transaction/provider/date-picker-modal.provider';
import { NoteInputModalProvider } from '../../transaction/provider/note-input-modal.provider';
import { SplitEntriesModalProvider } from '../../transaction/provider/split-entries-modal.provider';
import { TransactionAccountFilterModalProvider } from '../../transaction/provider/transaction-account-filter-modal.provider';
import { TransactionCategoryFilterModalProvider } from '../../transaction/provider/transaction-category-filter-modal.provider';
import { TransactionTypeFilterModalProvider } from '../../transaction/provider/transaction-type-filter-modal.provider';

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
                                        <ConvertToTransferModalProvider>
                                            <CurrencySelectorModalProvider>
                                                <LanguageSelectorModalProvider>
                                                    <ContactSelectorModalProvider>
                                                        <AccountTypeSelectorModalProvider>
                                                            <ImportColumnMapperModalProvider>
                                                                <TransactionTypeFilterModalProvider>
                                                                    <DateFilterModalProvider>
                                                                        <TransactionCategoryFilterModalProvider>
                                                                            <TransactionAccountFilterModalProvider>
                                                                                {children}
                                                                            </TransactionAccountFilterModalProvider>
                                                                        </TransactionCategoryFilterModalProvider>
                                                                    </DateFilterModalProvider>
                                                                </TransactionTypeFilterModalProvider>
                                                            </ImportColumnMapperModalProvider>
                                                        </AccountTypeSelectorModalProvider>
                                                    </ContactSelectorModalProvider>
                                                </LanguageSelectorModalProvider>
                                            </CurrencySelectorModalProvider>
                                        </ConvertToTransferModalProvider>
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
