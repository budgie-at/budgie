import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { AccountSyncStateEnum } from '../../enum/account-sync-state.enum';

interface Props {
    readonly title: string;
    readonly iban: string | null;
    readonly syncState: AccountSyncStateEnum | null;
    readonly syncStateLabel: string | null;
}

export const AccountCardTitle = ({ title, iban, syncState, syncStateLabel }: Props) => {
    const isSyncIssue =
        syncState === AccountSyncStateEnum.SYNCING ||
        syncState === AccountSyncStateEnum.FAILED ||
        syncState === AccountSyncStateEnum.DISABLED;
    const ibanSuffix = isNotEmptyString(iban) ? `••${iban.slice(-4)}` : null;
    const detail = isSyncIssue ? syncStateLabel : ibanSuffix;
    const detailToneClassName = syncState === AccountSyncStateEnum.FAILED ? 'text-destructive-foreground' : 'text-secondary-foreground';

    return (
        <View className="min-w-0 flex-1 gap-y-xxs">
            <Text
                className="text-[15px] font-medium text-primary"
                maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                numberOfLines={2}
                ellipsizeMode="tail"
            >
                {title}
            </Text>
            {isDefined(detail) ? (
                <Text
                    className={cn('text-[13px] tabular-nums', detailToneClassName)}
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                    numberOfLines={1}
                >
                    {detail}
                </Text>
            ) : null}
        </View>
    );
};
