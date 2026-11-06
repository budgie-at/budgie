import { InstrumentTypeEnum } from '@budgie/contracts';
import { INZHUR_CANONICAL_FUNDS } from '@budgie/sync';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { homeAccountRowsAtom } from '../../account/query/use-home-page-data.query';
import { defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';
import { useInzhurRecentPurchaseTitlesQuery } from '../query/use-inzhur-recent-purchase-titles.query';
import { useInzhurSetupQuery } from '../query/use-inzhur-setup.query';

import type { InzhurFundOptionInterface } from '../interface/inzhur-fund-option.interface';

export const useInzhurFundOptions = (): { readonly fundOptions: readonly InzhurFundOptionInterface[]; readonly isLoading: boolean } => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const { setup, isLoading: isSetupLoading } = useInzhurSetupQuery();
    const { titles: recentTitles, isLoading: isRecentLoading } = useInzhurRecentPurchaseTitlesQuery();
    const rowsResult = useLiveAtomValue(homeAccountRowsAtom(defaultInstrumentId));
    const rows = AsyncResult.getOrElse(rowsResult, () => []);

    const fundRows = rows.filter(
        row =>
            row.account.integrationId === setup?.integration.id &&
            row.instrument.type === InstrumentTypeEnum.FUND &&
            !INZHUR_CANONICAL_FUNDS.some(fund => fund.isClosed && fund.name === row.instrument.name)
    );
    const recentRank = (title: string) => {
        const index = recentTitles.indexOf(title);

        return index === -1 ? recentTitles.length : index;
    };
    const options = [
        ...fundRows.map(row => ({
            name: row.instrument.name,
            title: row.account.title,
            icon: row.account.icon,
            balance: row.convertedBalance
        })),
        ...INZHUR_CANONICAL_FUNDS.filter(fund => !fund.isClosed && !fundRows.some(row => row.instrument.name === fund.name)).map(fund => ({
            name: fund.name,
            title: fund.name,
            icon: fund.icon,
            balance: 0
        }))
    ];

    return {
        isLoading: isSetupLoading || isRecentLoading || AsyncResult.isInitial(rowsResult),
        fundOptions: [...new Map(options.map(option => [option.name, option])).values()].sort(
            (first, second) => recentRank(first.title) - recentRank(second.title) || second.balance - first.balance
        )
    };
};
