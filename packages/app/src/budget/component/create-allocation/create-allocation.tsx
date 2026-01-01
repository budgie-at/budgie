import { useLingui } from '@lingui/react/macro';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';

import { Button } from '../../../@generic/component/button/button';
import { Footer } from '../../../@generic/component/footer/footer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useAllocationForm } from '../../hook/use-allocation-form.hook';
import { AllocationFormFields } from '../allocation-form-fields/allocation-form-fields';

interface Props {
    readonly budgetId: number;
    readonly currencySymbol: string;
}

export const CreateAllocation = ({ budgetId, currencySymbol }: Props) => {
    const { t } = useLingui();
    const { control, handleSubmit, setValue } = useAllocationForm(budgetId);

    const handleGoBack = () => void goBackOrReplace(`/budget/${budgetId}`);
    const onSubmit = () => void handleSubmit();

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
                <AllocationFormFields
                    control={control}
                    setValue={setValue}
                    currencySymbol={currencySymbol}
                />
            </KeyboardAwareScrollView>
        </Page>
    );
};
