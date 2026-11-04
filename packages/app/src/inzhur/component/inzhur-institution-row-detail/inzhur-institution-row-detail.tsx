import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { THOUSAND } from '../../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useInzhurStatementReminderQuery } from '../../query/use-inzhur-statement-reminder.query';
import { useInzhurValueQuery } from '../../query/use-inzhur-value.query';
import { InzhurSelector } from '../../selector/inzhur.selector';

export const InzhurInstitutionRowDetail = () => {
    const { t } = useLingui();
    const reminder = useInzhurStatementReminderQuery();
    const value = useInzhurValueQuery();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const isAmountProtected = useIsAmountProtected();
    const formatCashDigits = useFormatCompactDigits();
    const formatFundsDigits = useFormatCompactDigits(THOUSAND);

    const cashLabel = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatCashDigits(value?.cash ?? 0, defaultInstrument.symbol);
    const fundsLabel = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatFundsDigits(value?.funds ?? 0, defaultInstrument.symbol);
    const staleLabel = isDefined(reminder)
        ? t({ message: plural(reminder.daysOld, { one: 'Statement # day old', other: 'Statement # days old' }) })
        : null;
    const toneClassName = isDefined(staleLabel) ? 'text-warning-strong' : 'text-secondary-foreground';

    return (
        <Text
            className={cn('text-[13px] tabular-nums', toneClassName)}
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            numberOfLines={2}
            testID={InzhurSelector.InstitutionDetail}
        >
            {staleLabel ?? t`Cash ${cashLabel} · Funds ${fundsLabel}`}
        </Text>
    );
};
