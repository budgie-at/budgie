import { getInclusiveEnd } from '@budgie/budget';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { resolveBudgetWindow } from '../../utils/resolve-budget-window.util';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget?: BudgetEntityInterface;
}

export const BudgetSafeToSpendHeader = ({ budget }: Props) => {
    const { t } = useLingui();
    const today = useToday();
    const { formatMonthAndDay } = useFormatDate();
    const periodEnd = isDefined(budget) ? getInclusiveEnd(resolveBudgetWindow(budget, today).nextPeriodStart) : today;
    const periodEndLabel = formatMonthAndDay(periodEnd);

    return (
        <FormsheetHeader
            size="md"
            title={t`Safe to spend`}
            description={
                <LoadingContent isLoading={!isDefined(budget)} loadingIndicator={null}>
                    <Text
                        maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
                        className="text-center text-secondary-foreground text-sm leading-[20px]"
                    >
                        <Trans>Until {periodEndLabel}</Trans>
                    </Text>
                </LoadingContent>
            }
        />
    );
};
