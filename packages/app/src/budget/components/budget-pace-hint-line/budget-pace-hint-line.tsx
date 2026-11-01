import { convertFromMicroUnits } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { BudgetSelector } from '../../budget.selector';
import { BudgetHeldBackNote } from '../budget-held-back-note/budget-held-back-note';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';
import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly onPress: () => void;
}

export const BudgetPaceHintLine = ({ icon, title, scope, currencySymbol, onPress }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const perDayAmount = formatProtectedAmount(convertFromMicroUnits(scope.safePerDay), currencySymbol);

    return (
        <GroupedListSection>
            <GroupedListRow
                left={<GroupedListIcon icon={icon} />}
                title={t`${title} is running fast`}
                testID={BudgetSelector.DetailsPaceBanner}
                onPress={onPress}
                subtitle={
                    <View>
                        <Text className="text-secondary-foreground text-[13px] leading-[18px]">
                            <Trans>
                                Keep it under <Text className="font-semibold text-warning-strong">{perDayAmount}/day</Text>
                            </Trans>
                        </Text>
                        <BudgetHeldBackNote scope={scope} currencySymbol={currencySymbol} />
                    </View>
                }
            />
        </GroupedListSection>
    );
};
