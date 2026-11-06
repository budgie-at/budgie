import { InstrumentTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { homeAccountRowsAtom } from '../../account/query/use-home-page-data.query';
import { defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';

import { useInzhurSetupQuery } from './use-inzhur-setup.query';

import type { InzhurValueInterface } from '../interface/inzhur-value.interface';

export const useInzhurValueQuery = (): InzhurValueInterface | null => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const { setup } = useInzhurSetupQuery();
    const rows = AsyncResult.getOrElse(useLiveAtomValue(homeAccountRowsAtom(defaultInstrumentId)), () => []);

    if (!isDefined(setup)) {
        return null;
    }

    const integrationId = setup.integration.id;
    const inzhurRows = rows.filter(row => row.account.integrationId === integrationId && row.account.isActive);
    const cash = inzhurRows
        .filter(row => row.instrument.type !== InstrumentTypeEnum.FUND)
        .reduce((total, row) => total + convertFromMicroUnits(row.convertedBalance), 0);

    const fundCount = inzhurRows.filter(row => row.instrument.type === InstrumentTypeEnum.FUND && row.balance !== 0).length;

    return { cash, fundCount };
};
