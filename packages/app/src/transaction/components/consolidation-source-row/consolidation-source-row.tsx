import { TransactionEntryTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ConsolidationSourceModalSelector } from '../consolidation-source-modal-content/consolidation-source-modal-content.selector';
import { ConvertedAmountLabel } from '../converted-amount-label/converted-amount-label';
import { TransactionAccountLine } from '../transaction-account-line/transaction-account-line';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { ConsolidationSourceAccountSummaryInterface } from '../../interface/consolidation-source-account-summary.interface';
import type { ConsolidationSourceRowPropsInterface } from '../../interface/consolidation-source-row-props.interface';
import type { ConsolidationSourceRowInterface } from '@budgie/contracts';

const ANIMATION_STAGGER_MS = 60;
const ANIMATION_STAGGER_MAX_INDEX = 4;
const ANIMATION_DURATION_MS = 280;
const tabularNums = { fontVariant: ['tabular-nums' as const] };

const getSourceTitle = (source: ConsolidationSourceRowInterface): string => {
    if (isNotEmptyString(source.sourceTitle)) {
        return source.sourceTitle;
    }

    if (isNotEmptyString(source.sourceComment)) {
        return source.sourceComment;
    }

    return t`Original transaction`;
};

const buildAccountSummary = (source: ConsolidationSourceRowInterface, isDebit: boolean): ConsolidationSourceAccountSummaryInterface => {
    const fromFallbackIcon = isDebit ? source.accountIcon : source.canonicalFromAccountIcon;
    const fromFallbackTitle = isDebit ? source.accountTitle : source.canonicalFromAccountTitle;
    const toFallbackIcon = isDebit ? source.canonicalToAccountIcon : source.accountIcon;
    const toFallbackTitle = isDebit ? source.canonicalToAccountTitle : source.accountTitle;

    const fromIcon = isDefined(source.sourceFromAccountIcon) ? source.sourceFromAccountIcon : fromFallbackIcon;
    const fromTitle = isNotEmptyString(source.sourceFromAccountTitle) ? source.sourceFromAccountTitle : fromFallbackTitle;
    const toIcon = isDefined(source.sourceToAccountIcon) ? source.sourceToAccountIcon : toFallbackIcon;
    const toTitle = isNotEmptyString(source.sourceToAccountTitle) ? source.sourceToAccountTitle : toFallbackTitle;

    return { fromIcon, fromTitle, toIcon, toTitle };
};

// eslint-disable-next-line max-statements -- Row orchestrates source presentation with multiple derived values
export const ConsolidationSourceRow = ({ source, index, testID }: ConsolidationSourceRowPropsInterface) => {
    const { decimalPlaces } = useSettingsContext();
    const { formatMonthAndDayWithTime } = useFormatDate();
    const formatDigits = useFormatDigits(decimalPlaces);

    const isDebit = source.entryType === TransactionEntryTypeEnum.DEBIT;
    const variant: ColorPaletteVariant = isDebit ? 'destructive' : 'positive';
    const amountClassName = isDebit ? 'text-destructive-foreground' : 'text-positive-foreground';

    const title = getSourceTitle(source);
    const hasOriginalComment = isNotEmptyString(source.sourceTitle) && isNotEmptyString(source.sourceComment);
    const comment = hasOriginalComment ? source.sourceComment : null;

    const date = formatMonthAndDayWithTime(new Date(source.sourceOperatedAtMs));
    const formattedAmount = formatDigits(convertFromMicroUnits(source.amount), source.currencySymbol);
    const signedAmount = isDebit ? `−${formattedAmount}` : `+${formattedAmount}`;

    const accounts = buildAccountSummary(source, isDebit);
    const fromAccount =
        isDefined(accounts.fromIcon) && isNotEmptyString(accounts.fromTitle)
            ? { icon: accounts.fromIcon, title: accounts.fromTitle }
            : null;
    const toAccount =
        isDefined(accounts.toIcon) && isNotEmptyString(accounts.toTitle) ? { icon: accounts.toIcon, title: accounts.toTitle } : null;
    const staggerIndex = Math.min(index, ANIMATION_STAGGER_MAX_INDEX);
    const titleTestID = ConsolidationSourceModalSelector.RowTitle(index, title);
    const amountTestID = ConsolidationSourceModalSelector.RowAmount(index, source.entryType, source.amount);

    return (
        <Animated.View
            entering={FadeIn.delay(staggerIndex * ANIMATION_STAGGER_MS).duration(ANIMATION_DURATION_MS)}
            layout={LinearTransition}
            testID={testID}
        >
            <View className="rounded-3xl bg-secondary-background px-3xl py-xl gap-y-md">
                <View className="flex-row items-start gap-x-xl">
                    <CircleIcon size={36} iconSize={18} icon={source.accountIcon} variant={variant} border={false} />

                    <View className="flex-1 gap-y-xs pt-xxs">
                        <Text className="text-primary text-sm font-semibold" numberOfLines={2} ellipsizeMode="tail" testID={titleTestID}>
                            {title}
                        </Text>
                        {isNotEmptyString(comment) ? (
                            <Text className="text-secondary-foreground text-xs" numberOfLines={2} ellipsizeMode="tail">
                                {comment}
                            </Text>
                        ) : null}
                    </View>

                    <View className="items-end gap-y-xxs pt-xxs">
                        <Text
                            className={`text-md font-semibold ${amountClassName}`}
                            style={tabularNums}
                            numberOfLines={1}
                            testID={amountTestID}
                        >
                            {signedAmount}
                        </Text>
                        <ConvertedAmountLabel instrumentId={source.instrumentId} amount={source.amount} />
                    </View>
                </View>

                <View className="gap-y-xs">
                    {isDefined(fromAccount) ? (
                        <TransactionAccountLine
                            direction="from"
                            icon={fromAccount.icon}
                            title={fromAccount.title}
                            testID={ConsolidationSourceModalSelector.RowFromAccount(index, fromAccount.title)}
                        />
                    ) : null}
                    <View className="flex-row items-center gap-x-lg">
                        {isDefined(toAccount) ? (
                            <View className="flex-1">
                                <TransactionAccountLine
                                    direction="to"
                                    icon={toAccount.icon}
                                    title={toAccount.title}
                                    testID={ConsolidationSourceModalSelector.RowToAccount(index, toAccount.title)}
                                />
                            </View>
                        ) : (
                            <View className="flex-1" />
                        )}
                        <Text className="text-xs text-secondary-foreground" style={tabularNums} numberOfLines={1}>
                            {date}
                        </Text>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};
