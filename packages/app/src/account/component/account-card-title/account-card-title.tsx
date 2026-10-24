import { Text } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

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
    const suffix = isSyncIssue ? syncStateLabel : ibanSuffix;
    const suffixToneClassName = syncState === AccountSyncStateEnum.FAILED ? 'text-destructive-foreground' : 'text-primary/40';

    return (
        <Text className="text-[13px] leading-[18px] text-primary/65" numberOfLines={2} ellipsizeMode="tail">
            {title}
            {isDefined(suffix) ? <Text className={cn('text-xs tabular-nums', suffixToneClassName)}>{` ${suffix}`}</Text> : null}
        </Text>
    );
};
