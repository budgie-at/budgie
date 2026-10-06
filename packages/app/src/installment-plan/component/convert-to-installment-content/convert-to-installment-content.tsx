import { InstallmentPlanService } from '@budgie/ledger';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { FormProvider, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { ConvertToInstallmentFormSchema } from '../../constant/convert-to-installment-form-schema.constant';
import { ConvertToInstallmentFee } from '../convert-to-installment-fee/convert-to-installment-fee';
import { ConvertToInstallmentSource } from '../convert-to-installment-source/convert-to-installment-source';
import { ConvertToInstallmentTitleField } from '../convert-to-installment-title-field/convert-to-installment-title-field';
import { ConvertToInstallmentTotal } from '../convert-to-installment-total/convert-to-installment-total';
import { InstallmentCountChips } from '../installment-count-chips/installment-count-chips';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { ConvertToInstallmentModalParamsInterface } from '../../interface/convert-to-installment-modal-params.interface';

interface Props {
    readonly params: ConvertToInstallmentModalParamsInterface;
    readonly onResolve: (accountId: number) => void;
}

const DEFAULT_INSTALLMENT_COUNT = 3;
const FIRST_PART_TITLE_PREFIX = /^Платіж\s+/u;

export const ConvertToInstallmentContent = ({ params, onResolve }: Props) => {
    const { t } = useLingui();
    const strippedTitle = params.title.replace(FIRST_PART_TITLE_PREFIX, '').trim();
    const form = useForm<ConvertToInstallmentFormValues>({
        mode: 'onChange',
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(ConvertToInstallmentFormSchema)),
        defaultValues: {
            installmentCount: DEFAULT_INSTALLMENT_COUNT,
            totalAmount: convertFromMicroUnits(params.amount * DEFAULT_INSTALLMENT_COUNT),
            feePercent: 0,
            title: isNotEmptyString(strippedTitle) ? strippedTitle : t`Installment plan`
        }
    });

    const handleCreate = () =>
        void form.handleSubmit(values =>
            appRuntime
                .runPromise(
                    Effect.flatMap(InstallmentPlanService, installmentPlanService =>
                        installmentPlanService.convertExpense({
                            transactionId: params.transactionId,
                            installmentCount: values.installmentCount,
                            totalAmount: convertToMicroUnits(values.totalAmount),
                            title: values.title
                        })
                    )
                )
                .then(
                    ({ accountId }) => void onResolve(accountId),
                    () => void Toast.show({ type: 'error', text1: t`Could not create plan`, text2: t`Please try again` })
                )
        )();

    return (
        <FormProvider {...form}>
            <KeyboardAwareScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" bottomOffset={16}>
                <View className="px-xl pb-xl gap-y-2xl">
                    <FormsheetHeader size="md" title={t`Pay in parts`} className="pb-0" />
                    <ConvertToInstallmentSource params={params} />
                    <ConvertToInstallmentTotal params={params} />
                    <InstallmentCountChips amount={params.amount} />
                    <ConvertToInstallmentFee instrumentSymbol={params.instrumentSymbol} />
                    <ConvertToInstallmentTitleField />
                    <Button
                        content={t`Create plan`}
                        size="md"
                        isLoading={form.formState.isSubmitting}
                        disabled={!form.formState.isValid}
                        onPress={handleCreate}
                        testID={ConvertToInstallmentModalSelector.CreateButton}
                    />
                </View>
            </KeyboardAwareScrollView>
        </FormProvider>
    );
};
