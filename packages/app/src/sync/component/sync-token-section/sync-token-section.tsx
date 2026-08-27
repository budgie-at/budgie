import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Input } from '../../../@generic/component/input/input';
import { useSyncTokenUpdate } from '../../hook/use-sync-token-update.hook';
import { useSyncToken } from '../../hook/use-sync-token.hook';
import { PasteTokenButton } from '../paste-token-button/paste-token-button';
import { SyncTokenSectionActions } from '../sync-token-section-actions/sync-token-section-actions';

import { SyncTokenSectionSelector } from './sync-token-section.selector';

interface Props {
    readonly accountId: number;
}

const maskToken = (token: string): string => {
    const MIN_TOKEN_LENGTH = 8;
    if (token.length <= MIN_TOKEN_LENGTH) {
        return '••••••••';
    }

    return `${token.slice(0, 4)}••••${token.slice(-4)}`;
};

export const SyncTokenSection = ({ accountId }: Props) => {
    const { t } = useLingui();

    const [isEditing, setIsEditing] = useState(false);
    const [newToken, setNewToken] = useState('');
    const { isSaving, saveAccountSyncToken } = useSyncTokenUpdate();

    const token = useSyncToken(accountId);

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

        await saveAccountSyncToken(accountId, newToken.trim(), () => {
            setIsEditing(false);
            setNewToken('');
        });
    };

    return (
        <View className="gap-y-sm pt-md border-t border-secondary-corner mt-md">
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
                    <Text className="text-primary text-sm font-mono">{maskToken(token)}</Text>
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
