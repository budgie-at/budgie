import { BudgetAllocationTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';

import { Button } from '../../../@generic/component/button/button';
import { Footer } from '../../../@generic/component/footer/footer';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useAllocationForm } from '../../hook/use-allocation-form.hook';
import { AllocationAmountField } from '../allocation-amount-field/allocation-amount-field';
import { AllocationCategoryField } from '../allocation-category-field/allocation-category-field';
import { AllocationPercentageField } from '../allocation-percentage-field/allocation-percentage-field';
import { AllocationRolloverRuleField } from '../allocation-rollover-rule-field/allocation-rollover-rule-field';
import { AllocationTypeToggle } from '../allocation-type-toggle/allocation-type-toggle';

interface Props {
    readonly budgetId: number;
    readonly currencySymbol: string;
}

export const CreateAllocation = ({ budgetId, currencySymbol }: Props) => {
    const { t } = useLingui();
    const { control, handleSubmit, setValue } = useAllocationForm(budgetId);

    const handleGoBack = () => void goBackOrReplace(`/budget/${budgetId}`);
    const onSubmit = () => void handleSubmit();

    const [isFixed, setIsFixed] = useState(true);

    const handleSetFixed = () => {
        setIsFixed(true);
        setValue('allocationType', BudgetAllocationTypeEnum.FIXED);
        setValue('percentage', 0);
    };

    const handleSetPercentage = () => {
        setIsFixed(false);
        setValue('allocationType', BudgetAllocationTypeEnum.PERCENTAGE);
        setValue('amount', 0);
    };

    return (
        <Page
            header={<PageHeader title={t`Add Category`} description={t`Set allocation for this category`} onGoBack={handleGoBack} />}
            footer={
                <KeyboardStickyView>
                    <Footer>
                        <Button variant="primary" onPress={onSubmit} content={t`Add Allocation`} />
                    </Footer>
                </KeyboardStickyView>
            }
        >
            <KeyboardAwareScrollView
                contentContainerClassName="pb-5xl"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <FormLayoutGroup>
                    <AllocationTypeToggle isFixed={isFixed} onSelectFixed={handleSetFixed} onSelectPercentage={handleSetPercentage} />

                    {isFixed ? (
                        <AllocationAmountField currencySymbol={currencySymbol} control={control} />
                    ) : (
                        <AllocationPercentageField control={control} />
                    )}

                    <AllocationCategoryField control={control} />

                    <AllocationRolloverRuleField control={control} />
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </Page>
    );
};
