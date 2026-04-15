import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { BankAccountPreviewInterface } from '../../interface/bank-account-preview-interface.type';

import { BankAccountPreviewCardSelector } from './bank-account-preview-card.selector';

interface Props {
    readonly preview: BankAccountPreviewInterface;
    readonly isSelected: boolean;
    readonly onToggle: (externalId: string) => void;
}

export const BankAccountPreviewCard = ({ preview, isSelected, onToggle }: Props) => {
    const handleToggle = () => {
        onToggle(preview.externalId);
    };

    return (
        <Card className="p-4xl" onPress={handleToggle} testID={BankAccountPreviewCardSelector.Row(preview.title)}>
            <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-md">
                    <Text className="text-primary font-semibold text-base">{preview.title}</Text>
                    <Text className="text-xs text-muted-foreground">
                        {preview.currencyCode}
                        {isNotEmptyString(preview.iban) && ` • ${preview.iban}`}
                    </Text>
                    {preview.hasBankSync && (
                        <Text className="text-xs text-green-600">
                            <Trans>Already syncing</Trans>
                        </Text>
                    )}
                </View>
                <ThemedSwitch
                    value={isSelected}
                    onValueChange={handleToggle}
                    testID={BankAccountPreviewCardSelector.Toggle(preview.title)}
                />
            </View>
        </Card>
    );
};
