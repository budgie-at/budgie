import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
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

    const cashLabel = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatCashDigits(value?.cash ?? 0, defaultInstrument.symbol);
    const fundsLabel = t({ message: plural(value?.fundCount ?? 0, { one: '# fund', other: '# funds' }) });
    const staleLabel = isDefined(reminder)
        ? t({ message: plural(reminder.daysOld, { one: 'Statement # day old', other: 'Statement # days old' }) })
        : null;

    return (
        <View className="gap-y-xxs" testID={InzhurSelector.InstitutionDetail}>
            <Text
                className="text-[13px] text-secondary-foreground tabular-nums"
                maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                numberOfLines={2}
            >
                {t`${cashLabel} cash · ${fundsLabel}`}
            </Text>
            {isDefined(staleLabel) ? (
                <View className="flex-row items-center gap-x-xs">
                    <Icon icon={UserIconNameEnum.Clock} size={13} className="text-warning-strong" />
                    <Text
                        className="shrink text-[13px] text-warning-strong"
                        maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                        numberOfLines={2}
                    >
                        {staleLabel}
                    </Text>
                </View>
            ) : null}
        </View>
    );
};
