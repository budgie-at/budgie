import { useLingui } from '@lingui/react/macro';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { testID } from '../../../@generic/utils/test-id.util';
import { ACCOUNT_ICON } from '../../../account/constant/account-icon.constant';
import { ACCOUNT_TYPE } from '../../../account/constant/account-type.constant';
import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { CategorizeInboxTransferScreenSelector } from '../categorize-inbox-transfer-screen/categorize-inbox-transfer-screen.selector';

import type { AccountWithInstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
    readonly onSelect: (account: AccountWithInstrumentEntityInterface) => void;
}

export const CategorizeInboxTransferAccountRow = ({ account, onSelect }: Props) => {
    const { t } = useLingui();
    const { balance } = useAccountBalanceQuery(account.id);
    const formatDigits = useDisplayFormatDigits();

    const handlePress = (): void => void onSelect(account);
    const balanceText = (
        <ProtectedText className="text-primary text-[15px] tabular-nums" numberOfLines={1}>
            {formatDigits(balance, account.instrument.symbol)}
        </ProtectedText>
    );

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={ACCOUNT_ICON[account.type]} iconClassName="text-secondary-foreground" />}
            title={account.title}
            subtitle={t(ACCOUNT_TYPE[account.type])}
            right={balanceText}
            {...testID(CategorizeInboxTransferScreenSelector.Account, account.id)}
            onPress={handlePress}
        />
    );
};
