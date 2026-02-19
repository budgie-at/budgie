/* eslint-disable react/jsx-max-depth */
import { type PropsWithChildren } from 'react';

import { AccountSelectorModalProvider } from '../../account/provider/account-selector-modal.provider';
import { CategoryFormModalProvider } from '../../category/provider/category-form-modal.provider';
import { CategorySelectorModalProvider } from '../../category/provider/category-selector-modal.provider';
import { TagFormModalProvider } from '../../tag/provider/tag-form-modal.provider';
import { TagsSelectorModalProvider } from '../../tag/provider/tags-selector-modal.provider';
import { ConvertToTransferModalProvider } from '../../transaction/provider/convert-to-transfer-modal.provider';
import { DatePickerModalProvider } from '../../transaction/provider/date-picker-modal.provider';
import { NoteInputModalProvider } from '../../transaction/provider/note-input-modal.provider';
import { SplitEntriesModalProvider } from '../../transaction/provider/split-entries-modal.provider';

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
                                        <ConvertToTransferModalProvider>{children}</ConvertToTransferModalProvider>
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
