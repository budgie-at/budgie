import { Trans, useLingui } from '@lingui/react/macro';
import { format } from 'date-fns';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { AccountSyncCursorInterface } from '../../interface/bank-sync-state.interface';

interface Props {
    readonly cursors: AccountSyncCursorInterface[];
}

export const AccountCursorsCard = ({ cursors }: Props) => {
    const { t } = useLingui();

    return (
        <Card className="p-4xl">
            <View className="gap-y-md">
                <Text className="text-primary font-semibold text-base">
                    <Trans>Account Import Progress</Trans>
                </Text>
                {cursors.map(cursor => (
                    <View key={cursor.accountId} className="gap-y-xs border-t border-secondary-corner pt-md">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-primary text-sm font-medium">
                                {t`Account`} #{cursor.accountId}
                            </Text>
                            <Text className={`text-sm font-medium ${cursor.completed ? 'text-success' : 'text-warning'}`}>
                                {cursor.completed ? t`Completed` : t`In Progress`}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-primary text-xs">
                                <Trans>From</Trans>
                            </Text>
                            <Text className="text-primary text-xs">{format(cursor.fromTime, 'dd MMMM yyy')}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-primary text-xs">
                                <Trans>To</Trans>
                            </Text>
                            <Text className="text-primary text-xs">{format(cursor.toTime, 'dd MMMM yyy')}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </Card>
    );
};
