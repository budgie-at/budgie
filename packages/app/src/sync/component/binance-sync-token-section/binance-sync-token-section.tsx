import { BinanceCredentialsSchema, SyncProviderRegistryService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { useEffectAction } from '../../../@generic/hook/use-effect-action.hook';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useSyncToken } from '../../hook/use-sync-token.hook';
import { BinanceSyncTokenInputs } from '../binance-sync-token-inputs/binance-sync-token-inputs';
import { BinanceSyncTokenSummary } from '../binance-sync-token-summary/binance-sync-token-summary';
import { SyncTokenSectionActions } from '../sync-token-section-actions/sync-token-section-actions';

interface Props {
    readonly accountId: number;
}

export const BinanceSyncTokenSection = ({ accountId }: Props) => {
    const { t } = useLingui();

    const token = useSyncToken(accountId);

    const [isEditing, setIsEditing] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [runEffect, isSaving] = useEffectAction(t`Could not update token`);

    const handleEdit = () => {
        const credentials = Option.getOrNull(Schema.decodeUnknownOption(Schema.fromJsonString(BinanceCredentialsSchema))(token));

        setApiKey(credentials?.apiKey ?? '');
        setApiSecret(credentials?.apiSecret ?? '');
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setApiKey('');
        setApiSecret('');
    };

    const handleSave = () => {
        const trimmedApiKey = apiKey.trim();
        const trimmedApiSecret = apiSecret.trim();

        if (!isNotEmptyString(trimmedApiKey) || !isNotEmptyString(trimmedApiSecret)) {
            showErrorToast(t`Credentials required`, t`Please enter your Binance API key and secret`);

            return;
        }

        runEffect(
            Effect.flatMap(SyncProviderRegistryService, registry =>
                registry.updateAccountToken(accountId, JSON.stringify({ apiKey: trimmedApiKey, apiSecret: trimmedApiSecret }))
            ),
            () => {
                setIsEditing(false);
                setApiKey('');
                setApiSecret('');
            }
        );
    };

    return (
        <View className="gap-y-sm pt-md border-t border-secondary-corner mt-md">
            {isEditing ? (
                <View className="gap-y-sm">
                    <BinanceSyncTokenInputs
                        apiKey={apiKey}
                        apiSecret={apiSecret}
                        onApiKeyChange={setApiKey}
                        onApiSecretChange={setApiSecret}
                    />

                    <SyncTokenSectionActions onCancel={handleCancel} onSave={handleSave} isSaving={isSaving} />
                </View>
            ) : (
                <BinanceSyncTokenSummary onEdit={handleEdit} />
            )}
        </View>
    );
};
