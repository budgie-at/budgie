import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { enableBankingPublicBanksAtom } from '../../sync/constant/enable-banking-public-banks-atom.constant';
import { getEnableBankingBankSearchText } from '../../sync/utils/get-enable-banking-bank-search-text.util';
import { sortEnableBankingBanks } from '../../sync/utils/sort-enable-banking-banks.util';

import type { EnableBankingBankInterface } from '@budgie/sync';

const NO_BANKS: readonly EnableBankingBankInterface[] = [];
const MAX_RESULTS = 5;

export const useCreateBankSearch = (query: string) => {
    const { t } = useLingui();
    const result = useAtomValue(enableBankingPublicBanksAtom);
    const retry = useAtomRefresh(enableBankingPublicBanksAtom);
    const [trailingQuery, setTrailingQuery] = useState<string | null>(null);
    const isLoading = AsyncResult.isInitial(result) || (result.waiting && !AsyncResult.isSuccess(result));

    if (isLoading && trailingQuery !== query) {
        setTrailingQuery(query);
    }

    if (!isLoading && isDefined(trailingQuery) && trailingQuery !== query) {
        setTrailingQuery(null);
    }

    const banks = sortEnableBankingBanks(
        AsyncResult.getOrElse(result, () => NO_BANKS).filter(
            bank => bank.isSupported && getEnableBankingBankSearchText(bank, t).includes(query)
        )
    ).slice(0, MAX_RESULTS);

    return { banks, isLoading, isFailure: AsyncResult.isFailure(result) && !isLoading, isTrailing: trailingQuery === query, retry };
};
