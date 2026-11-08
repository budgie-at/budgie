import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { emptyFn, isNotEmptyString } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { GroupedListItem } from '../../../@generic/component/grouped-list-item/grouped-list-item';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useArchiveAccount } from '../../hooks/use-archive-account.hook';
import { useUnhideAccount } from '../../hooks/use-unhide-account.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { getAccountDisplayTitle } from '../../utils/get-account-display-title.util';
import { isUntrackedOwnAccount } from '../../utils/is-untracked-own-account.util';
import { InactiveAccountTrailing } from '../inactive-account-trailing/inactive-account-trailing';
import { ShelvedAccountRow } from '../shelved-account-row/shelved-account-row';
import { ShelvedAccountSubtitle } from '../shelved-account-subtitle/shelved-account-subtitle';

import { InactiveAccountCardSelector } from './inactive-account-card.selector';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
    readonly isFirst: boolean;
    readonly isLast: boolean;
}

export const InactiveAccountCard = ({ account, isFirst, isLast }: Props) => {
    const { t } = useLingui();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const { balance } = useAccountBalanceQuery(account.id);
    const { isLoading, unhide } = useUnhideAccount(account);
    const { handleArchive, isArchivable } = useArchiveAccount(account.id, emptyFn);

    const isAutomatic = isUntrackedOwnAccount(account);
    const canArchive = isArchivable && !isAutomatic;
    const formattedBalance = formatInstrumentAmount(balance, account.instrument.symbol, account.instrument.type);
    const accountType = t(ACCOUNT_TYPE[account.type]);
    const notice = account.includeInNetWorth ? null : t`Not counted in net worth`;
    const accessibilityLabel = [getAccountDisplayTitle(account), formattedBalance, accountType, notice].filter(isNotEmptyString).join(', ');

    const handleOpen = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(account.id) } });
    const handleEdit = () => void router.push({ pathname: '/account/[id]/update', params: { id: String(account.id) } });
    const accessibilityActions = [
        ...(isAutomatic ? [] : [{ name: 'unhide', label: t`Unhide`, onPress: unhide }]),
        ...(canArchive ? [{ name: 'archive', label: t`Archive`, onPress: handleArchive }] : [])
    ];

    return (
        <GroupedListItem isFirst={isFirst} isLast={isLast}>
            <ShelvedAccountRow
                account={account}
                subtitle={<ShelvedAccountSubtitle formattedBalance={formattedBalance} metadata={accountType} notice={notice} />}
                trailing={<InactiveAccountTrailing account={account} isLoading={isLoading} onUnhide={unhide} />}
                accessibilityLabel={accessibilityLabel}
                accessibilityActions={accessibilityActions}
                testID={InactiveAccountCardSelector.Card(account.title)}
                onPress={handleOpen}
            >
                {isAutomatic ? null : <ActionsMenuItem icon={UserIconNameEnum.Eye} label={t`Unhide`} onPress={unhide} />}
                {isAutomatic ? null : <ActionsMenuItem icon={UserIconNameEnum.Pencil} label={t`Edit account`} onPress={handleEdit} />}
                {canArchive ? <ActionsMenuItem icon={UserIconNameEnum.Archive} label={t`Archive`} onPress={handleArchive} /> : null}
            </ShelvedAccountRow>
        </GroupedListItem>
    );
};
