import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { FormLayoutGroup } from '../form-layout-group/form-layout-group';
import { PageHeader } from '../page-header/page-header';
import { ModalPage } from '../page/modal-page';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly onCancel: () => void;
    readonly scrollTestID: string;
    readonly footer: ReactNode;
    readonly children: ReactNode;
}

export const EntityFormPage = ({ title, onCancel, scrollTestID, footer, children }: Props) => (
    <ModalPage header={<PageHeader title={title} onGoBack={onCancel} />}>
        <KeyboardAwareScrollView testID={scrollTestID} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
            <FormLayoutGroup className="pb-3xl">{children}</FormLayoutGroup>
        </KeyboardAwareScrollView>

        {footer}
    </ModalPage>
);
