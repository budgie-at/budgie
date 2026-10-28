import { BinanceCredentialsSchema, SyncProviderRegistryService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useSyncToken } from '../../hook/use-sync-token.hook';
import { toastBinanceKeyPermissionsError } from '../../utils/toast-binance-key-permissions-error.util';
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
    const { isLoading: isSaving, run } = useSingleFlight();

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

        void run(
            Effect.flatMap(SyncProviderRegistryService, registry =>
                registry.updateAccountToken(accountId, JSON.stringify({ apiKey: trimmedApiKey, apiSecret: trimmedApiSecret }))
            ).pipe(
                Effect.tap(() =>
                    Effect.sync(() => {
                        setIsEditing(false);
                        setApiKey('');
                        setApiSecret('');
                    })
                ),
                Effect.catchTag('BinanceKeyPermissionsError', toastBinanceKeyPermissionsError),
                toastOnFailure(t`Could not update token`)
            )
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
