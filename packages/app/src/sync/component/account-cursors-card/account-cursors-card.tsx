import { Trans, useLingui } from '@lingui/react/macro';
import { format, formatDistanceStrict } from 'date-fns';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { AccountSyncCursorInterface } from '../../interface/bank-sync-state.interface';

interface Props {
    readonly cursors: AccountSyncCursorInterface[];
}

export const AccountCursorsCard = ({ cursors }: Props) => {
    const { t } = useLingui();

    if (!isNotEmptyArray(cursors)) {
        return null;
    }

    const getStatusMessage = (cursor: AccountSyncCursorInterface) => {
        if (cursor.completed) {
            return t`Completed`;
        } else if (isDefined(cursor.startedAt)) {
            return t`In Progress`;
        }

        return t`Waiting`;
    };

    const getElapsedTime = (cursor: AccountSyncCursorInterface): string | null => {
        if (!isDefined(cursor.startedAt)) {
            return null;
        }

        const endTime = cursor.completedAt ?? new Date();

        return formatDistanceStrict(cursor.startedAt, endTime);
    };

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
                                {getStatusMessage(cursor)}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-primary text-xs">
                                <Trans>Last period</Trans>
                            </Text>
                            <Text className="text-primary text-xs">
                                {format(cursor.fromTime, 'dd MMMM yyyy')} - {format(cursor.toTime, 'dd MMMM yyyy')}
                            </Text>
                        </View>
                        {isDefined(getElapsedTime(cursor)) && (
                            <View className="flex-row justify-between">
                                <Text className="text-primary text-xs">
                                    <Trans>Elapsed</Trans>
                                </Text>
                                <Text className="text-primary text-xs">{getElapsedTime(cursor)}</Text>
                            </View>
                        )}
                    </View>
                ))}
            </View>
        </Card>
    );
};
