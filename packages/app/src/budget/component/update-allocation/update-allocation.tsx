import { BudgetAllocationEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';

import { Button } from '../../../@generic/component/button/button';
import { Footer } from '../../../@generic/component/footer/footer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useEditAllocationForm } from '../../hook/use-edit-allocation-form.hook';
import { AllocationFormFields } from '../allocation-form-fields/allocation-form-fields';

interface Props {
    readonly allocation: BudgetAllocationEntityInterface;
    readonly currencySymbol: string;
}

export const UpdateAllocation = ({ allocation, currencySymbol }: Props) => {
    const { t } = useLingui();
    const { control, setValue, handleSubmit, handleDelete } = useEditAllocationForm(allocation);

    const handleGoBack = () => void goBackOrReplace(`/budget/${allocation.budgetId}`);

    return (
        <Page
            header={<PageHeader title={t`Edit Category`} description={t`Update allocation settings`} onGoBack={handleGoBack} />}
            footer={
                <KeyboardStickyView>
                    <Footer>
                        <View className="flex-row gap-3">
                            <Button variant="warning" onPress={handleDelete} content={t`Delete`} className="flex-1" />
                            <Button variant="primary" onPress={handleSubmit} content={t`Save`} className="flex-1" />
                        </View>
                    </Footer>
                </KeyboardStickyView>
            }
        >
            <KeyboardAwareScrollView
                contentContainerClassName="pb-5xl"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <AllocationFormFields
                    control={control}
                    setValue={setValue}
                    currencySymbol={currencySymbol}
                    defaultAllocationType={allocation.allocationType}
                />
            </KeyboardAwareScrollView>
        </Page>
    );
};
