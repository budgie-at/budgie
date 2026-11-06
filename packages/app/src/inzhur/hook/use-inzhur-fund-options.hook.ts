import { InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { INZHUR_CANONICAL_FUNDS } from '@budgie/sync';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { homeAccountRowsAtom } from '../../account/query/use-home-page-data.query';
import { defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';
import { useInzhurSetupQuery } from '../query/use-inzhur-setup.query';

import type { InzhurFundOptionInterface } from '../interface/inzhur-fund-option.interface';

export const useInzhurFundOptions = (): readonly InzhurFundOptionInterface[] => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const { setup } = useInzhurSetupQuery();
    const rows = AsyncResult.getOrElse(useLiveAtomValue(homeAccountRowsAtom(defaultInstrumentId)), () => []);

    const fundRows = rows.filter(
        row => row.account.integrationId === setup?.integration.id && row.instrument.type === InstrumentTypeEnum.FUND
    );
    const heldTitles = fundRows
        .filter(row => row.balance !== 0)
        .sort((first, second) => second.convertedBalance - first.convertedBalance)
        .map(row => row.account.title);
    const allTitles = [...new Set([...INZHUR_CANONICAL_FUNDS.map(fund => fund.name), ...fundRows.map(row => row.account.title)])];
    const titles = isNotEmptyArray(heldTitles) ? heldTitles : allTitles;

    return titles.map(name => ({
        name,
        icon: INZHUR_CANONICAL_FUNDS.find(fund => fund.name === name)?.icon ?? UserIconNameEnum.ChartLine
    }));
};
