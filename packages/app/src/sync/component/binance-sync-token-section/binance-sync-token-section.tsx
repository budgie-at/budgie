import { BinanceCredentialsSchema } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useSyncTokenUpdate } from '../../hook/use-sync-token-update.hook';
import { BinanceSyncTokenInputs } from '../binance-sync-token-inputs/binance-sync-token-inputs';
import { BinanceSyncTokenSummary } from '../binance-sync-token-summary/binance-sync-token-summary';
import { SyncTokenSectionActions } from '../sync-token-section-actions/sync-token-section-actions';

interface Props {
    readonly accountId: number;
    readonly token: string;
}

export const BinanceSyncTokenSection = ({ accountId, token }: Props) => {
    const { t } = useLingui();

    const [isEditing, setIsEditing] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const { isSaving, saveAccountSyncToken } = useSyncTokenUpdate();

    const handleEdit = () => {
        try {
            const parsedToken: unknown = JSON.parse(token);
            const credentialsResult = BinanceCredentialsSchema.safeParse(parsedToken);

            if (credentialsResult.success) {
                setApiKey(credentialsResult.data.apiKey);
                setApiSecret(credentialsResult.data.apiSecret);

                setIsEditing(true);

                return;
            }
        } catch {
            setApiKey('');
            setApiSecret('');
            setIsEditing(true);

            return;
        }

        setApiKey('');
        setApiSecret('');
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setApiKey('');
        setApiSecret('');
    };

    const handleSave = async () => {
        const trimmedApiKey = apiKey.trim();
        const trimmedApiSecret = apiSecret.trim();

        if (!isNotEmptyString(trimmedApiKey) || !isNotEmptyString(trimmedApiSecret)) {
            showErrorToast(t`Credentials required`, t`Please enter your Binance API key and secret`);

            return;
        }

        await saveAccountSyncToken(accountId, JSON.stringify({ apiKey: trimmedApiKey, apiSecret: trimmedApiSecret }), () => {
            setIsEditing(false);
            setApiKey('');
            setApiSecret('');
        });
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
