import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { BankSyncRepairsPageSelector } from '../../../app/(tabs)/settings/bank-sync-repairs-page.selector';

interface Props {
    readonly countText: string;
    readonly isRepairing: boolean;
    readonly onCancel: () => void;
    readonly onConfirm: () => void;
}

export const BankSyncRepairsConfirmationCard = ({ countText, isRepairing, onCancel, onConfirm }: Props) => {
    const { t } = useLingui();

    return (
        <Card className="gap-y-2xl" variant="destructive">
            <View className="gap-y-sm">
                <Text className="text-destructive-foreground text-base font-semibold">
                    <Trans>Are you sure?</Trans>
                </Text>

                <Text className="text-destructive-foreground text-sm">
                    <Trans>Budgie will soft-delete {countText}. This keeps your manual transactions unchanged.</Trans>
                </Text>
            </View>

            <View className="flex-row gap-x-md">
                <Button className="flex-1" onPress={onCancel} disabled={isRepairing} content={t`Cancel`} variant="ghost" size="sm" />

                <Button
                    className="flex-1"
                    testID={BankSyncRepairsPageSelector.RepairButton}
                    onPress={onConfirm}
                    isLoading={isRepairing}
                    content={t`Repair`}
                    leftIcon={UserIconNameEnum.Wrench}
                    variant="destructive"
                    size="sm"
                />
            </View>
        </Card>
    );
};
