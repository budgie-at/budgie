import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListItem } from '../../../@generic/component/grouped-list-item/grouped-list-item';
import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { getAccountDisplayTitle } from '../../utils/get-account-display-title.util';
import { InactiveAccountCardSelector } from '../inactive-account-card/inactive-account-card.selector';
import { ShelvedAccountRow } from '../shelved-account-row/shelved-account-row';
import { ShelvedAccountSubtitle } from '../shelved-account-subtitle/shelved-account-subtitle';

import type { ShelvedAccountAccessibilityActionInterface } from '../../interface/shelved-account-accessibility-action.interface';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
    readonly isFirst: boolean;
    readonly isLast: boolean;
}

const NO_ACCESSIBILITY_ACTIONS: ShelvedAccountAccessibilityActionInterface[] = [];

export const AutomaticAccountCard = ({ account, isFirst, isLast }: Props) => {
    const { t } = useLingui();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const { balance } = useAccountBalanceQuery(account.id);

    const currencyCode = account.instrument.symbol;
    const balanceLabel = balance === 0 ? t`All matched` : formatInstrumentAmount(balance, currencyCode, account.instrument.type);
    const metadata = t`Automatic · ${currencyCode}`;
    const notice = account.includeInNetWorth ? null : t`Not counted in net worth`;
    const accessibilityLabel = [getAccountDisplayTitle(account), t`Automatic account`, balanceLabel, currencyCode, notice]
        .filter(isNotEmptyString)
        .join(', ');

    const handleOpen = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(account.id) } });

    return (
        <View>
            {isFirst ? (
                <View className="pt-2xl">
                    <GroupedListSectionTitle title={t`Automatic accounts`} />
                </View>
            ) : null}

            <GroupedListItem isFirst={isFirst} isLast={isLast}>
                <ShelvedAccountRow
                    account={account}
                    subtitle={<ShelvedAccountSubtitle formattedBalance={balanceLabel} metadata={metadata} notice={notice} />}
                    trailing={null}
                    accessibilityLabel={accessibilityLabel}
                    accessibilityActions={NO_ACCESSIBILITY_ACTIONS}
                    testID={InactiveAccountCardSelector.Card(account.title)}
                    onPress={handleOpen}
                />
            </GroupedListItem>
        </View>
    );
};
