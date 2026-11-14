import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { foldSearchText } from '../../../@generic/utils/fold-search-text.util';
import { EnableBankingBankRow } from '../../../sync/component/enable-banking-bank-row/enable-banking-bank-row';
import { enableBankingPublicBanksAtom } from '../../../sync/constant/enable-banking-public-banks-atom.constant';
import { openEnableBankingBank } from '../../../sync/utils/open-enable-banking-bank.util';
import { sortEnableBankingBanks } from '../../../sync/utils/sort-enable-banking-banks.util';
import { CreateMoreBanksCard } from '../create-more-banks-card/create-more-banks-card';

import type { EnableBankingBankInterface } from '@budgie/sync';

interface Props {
    readonly query: string;
}

const NO_BANKS: readonly EnableBankingBankInterface[] = [];
const MAX_RESULTS = 5;

export const CreateBankSearchResults = ({ query }: Props) => {
    const { t } = useLingui();
    const result = useAtomValue(enableBankingPublicBanksAtom);

    const banks = sortEnableBankingBanks(
        AsyncResult.getOrElse(result, () => NO_BANKS).filter(bank => bank.isSupported && foldSearchText(bank.name).includes(query))
    ).slice(0, MAX_RESULTS);
    const footer =
        AsyncResult.isSuccess(result) && isEmptyArray(banks)
            ? t`No bank matches this name. Open the full list to browse by country.`
            : t`Read-only. You sign in on your bank's own page.`;

    return (
        <GroupedListSection title={t`European banks`} footer={footer}>
            {banks.map(bank => (
                <EnableBankingBankRow key={`${bank.country}-${bank.name}`} bank={bank} onSelect={openEnableBankingBank} />
            ))}
            <CreateMoreBanksCard title={t`2,000+ European banks`} subtitle={t`Sign in on your bank's own page`} />
        </GroupedListSection>
    );
};
