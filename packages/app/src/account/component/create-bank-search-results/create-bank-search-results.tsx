import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { Children } from 'react';

import { isNotEmptyArray } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { foldSearchText } from '../../../@generic/utils/fold-search-text.util';
import { EnableBankingBankRow } from '../../../sync/component/enable-banking-bank-row/enable-banking-bank-row';
import { enableBankingPublicBanksAtom } from '../../../sync/constant/enable-banking-public-banks-atom.constant';
import { openEnableBankingBank } from '../../../sync/utils/open-enable-banking-bank.util';
import { sortEnableBankingBanks } from '../../../sync/utils/sort-enable-banking-banks.util';
import { CreateMoreBanksCard } from '../create-more-banks-card/create-more-banks-card';
import { CreateSearchNoMatch } from '../create-search-no-match/create-search-no-match';

import type { EnableBankingBankInterface } from '@budgie/sync';
import type { ReactNode } from 'react';

interface Props {
    readonly query: string;
    readonly children: ReactNode;
}

const NO_BANKS: readonly EnableBankingBankInterface[] = [];
const MAX_RESULTS = 5;

export const CreateBankSearchResults = ({ query, children }: Props) => {
    const { t } = useLingui();
    const result = useAtomValue(enableBankingPublicBanksAtom);
    const retry = useAtomRefresh(enableBankingPublicBanksAtom);
    const isLoading = AsyncResult.isInitial(result) || result.waiting;
    const banks = sortEnableBankingBanks(
        AsyncResult.getOrElse(result, () => NO_BANKS).filter(bank => bank.isSupported && foldSearchText(bank.name).includes(query))
    ).slice(0, MAX_RESULTS);
    const hasOptionMatches = isNotEmptyArray(Children.toArray(children));
    const moreBanksCard = <CreateMoreBanksCard title={t`2,000+ European banks`} subtitle={t`Sign in on your bank's own page`} />;

    if (isLoading || isNotEmptyArray(banks)) {
        return (
            <>
                <GroupedListSection title={t`European banks`} footer={t`Read-only. You sign in on your bank's own page.`}>
                    <LoadingContent isLoading={isLoading}>
                        {banks.map(bank => (
                            <EnableBankingBankRow key={`${bank.country}-${bank.name}`} bank={bank} onSelect={openEnableBankingBank} />
                        ))}
                        {moreBanksCard}
                    </LoadingContent>
                </GroupedListSection>
                {children}
            </>
        );
    }

    if (AsyncResult.isFailure(result)) {
        return (
            <>
                {children}
                <GroupedListSection title={t`European banks`}>
                    <GroupedListRow
                        left={
                            <CircleIcon
                                icon={UserIconNameEnum.RotateCw}
                                size={36}
                                iconSize={20}
                                radius={10}
                                border={false}
                                className="bg-[#8E8E93]/15 dark:bg-[#8E8E93]/25"
                                iconClassName="text-[#636366] dark:text-[#AEAEB2]"
                            />
                        }
                        title={t`Couldn’t load this list`}
                        subtitle={t`Try again`}
                        onPress={retry}
                    />
                    {moreBanksCard}
                </GroupedListSection>
            </>
        );
    }

    return (
        <>
            {hasOptionMatches ? null : <CreateSearchNoMatch query={query} />}
            {children}
            <GroupedListSection footer={t`No bank matches this name. Open the full list to browse by country.`}>
                {moreBanksCard}
            </GroupedListSection>
        </>
    );
};
