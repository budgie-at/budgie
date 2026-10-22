import { SyncProviderRegistryService } from '@budgie/sync';
import { useAtomRefresh } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Input } from '../../../@generic/component/input/input';
import { useEffectAction } from '../../../@generic/hook/use-effect-action.hook';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useBankIntegration } from '../../context/bank-integration.context';
import { bankIntegrationAccountPreviewsAtom } from '../../query/use-bank-integration-new-accounts.query';
import { PasteTokenButton } from '../paste-token-button/paste-token-button';
import { SyncTokenSectionActions } from '../sync-token-section-actions/sync-token-section-actions';

import { SyncTokenSectionSelector } from './sync-token-section.selector';

const maskToken = (token: string): string => {
    const MIN_TOKEN_LENGTH = 8;
    if (token.length <= MIN_TOKEN_LENGTH) {
        return '••••••••';
    }

    return `${token.slice(0, 4)}••••${token.slice(-4)}`;
};

export const SyncTokenSection = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const refreshAccountPreviews = useAtomRefresh(bankIntegrationAccountPreviewsAtom(integration.id));

    const [isEditing, setIsEditing] = useState(false);
    const [newToken, setNewToken] = useState('');
    const [runEffect, isSaving] = useEffectAction(t`Could not update token`);

    const handleEdit = () => {
        setIsEditing(true);
        setNewToken('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setNewToken('');
    };

    const showTokenErrorToast = (title: string, text: string) => Effect.sync(() => void showErrorToast(title, text));

    const handleSave = () => {
        const trimmedToken = newToken.trim();

        if (!isNotEmptyString(trimmedToken)) {
            return;
        }

        runEffect(
            Effect.flatMap(SyncProviderRegistryService, registry => registry.updateIntegrationToken(integration.id, trimmedToken)).pipe(
                Effect.tap(() => Effect.sync(handleCancel)),
                Effect.tap(() => Effect.sync(refreshAccountPreviews)),
                Effect.catchTags({
                    SyncTokenAlreadyConnectedError: () =>
                        showTokenErrorToast(
                            t`Token already connected`,
                            t`This token already syncs another of your Monobank sections. Enter a different token.`
                        ),
                    SyncUnauthorizedError: () => showTokenErrorToast(t`Monobank rejected this key`, t`Check the key and try again.`),
                    SyncTokenClientMismatchError: () =>
                        showTokenErrorToast(
                            t`This key is for a different Monobank client`,
                            t`Use the key for the accounts in this section.`
                        ),
                    SyncRateLimitedError: () =>
                        showTokenErrorToast(
                            t`Could not update token`,
                            t`Monobank limits how often keys can be checked. Try again in a minute.`
                        )
                })
            )
        );
    };

    return (
        <View className="gap-y-sm">
            <Text className="text-xs text-secondary-foreground" testID={SyncTokenSectionSelector.TokenLabel}>
                {t`API Token`}
            </Text>

            {isEditing ? (
                <View className="gap-y-sm">
                    <View className="flex-row items-center gap-x-sm">
                        <Input
                            className="flex-1"
                            value={newToken}
                            onChangeText={setNewToken}
                            placeholder={t`Enter new token`}
                            autoCapitalize="none"
                            autoCorrect={false}
                            secureTextEntry
                        />
                        <PasteTokenButton onPaste={setNewToken} testID={SyncTokenSectionSelector.MonobankPasteButton} />
                    </View>
                    <SyncTokenSectionActions onCancel={handleCancel} onSave={handleSave} isSaving={isSaving} />
                </View>
            ) : (
                <View className="flex-row items-center justify-between">
                    <Text className="text-primary text-sm font-mono">{maskToken(integration.token)}</Text>
                    <Button
                        variant="default"
                        size="sm"
                        onPress={handleEdit}
                        content={t`Change`}
                        testID={SyncTokenSectionSelector.ChangeButton}
                    />
                </View>
            )}
        </View>
    );
};
