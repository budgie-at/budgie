import { UserIconNameEnum } from '@budgie/contracts';
import { MONOBANK_AUTH_URL, SyncProviderRegistryService } from '@budgie/sync';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { FormsheetHeader } from '../@generic/component/formsheet-header/formsheet-header';
import { HapticPressable } from '../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../@generic/component/icon/icon';
import { ModalFormFooter } from '../@generic/component/modal-form-footer/modal-form-footer';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useSingleFlight } from '../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../@generic/utils/toast-on-failure.util';
import { BankIntegrationKeyField } from '../sync/component/bank-integration-key-field/bank-integration-key-field';
import { useBankIntegrationKeyModal, useBankIntegrationKeyModalParams } from '../sync/context/bank-integration-key-modal.context';
import { useBankIntegrationAccountPreviewsQuery } from '../sync/query/use-bank-integration-account-previews.query';

import { BankIntegrationKeyModalSelector } from './bank-integration-key.selector';

export default function BankIntegrationKeyModal() {
    const { t } = useLingui();
    const [, resolveKeyModal, dismissKeyModal] = useBankIntegrationKeyModal();
    useModalDismiss(dismissKeyModal);
    const integrationId = useBankIntegrationKeyModalParams() ?? 0;
    const { isKeyRejected, refresh: refreshAccountPreviews } = useBankIntegrationAccountPreviewsQuery(integrationId);
    const [key, setKey] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const { isLoading: isSaving, run } = useSingleFlight();

    const isSaveDisabled = isSaving || !isNotEmptyString(key.trim());
    const showError = (message: string) => Effect.sync(() => void setErrorMessage(message));
    const handleCancel = () => void resolveKeyModal(null);
    const handleOpenKeyPage = () => void Linking.openURL(MONOBANK_AUTH_URL);
    const handleKeyChange = (value: string) => {
        setKey(value);
        setErrorMessage('');
    };
    const handleSave = () =>
        void run(
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
                Effect.catch(() => showError(t`Could not update the key. Try again.`)),
                toastOnFailure(t`Could not update key`)
            )
        );

    return (
        <View className="bg-sheet-surface">
            <FormsheetHeader size="md" title={t`Monobank API key`} description={t`Paste the key from api.monobank.ua.`} />
            <View className="px-3xl gap-y-[8px]">
                <BankIntegrationKeyField
                    value={key}
                    onChangeText={handleKeyChange}
                    errorMessage={errorMessage}
                    isKeyRejected={isKeyRejected}
                />
                <HapticPressable
                    className="min-h-[44px] flex-row items-center gap-x-sm"
                    onPress={handleOpenKeyPage}
                    accessibilityRole="link"
                    testID={BankIntegrationKeyModalSelector.GetNewKeyLink}
                >
                    <Text className="text-[15px] light:text-cash-action dark:text-default-foreground">
                        <Trans>Get a new key</Trans>
                    </Text>
                    <Icon icon={UserIconNameEnum.ArrowUpRight} size={14} className="light:text-cash-action dark:text-default-foreground" />
                </HapticPressable>
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
