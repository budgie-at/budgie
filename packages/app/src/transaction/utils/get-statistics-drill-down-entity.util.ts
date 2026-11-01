import { isDefined } from '@rnw-community/shared';

import { CategorizeInboxKindEnum } from '../../categorize-inbox/enum/categorize-inbox-kind.enum';
import { UNTAGGED_TAG_ID_PARAM } from '../constant/untagged-tag-id-param.constant';

import type { AnalyticsTransactionsRouteParamsInterface } from '../interface/analytics-transactions-route-params.interface';
import type { StatisticsDrillDownEntityInterface } from '../interface/statistics-drill-down-entity.interface';

export const getStatisticsDrillDownEntity = (
    params: Pick<AnalyticsTransactionsRouteParamsInterface, 'categoryId' | 'tagId'>
): StatisticsDrillDownEntityInterface | null => {
    if (isDefined(params.categoryId)) {
        return { kind: CategorizeInboxKindEnum.CATEGORY, entityId: Number(params.categoryId) };
    }

    if (isDefined(params.tagId) && params.tagId !== UNTAGGED_TAG_ID_PARAM) {
        return { kind: CategorizeInboxKindEnum.TAG, entityId: Number(params.tagId) };
    }

    return null;
};
