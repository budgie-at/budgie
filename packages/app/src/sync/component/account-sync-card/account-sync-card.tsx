import { Trans, useLingui } from '@lingui/react/macro';
import { formatDistanceStrict } from 'date-fns';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { ThemedSwitch } from '../../../@generic/components/themed-switch/themed-switch';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { AccountSyncCursorInterface } from '../../interface/account-sync-cursor.interface';

interface Props {
    readonly cursor: AccountSyncCursorInterface;
    readonly onToggle: (accountId: number, enabled: boolean) => void;
}

// eslint-disable-next-line max-lines-per-function
export const AccountSyncCard = ({ cursor, onToggle }: Props) => {
    const { t } = useLingui();

    const hasCompletedHistoricalSync = isDefined(cursor.historySyncedTill);
    const { formatDayAndMonthAndYearWithTime } = useFormatDate();

    const getStatusLabel = () => {
        if (cursor.completed && hasCompletedHistoricalSync) {
            return t`Up to date`;
        } else if (cursor.completed) {
            return t`Historical sync done`;
        } else if (isDefined(cursor.startedAt)) {
            return hasCompletedHistoricalSync ? t`Fetching new...` : t`Syncing history...`;
        }

        return t`Waiting`;
    };

    const getStatusColor = () => {
        if (cursor.completed) {
            return 'text-success';
        } else if (isDefined(cursor.startedAt)) {
            return 'text-warning';
        }

        return 'text-muted-foreground';
    };

    const getElapsedTime = (): string | null => {
        if (!isDefined(cursor.startedAt)) {
            return null;
        }

        return formatDistanceStrict(cursor.completedAt ?? new Date(), cursor.startedAt);
    };

    const handleToggle = (value: boolean) => {
        onToggle(cursor.accountId, value);
    };

    const accountTitle = isNotEmptyString(cursor.accountName) ? cursor.accountName : `${t`Account`} #${cursor.accountId}`;

    return (
        <Card className="p-4xl gap-y-lg">
            <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-md">
                    <Text className="text-primary font-semibold text-base" numberOfLines={1}>
                        {accountTitle}
                    </Text>
                    <Text className={`text-xs ${getStatusColor()}`}>{getStatusLabel()}</Text>
                </View>
                <ThemedSwitch value={cursor.enabled} onValueChange={handleToggle} />
            </View>

            {cursor.enabled && (
                <View className="gap-y-sm border-t border-secondary-corner pt-lg">
                    <View className="flex-row justify-between">
                        <Text className="text-primary text-xs text-muted-foreground">
                            <Trans>Transactions</Trans>
                        </Text>
                        <Text className="text-primary text-xs font-medium">{cursor.transactionCount}</Text>
                    </View>

                    {isDefined(cursor.historySyncedTill) ? (
                        <View className="flex-row justify-between">
                            <Text className="text-primary text-xs text-muted-foreground">
                                <Trans>Synced until</Trans>
                            </Text>
                            <Text className="text-primary text-xs">{formatDayAndMonthAndYearWithTime(cursor.historySyncedTill)}</Text>
                        </View>
                    ) : (
                        <View className="flex-row justify-between">
                            <Text className="text-primary text-xs text-muted-foreground">
                                <Trans>Synced until</Trans>
                            </Text>
                            <Text className="text-primary text-xs">{formatDayAndMonthAndYearWithTime(cursor.fromTime)}</Text>
                        </View>
                    )}

                    {isDefined(cursor.toTime) && (
                        <View className="flex-row justify-between">
                            <Text className="text-primary text-xs text-muted-foreground">
                                <Trans>Last sync</Trans>
                            </Text>
                            <Text className="text-primary text-xs">{formatDayAndMonthAndYearWithTime(cursor.toTime)}</Text>
                        </View>
                    )}

                    {isDefined(getElapsedTime()) && (
                        <View className="flex-row justify-between">
                            <Text className="text-primary text-xs text-muted-foreground">
                                <Trans>Duration</Trans>
                            </Text>
                            <Text className="text-primary text-xs">{getElapsedTime()}</Text>
                        </View>
                    )}
                </View>
            )}
        </Card>
    );
};
