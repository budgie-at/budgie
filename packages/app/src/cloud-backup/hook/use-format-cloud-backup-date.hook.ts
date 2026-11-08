import { isThisYear } from 'date-fns';

import { useI18nContext } from '../../i18n/context/i18n.context';

export const useFormatCloudBackupDate = () => {
    const { intl } = useI18nContext();

    return (date: Date): string =>
        intl.formatDate(date, {
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
            ...(!isThisYear(date) && { year: 'numeric' })
        });
};
