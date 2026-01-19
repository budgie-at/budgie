import { BudgetPeriodEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import { Text, View } from 'react-native';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetView } from '../../../@generic/component/bottom-sheet-view/bottom-sheet-view';
import { SelectorCard } from '../../../@generic/component/selector-card/selector-card';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';

const BUDGET_PERIOD_LABELS: Record<BudgetPeriodEnum, MessageDescriptor> = {
    [BudgetPeriodEnum.WEEKLY]: msg`Weekly`,
    [BudgetPeriodEnum.BI_WEEKLY]: msg`Bi-Weekly`,
    [BudgetPeriodEnum.MONTHLY]: msg`Monthly`
};

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly selectedPeriod: BudgetPeriodEnum;
    readonly onSelect: (period: BudgetPeriodEnum) => void;
}

export const BudgetPeriodSelectorBottomSheet = ({ ref, selectedPeriod, onSelect }: Props) => {
    const { i18n, t } = useLingui();

    const handleSelect = (period: BudgetPeriodEnum) => {
        onSelect(period);
        ref.current?.close();
    };

    return (
        <BottomSheet enableDynamicSizing ref={ref}>
            <BottomSheetView>
                <BottomSheetHeader size="md" title={t`Budget Period`} />
                <View className="px-5xl pb-5xl gap-y-lg">
                    <SelectorCard
                        identifier={BudgetPeriodEnum.WEEKLY}
                        isSelected={selectedPeriod === BudgetPeriodEnum.WEEKLY}
                        onSelect={handleSelect}
                        title={
                            <Text className="text-md font-medium text-primary">
                                {i18n.t(BUDGET_PERIOD_LABELS[BudgetPeriodEnum.WEEKLY])}
                            </Text>
                        }
                    />
                    <SelectorCard
                        identifier={BudgetPeriodEnum.BI_WEEKLY}
                        isSelected={selectedPeriod === BudgetPeriodEnum.BI_WEEKLY}
                        onSelect={handleSelect}
                        title={
                            <Text className="text-md font-medium text-primary">
                                {i18n.t(BUDGET_PERIOD_LABELS[BudgetPeriodEnum.BI_WEEKLY])}
                            </Text>
                        }
                    />
                    <SelectorCard
                        identifier={BudgetPeriodEnum.MONTHLY}
                        isSelected={selectedPeriod === BudgetPeriodEnum.MONTHLY}
                        onSelect={handleSelect}
                        title={
                            <Text className="text-md font-medium text-primary">
                                {i18n.t(BUDGET_PERIOD_LABELS[BudgetPeriodEnum.MONTHLY])}
                            </Text>
                        }
                    />
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};
