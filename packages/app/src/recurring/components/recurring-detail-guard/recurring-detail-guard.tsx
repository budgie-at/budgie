import { Redirect, useIsFocused, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { useRecurringSeriesDetail } from '../../hook/use-recurring-series-detail.hook';

import type { RecurringSeriesDetailInterface } from '@budgie/recurring';
import type { ReactNode } from 'react';

interface Props {
    readonly children: (detail: RecurringSeriesDetailInterface) => ReactNode;
}

export const RecurringDetailGuard = ({ children }: Props) => {
    const isFocused = useIsFocused();
    const { id } = useLocalSearchParams<IdParamInterface>();
    const { detail, isNotFound } = useRecurringSeriesDetail(Number(id));

    if (isNotFound) {
        return isFocused ? <Redirect href="/" /> : null;
    }

    return isDefined(detail) ? children(detail) : null;
};
