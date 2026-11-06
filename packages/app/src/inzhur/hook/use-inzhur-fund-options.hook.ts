import { InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { INZHUR_CANONICAL_FUNDS } from '@budgie/sync';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isNotEmptyArray } from '@rnw-community/shared';

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
        row => row.account.integrationId === setup?.integration.id && row.instrument.type === InstrumentTypeEnum.FUND
    );
    const heldTitles = fundRows
        .filter(row => row.balance !== 0)
        .sort((first, second) => second.convertedBalance - first.convertedBalance)
        .map(row => row.account.title);
    const allTitles = [...new Set([...INZHUR_CANONICAL_FUNDS.map(fund => fund.name), ...fundRows.map(row => row.account.title)])];
    const baseTitles = isNotEmptyArray(heldTitles) ? heldTitles : allTitles;
    const recentRank = (title: string) => {
        const index = recentTitles.indexOf(title);

        return index === -1 ? recentTitles.length : index;
    };
    const titles = [...baseTitles].sort((first, second) => recentRank(first) - recentRank(second));

    return {
        isLoading: isSetupLoading || isRecentLoading || AsyncResult.isInitial(rowsResult),
        fundOptions: titles.map(name => ({
            name,
            icon: INZHUR_CANONICAL_FUNDS.find(fund => fund.name === name)?.icon ?? UserIconNameEnum.ChartLine
        }))
    };
};
