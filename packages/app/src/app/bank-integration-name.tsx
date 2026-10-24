import { SyncProviderRegistryService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import { View } from 'react-native';

import { FormsheetHeader } from '../@generic/component/formsheet-header/formsheet-header';
import { Input } from '../@generic/component/input/input';
import { ModalFormFooter } from '../@generic/component/modal-form-footer/modal-form-footer';
import { useEffectAction } from '../@generic/hook/use-effect-action.hook';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useBankIntegrationNameModal, useBankIntegrationNameModalParams } from '../sync/context/bank-integration-name-modal.context';
import { useGetBankIntegrationByIdQuery } from '../sync/query/use-get-bank-integration-by-id.query';

import { BankIntegrationNameModalSelector } from './bank-integration-name.selector';

export default function BankIntegrationNameModal() {
    const { t } = useLingui();
    const [, resolveNameModal, dismissNameModal] = useBankIntegrationNameModal();
    useModalDismiss(dismissNameModal);
    const integrationId = useBankIntegrationNameModalParams() ?? 0;
    const { integration } = useGetBankIntegrationByIdQuery(integrationId);
    const [editedLabel, setEditedLabel] = useState<string | null>(null);
    const [runEffect, isSaving] = useEffectAction(t`Could not rename`);

    const label = editedLabel ?? integration?.label ?? '';
    const handleCancel = () => void resolveNameModal(null);
    const handleSave = () =>
        void runEffect(
            Effect.flatMap(SyncProviderRegistryService, registry => registry.renameIntegration(integrationId, label)),
            handleCancel
        );

    return (
        <View className="bg-primary-reverse">
            <FormsheetHeader size="md" title={t`Section name`} />
            <View className="px-3xl">
                <Input
                    value={label}
                    onChangeText={setEditedLabel}
                    placeholder={t`Not set`}
                    autoFocus
                    autoCorrect={false}
                    testID={BankIntegrationNameModalSelector.Input}
                />
            </View>
            <ModalFormFooter
                onCancel={handleCancel}
                onSave={handleSave}
                isSaveDisabled={isSaving}
                isSaving={isSaving}
                saveTestID={BankIntegrationNameModalSelector.SaveButton}
            />
        </View>
    );
}
