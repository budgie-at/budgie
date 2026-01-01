import { useLingui } from '@lingui/react/macro';
import { Controller } from 'react-hook-form';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { Footer } from '../../../@generic/component/footer/footer';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { Input } from '../../../@generic/component/input/input';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useBudgetForm } from '../../hook/use-budget-form.hook';
import { BudgetPeriodSelector } from '../budget-period-selector/budget-period-selector';

export const CreateBudget = () => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();

    const { control, handleSubmit, instrument } = useBudgetForm({
        instrumentId: defaultInstrument.id
    });

    const handleGoBack = () => void goBackOrReplace('/');

    if (!isDefined(instrument)) {
        return <EmptyScreen />;
    }

    return (
        <Page
            header={<PageHeader title={t`New Budget`} description={t`Set up your spending plan`} onGoBack={handleGoBack} />}
            footer={
                <KeyboardStickyView>
                    <Footer>
                        <Button variant="primary" onPress={() => void handleSubmit()} content={t`Create Budget`} />
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
                    <Controller
                        name="title"
                        control={control}
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                            <FormItem label={t`Budget Name`} error={error?.message}>
                                <Input
                                    placeholder={t`e.g., Monthly Budget`}
                                    value={value}
                                    onChangeText={onChange}
                                    autoCapitalize="sentences"
                                />
                            </FormItem>
                        )}
                    />

                    <Controller
                        name="period"
                        control={control}
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                            <FormItem label={t`Budget Period`} error={error?.message}>
                                <BudgetPeriodSelector value={value} onSelect={onChange} />
                            </FormItem>
                        )}
                    />

                    <Controller
                        name="startDay"
                        control={control}
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                            <FormItem label={t`Start Day of Month`} error={error?.message}>
                                <Input
                                    placeholder="1"
                                    value={String(value)}
                                    onChangeText={text => onChange(Number(text) || 1)}
                                    keyboardType="number-pad"
                                />
                            </FormItem>
                        )}
                    />

                    <CreateAccountCurrencyField control={control} />
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </Page>
    );
};
