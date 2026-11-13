import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Arr from 'effect/Array';
import * as Order from 'effect/Order';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { foldSearchText } from '../../../@generic/utils/fold-search-text.util';
import { EnableBankingBankRow } from '../../../sync/component/enable-banking-bank-row/enable-banking-bank-row';
import { enableBankingPublicBanksAtom } from '../../../sync/constant/enable-banking-public-banks-atom.constant';
import { openEnableBankingBank } from '../../../sync/utils/open-enable-banking-bank.util';
import { CreateMoreBanksCard } from '../create-more-banks-card/create-more-banks-card';

import type { EnableBankingBankInterface } from '@budgie/sync';

interface Props {
    readonly query: string;
}

const NO_BANKS: readonly EnableBankingBankInterface[] = [];
const MAX_RESULTS = 5;
const BANK_NAME_ORDER = Order.mapInput(Order.String, (bank: EnableBankingBankInterface) => bank.name.toLocaleLowerCase());

export const CreateBankSearchResults = ({ query }: Props) => {
    const { t } = useLingui();
    const result = useAtomValue(enableBankingPublicBanksAtom);

    const banks = Arr.sort(
        AsyncResult.getOrElse(result, () => NO_BANKS).filter(bank => bank.isSupported && foldSearchText(bank.name).includes(query)),
        BANK_NAME_ORDER
    ).slice(0, MAX_RESULTS);

    return (
        <GroupedListSection title={t`European banks`} footer={t`Read-only. You sign in on your bank's own page.`}>
            {banks.map(bank => (
                <EnableBankingBankRow key={`${bank.country}-${bank.name}`} bank={bank} onSelect={openEnableBankingBank} />
            ))}
            <CreateMoreBanksCard title={t`2,000+ European banks`} subtitle={t`Sign in on your bank's own page`} />
        </GroupedListSection>
    );
};
