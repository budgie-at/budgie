import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';
import { BankIntegrationKeyModalSelector } from '../../../app/bank-integration-key.selector';
import { PasteTokenButton } from '../paste-token-button/paste-token-button';
import { SyncTokenSectionSelector } from '../sync-token-section/sync-token-section.selector';

interface Props {
    readonly value: string;
    readonly onChangeText: (value: string) => void;
    readonly errorMessage: string;
    readonly isKeyRejected: boolean;
}

export const BankIntegrationKeyField = ({ value, onChangeText, errorMessage, isKeyRejected }: Props) => {
    const { t } = useLingui();

    return (
        <FormItem className="gap-y-[8px]">
            <Text className="text-[13px] text-secondary-foreground">
                <Trans>API key</Trans>
            </Text>
            <View className="flex-row items-center gap-x-sm">
                <Input
                    className="flex-1 bg-grouped-surface-fill border-surface-separator"
                    size="md"
                    textContentType="none"
                    autoComplete="off"
                    importantForAutofill="no"
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={t`Paste API key`}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    secureTextEntry
                    testID={BankIntegrationKeyModalSelector.Input}
                />
                <PasteTokenButton className="h-[44px] py-0" onPaste={onChangeText} testID={SyncTokenSectionSelector.MonobankPasteButton} />
            </View>
            {isKeyRejected ? (
                <Text className="mt-[-2px] text-[13px] text-destructive-strong">
                    <Trans>Your current key was rejected. Paste a new one to resume syncing.</Trans>
                </Text>
            ) : null}
            {isNotEmptyString(errorMessage) ? <Text className="text-destructive-strong text-xs">{errorMessage}</Text> : null}
        </FormItem>
    );
};
