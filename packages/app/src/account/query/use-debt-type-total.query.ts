import { AccountDebtTypeEnum } from '@budgie/contracts';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useTrackedLiveQuery } from '../../@generic/hook/use-tracked-live-query.hook';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useSettingsContext } from '../../settings/context/settings.context';
import { ACCOUNT_BALANCE_AGGREGATE_LIVE_QUERY_TABLE_NAMES } from '../constant/account-balance-live-query-table-names.constant';

export const useDebtTypeTotalQuery = (debtType: AccountDebtTypeEnum) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useTrackedLiveQuery(
        accountBalanceRepository.getTotalRemainingDebtByType(defaultInstrument.id, debtType),
        [defaultInstrument.id, debtType],
        ACCOUNT_BALANCE_AGGREGATE_LIVE_QUERY_TABLE_NAMES
    );

    return convertFromMicroUnits(data.at(0)?.total ?? 0);
};
