import { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { useAccountSync } from '../../../sync/hook/use-account-sync.hook';
import { getAccountIdentityLabel } from '../../../sync/utils/get-account-identity-label.util';
import { ACCOUNT_SYNC_STATE_COLOR } from '../../constant/account-sync-state-color.constant';
import { ACCOUNT_SYNC_STATE_LABEL } from '../../constant/account-sync-state-label.constant';
import { BANK_PROVIDER_TITLE } from '../../constant/bank-provider-title.constant';
import { AccountSyncStateEnum } from '../../enum/account-sync-state.enum';
import { getAccountSyncState } from '../../utils/get-account-sync-state.util';

interface Props {
    readonly account: Pick<AccountWithInstrumentEntityInterface, 'id' | 'iban' | AccountAssociationEnum.INSTRUMENT>;
}

export const AccountDetailsStatusLine = ({ account }: Props) => {
    const { t } = useLingui();
    const { sync } = useAccountSync(account.id);

    const syncState = getAccountSyncState(sync);
    const providerTitle = isDefined(sync) ? BANK_PROVIDER_TITLE[sync.provider] : null;
    const details = [isDefined(providerTitle) ? t(providerTitle) : null, getAccountIdentityLabel(account.instrument.code, account.iban)]
        .filter(isDefined)
        .join(' · ');

    if (!isDefined(syncState)) {
        return (
            <Text className="text-sm text-secondary-foreground text-center" numberOfLines={1}>
                {details}
            </Text>
        );
    }

    const labelClassName = syncState === AccountSyncStateEnum.FAILED ? 'text-destructive-foreground' : 'text-secondary-foreground';

    return (
        <View className="max-w-full flex-row items-center justify-center gap-x-sm">
            <View className={cn('size-[8px] rounded-full', ACCOUNT_SYNC_STATE_COLOR[syncState])} />
            <Text className="shrink text-sm text-secondary-foreground" numberOfLines={1}>
                <Text className={labelClassName}>{t(ACCOUNT_SYNC_STATE_LABEL[syncState])}</Text>
                {` · ${details}`}
            </Text>
        </View>
    );
};
