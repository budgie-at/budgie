import { useLingui } from '@lingui/react/macro';
import { Children } from 'react';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { EnableBankingBankRow } from '../../../sync/component/enable-banking-bank-row/enable-banking-bank-row';
import { openEnableBankingBank } from '../../../sync/utils/open-enable-banking-bank.util';
import { useCreateBankSearch } from '../../hook/use-create-bank-search.hook';
import { CreateBankSearchLoadingRow } from '../create-bank-search-loading-row/create-bank-search-loading-row';
import { CreateBankSearchRetryRow } from '../create-bank-search-retry-row/create-bank-search-retry-row';
import { CreateMoreBanksCard } from '../create-more-banks-card/create-more-banks-card';
import { CreateSearchNoMatch } from '../create-search-no-match/create-search-no-match';

import type { ReactNode } from 'react';

interface Props {
    readonly query: string;
    readonly children: ReactNode;
}

export const CreateBankSearchResults = ({ query, children }: Props) => {
    const { t } = useLingui();
    const { banks, isLoading, isFailure, isTrailing, retry } = useCreateBankSearch(query);
    const hasBankMatches = isNotEmptyArray(banks);
    const isLeading = hasBankMatches && !isTrailing;
    const hasNoMatch = !isLoading && !isFailure && !hasBankMatches && isEmptyArray(Children.toArray(children));
    const noMatchFooter = hasNoMatch ? <CreateSearchNoMatch query={query} /> : null;
    const footer = hasBankMatches ? t`Read-only through Enable Banking.` : noMatchFooter;
    const moreBanksCard = <CreateMoreBanksCard title={t`2,000+ European banks`} subtitle={t`Sign in on your bank's own page`} />;
    const bankRows = banks.map(bank => (
        <EnableBankingBankRow key={`${bank.country}-${bank.name}`} bank={bank} onSelect={openEnableBankingBank} />
    ));

    return isLeading ? (
        <>
            <GroupedListSection title={t`European banks`} footer={footer}>
                {bankRows}
                {moreBanksCard}
            </GroupedListSection>
            {children}
        </>
    ) : (
        <>
            {children}
            <GroupedListSection title={t`European banks`} footer={footer}>
                {moreBanksCard}
                {isLoading ? <CreateBankSearchLoadingRow /> : null}
                {isFailure ? <CreateBankSearchRetryRow onRetry={retry} /> : null}
                {bankRows}
            </GroupedListSection>
        </>
    );
};
