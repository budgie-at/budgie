import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CollapsibleChromeScrollFade } from '../../../@generic/component/collapsible-chrome-scroll-fade/collapsible-chrome-scroll-fade';
import { cn } from '../../../@generic/utils/cn.util';
import { useAccountSync } from '../../../sync/hook/use-account-sync.hook';
import { ACCOUNT_SYNC_STATE_COLOR } from '../../constant/account-sync-state-color.constant';
import { ACCOUNT_SYNC_STATE_LABEL } from '../../constant/account-sync-state-label.constant';
import { BANK_PROVIDER_TITLE } from '../../constant/bank-provider-title.constant';
import { AccountSyncStateEnum } from '../../enum/account-sync-state.enum';
import { getAccountSyncState } from '../../utils/get-account-sync-state.util';

interface Props {
    readonly account: Pick<AccountWithInstrumentEntityInterface, 'id' | 'iban'>;
}

export const AccountDetailsStatusLine = ({ account }: Props) => {
    const { t } = useLingui();
    const { sync } = useAccountSync(account.id);

    const syncState = getAccountSyncState(sync);
    const providerTitle = isDefined(sync) ? BANK_PROVIDER_TITLE[sync.provider] : null;
    const ibanSuffix = isNotEmptyString(account.iban) ? `••${account.iban.slice(-4)}` : null;
    const details = [isDefined(providerTitle) ? t(providerTitle) : null, ibanSuffix].filter(isDefined).join(' · ');
    const detailsSuffix = isNotEmptyString(details) ? ` · ${details}` : '';

    if (!isDefined(syncState)) {
        return isNotEmptyString(details) ? (
            <CollapsibleChromeScrollFade>
                <Text className="text-sm text-secondary-foreground text-center" numberOfLines={1}>
                    {details}
                </Text>
            </CollapsibleChromeScrollFade>
        ) : null;
    }

    const labelClassName = syncState === AccountSyncStateEnum.FAILED ? 'text-destructive-foreground' : 'text-secondary-foreground';

    return (
        <CollapsibleChromeScrollFade>
            <View className="max-w-full flex-row items-center justify-center gap-x-sm">
                <View className={cn('size-[8px] rounded-full', ACCOUNT_SYNC_STATE_COLOR[syncState])} />
                <Text className="shrink text-sm text-secondary-foreground" numberOfLines={1}>
                    <Text className={labelClassName}>{t(ACCOUNT_SYNC_STATE_LABEL[syncState])}</Text>
                    {detailsSuffix}
                </Text>
            </View>
        </CollapsibleChromeScrollFade>
    );
};
