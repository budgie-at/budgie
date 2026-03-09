import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Input } from '../../../@generic/component/input/input';
import { monobankSyncService } from '../../service/monobank-sync.service';
import { PasteTokenButton } from '../paste-token-button/paste-token-button';

interface Props {
    readonly accountId: number;
    readonly token: string;
}

const maskToken = (token: string): string => {
    const MIN_TOKEN_LENGTH = 8;
    if (token.length <= MIN_TOKEN_LENGTH) {
        return '••••••••';
    }

    return `${token.slice(0, 4)}••••${token.slice(-4)}`;
};

export const BankSyncTokenSection = ({ accountId, token }: Props) => {
    const { t } = useLingui();

    const [isEditing, setIsEditing] = useState(false);
    const [newToken, setNewToken] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleEdit = () => {
        setIsEditing(true);
        setNewToken('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setNewToken('');
    };

    const handleSave = async () => {
        if (!isNotEmptyString(newToken.trim())) {
            return;
        }

        setIsSaving(true);
        try {
            await monobankSyncService.updateAccountToken(accountId, newToken.trim());
            setIsEditing(false);
            setNewToken('');
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Failed to update token`, text2: String(error) });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View className="gap-y-sm pt-md border-t border-secondary-corner mt-md">
            <Text className="text-primary text-xs text-muted-foreground">{t`API Token`}</Text>

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
                        <PasteTokenButton onPaste={setNewToken} />
                    </View>
                    <View className="flex-row gap-x-sm">
                        <Button variant="secondary" size="sm" onPress={handleCancel} className="flex-1" content={t`Cancel`} />
                        <Button variant="default" size="sm" onPress={handleSave} disabled={isSaving} className="flex-1" content={t`Save`} />
                    </View>
                </View>
            ) : (
                <View className="flex-row items-center justify-between">
                    <Text className="text-primary text-sm font-mono">{maskToken(token)}</Text>
                    <Button variant="default" size="sm" onPress={handleEdit} content={t`Change`} />
                </View>
            )}
        </View>
    );
};
