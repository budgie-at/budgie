import { AccountTypeEnum, InstrumentTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { YIELD_GROUP_BY_KIND } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { YIELD_GROUP_LABEL } from '../constant/yield-group-label.constant';
import { YIELD_KIND_LABEL } from '../constant/yield-kind-label.constant';

import type { YieldPositionSummaryInterface } from '@budgie/market';

export const useYieldPositionKindLabel = ({
    kind,
    accountType,
    instrumentType
}: Pick<YieldPositionSummaryInterface, 'kind' | 'accountType' | 'instrumentType'>): string => {
    const { t } = useLingui();

    const group = isDefined(kind) ? YIELD_GROUP_BY_KIND[kind] : null;
    const isRated = accountType === AccountTypeEnum.DEPOSIT || accountType === AccountTypeEnum.SAVINGS;

    if (isDefined(kind) && (kind === YieldKindEnum.STAKING || kind === YieldKindEnum.EARN)) {
        return t(YIELD_KIND_LABEL[kind]);
    }

    if (isDefined(group)) {
        return t(YIELD_GROUP_LABEL[group]);
    }

    if (instrumentType === InstrumentTypeEnum.CRYPTO) {
        return t`Staking`;
    }

    if (isRated) {
        return t`Interest`;
    }

    return instrumentType === InstrumentTypeEnum.FUND ? t`Distributions` : t`Dividends`;
};
