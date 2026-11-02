import { isThisYear } from 'date-fns/isThisYear';

import { isDefined } from '@rnw-community/shared';

import { useI18nContext } from '../../i18n/context/i18n.context';

const SAME_YEAR_FORMAT = { month: 'short', day: 'numeric' } as const;
const OTHER_YEAR_FORMAT = { month: 'short', year: 'numeric' } as const;

export const useFormatArchivedDate = (archivedAt: Date | null) => {
    const { intl } = useI18nContext();

    if (!isDefined(archivedAt)) {
        return null;
    }

    return intl.formatDate(archivedAt, isThisYear(archivedAt) ? SAME_YEAR_FORMAT : OTHER_YEAR_FORMAT);
};
