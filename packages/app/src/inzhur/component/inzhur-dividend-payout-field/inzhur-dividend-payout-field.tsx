import { AccountRepository, DividendPayoutEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { InzhurDividendPayoutOption } from '../inzhur-dividend-payout-option/inzhur-dividend-payout-option';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'dividendPayout'>;
}

export const InzhurDividendPayoutField = ({ account }: Props) => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();

    const handleSelect = (dividendPayout: DividendPayoutEnum) =>
        run(
            Effect.flatMap(AccountRepository, accountRepository => accountRepository.updateById(account.id, { dividendPayout })).pipe(
                toastOnFailure(t`Could not update the dividend setting`)
            )
        );

    return (
        <GroupedListSection
            title={t`Dividends go to`}
            footer={t`Dividends kept on the Inzhur balance are reinvested in more certificates of this fund.`}
        >
            <InzhurDividendPayoutOption
                payout={DividendPayoutEnum.BANK}
                isSelected={account.dividendPayout === DividendPayoutEnum.BANK}
                isDisabled={isLoading}
                onSelect={handleSelect}
            />
            <InzhurDividendPayoutOption
                payout={DividendPayoutEnum.REINVEST}
                isSelected={account.dividendPayout === DividendPayoutEnum.REINVEST}
                isDisabled={isLoading}
                onSelect={handleSelect}
            />
        </GroupedListSection>
    );
};
