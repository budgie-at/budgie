import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { millisecondsInDay } from 'date-fns/constants';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';

interface Props {
    readonly validUntil: Date | null;
    readonly nowMs: number;
    readonly isExpired: boolean;
    readonly isEnding: boolean;
}

export const EnableBankingConsentRow = ({ validUntil, nowMs, isExpired, isEnding }: Props) => {
    const { t } = useLingui();
    const { formatDayAndMonthAndYear } = useFormatDate();

    const daysLeft = isDefined(validUntil) ? Math.ceil((validUntil.getTime() - nowMs) / millisecondsInDay) : 0;
    const endingTitle = t({ message: plural(daysLeft, { one: 'Consent expires in # day', other: 'Consent expires in # days' }) });
    const activeTitle = isEnding ? endingTitle : t`Consent valid until`;
    const title = isExpired ? t`Consent expired` : activeTitle;
    const date = isDefined(validUntil) ? formatDayAndMonthAndYear(validUntil) : '';
    const subtitle = isExpired ? <Text className="text-destructive-strong text-[13px] leading-[18px]">{date}</Text> : date;

    return <SettingsRow icon={UserIconNameEnum.Calendar} variant="secondary" title={title} subtitle={subtitle} />;
};
