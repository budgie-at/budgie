import { MONOBANK_AUTH_URL, SyncProviderRegistryService } from '@budgie/sync';
import { useAtomRefresh } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { FormItem } from '../@generic/component/form-item/form-item';
import { FormsheetHeader } from '../@generic/component/formsheet-header/formsheet-header';
import { Input } from '../@generic/component/input/input';
import { ModalFormFooter } from '../@generic/component/modal-form-footer/modal-form-footer';
import { useEffectAction } from '../@generic/hook/use-effect-action.hook';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { PasteTokenButton } from '../sync/component/paste-token-button/paste-token-button';
import { SyncTokenSectionSelector } from '../sync/component/sync-token-section/sync-token-section.selector';
import { useBankIntegrationKeyModal, useBankIntegrationKeyModalParams } from '../sync/context/bank-integration-key-modal.context';
import { bankIntegrationAccountPreviewsAtom } from '../sync/query/use-bank-integration-account-previews.query';

import { BankIntegrationKeyModalSelector } from './bank-integration-key.selector';

export default function BankIntegrationKeyModal() {
    const { t } = useLingui();
    const [, resolveKeyModal, dismissKeyModal] = useBankIntegrationKeyModal();
    useModalDismiss(dismissKeyModal);
    const integrationId = useBankIntegrationKeyModalParams() ?? 0;
    const refreshAccountPreviews = useAtomRefresh(bankIntegrationAccountPreviewsAtom(integrationId));
    const [key, setKey] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [runEffect, isSaving] = useEffectAction(t`Could not update key`);

    const isSaveDisabled = isSaving || !isNotEmptyString(key.trim());
    const showError = (message: string) => Effect.sync(() => void setErrorMessage(message));
    const handleCancel = () => void resolveKeyModal(null);
    const handleOpenKeyPage = () => void Linking.openURL(MONOBANK_AUTH_URL);
    const handleKeyChange = (value: string) => {
        setKey(value);
        setErrorMessage('');
    };
    const handleSave = () =>
        void runEffect(
            Effect.flatMap(SyncProviderRegistryService, registry => registry.updateIntegrationToken(integrationId, key.trim())).pipe(
                Effect.tap(() =>
                    Effect.sync(() => {
                        resolveKeyModal(null);
                        refreshAccountPreviews();
                        Toast.show({ type: 'success', text1: t`Key updated` });
                    })
                ),
                Effect.catchTags({
                    SyncUnauthorizedError: () => showError(t`Monobank rejected this key. Check it and try again.`),
                    SyncTokenClientMismatchError: () => showError(t`This key is for a different Monobank client.`),
                    SyncTokenAlreadyConnectedError: () => showError(t`This key already syncs another of your Monobank sections.`),
                    SyncRateLimitedError: () => showError(t`Monobank limits how often keys can be checked. Try again in a minute.`)
                }),
                Effect.catch(() => showError(t`Could not update the key. Try again.`))
            )
        );

    return (
        <View className="bg-primary-reverse">
            <FormsheetHeader size="md" title={t`Monobank API key`} description={t`Paste the key from api.monobank.ua`} />
            <View className="px-3xl gap-y-md">
                <FormItem error={errorMessage}>
                    <View className="flex-row items-center gap-x-sm">
                        <Input
                            className="flex-1"
                            value={key}
                            onChangeText={handleKeyChange}
                            placeholder={t`Enter new token`}
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoFocus
                            secureTextEntry
                            testID={BankIntegrationKeyModalSelector.Input}
                        />
                        <PasteTokenButton onPaste={handleKeyChange} testID={SyncTokenSectionSelector.MonobankPasteButton} />
                    </View>
                </FormItem>
                <Text
                    className="text-sm text-primary underline"
                    onPress={handleOpenKeyPage}
                    accessibilityRole="link"
                    testID={BankIntegrationKeyModalSelector.GetNewKeyLink}
                >
                    {t`Get a new key`}
                </Text>
            </View>
            <ModalFormFooter
                onCancel={handleCancel}
                onSave={handleSave}
                isSaveDisabled={isSaveDisabled}
                isSaving={isSaving}
                saveTestID={BankIntegrationKeyModalSelector.SaveButton}
            />
        </View>
    );
}
