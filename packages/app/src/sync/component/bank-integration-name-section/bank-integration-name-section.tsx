import { SyncProviderRegistryService } from '@budgie/sync';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { Input } from '../../../@generic/component/input/input';
import { useEffectAction } from '../../../@generic/hook/use-effect-action.hook';
import { useBankIntegration } from '../../context/bank-integration.context';
import { SyncTokenSectionActions } from '../sync-token-section-actions/sync-token-section-actions';

import { BankIntegrationNameSectionSelector } from './bank-integration-name-section.selector';

export const BankIntegrationNameSection = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();

    const [isEditing, setIsEditing] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [runEffect, isSaving] = useEffectAction(t`Could not rename`);

    const handleEdit = () => {
        setNewLabel(integration.label ?? '');
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setNewLabel('');
    };

    const handleSave = () => {
        runEffect(
            Effect.flatMap(SyncProviderRegistryService, registry => registry.renameIntegration(integration.id, newLabel)),
            handleCancel
        );
    };

    const displayedLabel = integration.label ?? t`Not set`;

    return (
        <View className="gap-y-sm">
            <Text className="text-xs text-secondary-foreground">
                <Trans>Name</Trans>
            </Text>

            {isEditing ? (
                <View className="gap-y-sm">
                    <Input
                        value={newLabel}
                        onChangeText={setNewLabel}
                        placeholder={t`Section name`}
                        testID={BankIntegrationNameSectionSelector.NameInput}
                    />
                    <SyncTokenSectionActions onCancel={handleCancel} onSave={handleSave} isSaving={isSaving} />
                </View>
            ) : (
                <View className="flex-row items-center justify-between">
                    <Text className="text-primary text-sm">{displayedLabel}</Text>
                    <Button
                        variant="default"
                        size="sm"
                        onPress={handleEdit}
                        content={t`Rename`}
                        testID={BankIntegrationNameSectionSelector.RenameButton}
                    />
                </View>
            )}
        </View>
    );
};
