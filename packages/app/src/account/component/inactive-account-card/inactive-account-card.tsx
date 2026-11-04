import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { emptyFn, isNotEmptyString } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { GroupedListItem } from '../../../@generic/component/grouped-list-item/grouped-list-item';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { SettingsPillButton } from '../../../settings/components/settings-pill-button/settings-pill-button';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useArchiveAccount } from '../../hooks/use-archive-account.hook';
import { useUnhideAccount } from '../../hooks/use-unhide-account.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
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
    const { handleArchive } = useArchiveAccount(account.id, emptyFn);

    const accountTitle = account.title;
    const formattedBalance = formatInstrumentAmount(balance, account.instrument.symbol, account.instrument.type);
    const accountType = t(ACCOUNT_TYPE[account.type]);
    const notice = account.includeInNetWorth ? null : t`Not counted in net worth`;
    const accessibilityLabel = [accountTitle, formattedBalance, accountType, notice].filter(isNotEmptyString).join(', ');

    const handleOpen = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(account.id) } });
    const handleEdit = () => void router.push({ pathname: '/account/[id]/update', params: { id: String(account.id) } });
    const accessibilityActions = [
        { name: 'unhide', label: t`Unhide`, onPress: unhide },
        { name: 'archive', label: t`Archive`, onPress: handleArchive }
    ];

    return (
        <GroupedListItem isFirst={isFirst} isLast={isLast}>
            <ShelvedAccountRow
                account={account}
                subtitle={<ShelvedAccountSubtitle formattedBalance={formattedBalance} metadata={accountType} notice={notice} />}
                trailing={
                    <SettingsPillButton
                        label={t`Unhide`}
                        accessibilityLabel={t`Unhide ${accountTitle}`}
                        variant="secondary"
                        size="sm"
                        isLoading={isLoading}
                        onPress={unhide}
                        testID={InactiveAccountCardSelector.ActivateButton(accountTitle)}
                    />
                }
                accessibilityLabel={accessibilityLabel}
                accessibilityActions={accessibilityActions}
                testID={InactiveAccountCardSelector.Card(accountTitle)}
                onPress={handleOpen}
            >
                <ActionsMenuItem icon={UserIconNameEnum.Eye} label={t`Unhide`} onPress={unhide} />
                <ActionsMenuItem icon={UserIconNameEnum.Pencil} label={t`Edit account`} onPress={handleEdit} />
                <ActionsMenuItem icon={UserIconNameEnum.Archive} label={t`Archive`} onPress={handleArchive} />
            </ShelvedAccountRow>
        </GroupedListItem>
    );
};
