import { InstallmentPlanService } from '@budgie/ledger';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { ConvertToInstallmentFormSchema } from '../../constant/convert-to-installment-form-schema.constant';
import { ConvertToInstallmentFee } from '../convert-to-installment-fee/convert-to-installment-fee';
import { ConvertToInstallmentParts } from '../convert-to-installment-parts/convert-to-installment-parts';
import { ConvertToInstallmentSource } from '../convert-to-installment-source/convert-to-installment-source';
import { ConvertToInstallmentTitleField } from '../convert-to-installment-title-field/convert-to-installment-title-field';
import { ConvertToInstallmentTotal } from '../convert-to-installment-total/convert-to-installment-total';
import { InstallmentCountChips } from '../installment-count-chips/installment-count-chips';
import { InstallmentTimeline } from '../installment-timeline/installment-timeline';

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

    const installmentCount = useWatch({ control: form.control, name: 'installmentCount' });

    const handleSelectCount = (count: number) => {
        form.setValue('installmentCount', count, { shouldValidate: true });
        form.setValue('totalAmount', convertFromMicroUnits(params.amount * count), { shouldValidate: true });
    };

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
            <KeyboardAvoidingView behavior="padding">
                <View className="gap-y-3xl px-xl pt-3xl">
                    <View className="gap-y-xxs">
                        <Text className="text-sm font-medium text-secondary-foreground" accessibilityRole="header">
                            <Trans>Pay in parts</Trans>
                        </Text>
                        <ConvertToInstallmentTitleField />
                        <ConvertToInstallmentSource params={params} />
                    </View>

                    <View className="items-center gap-y-xs">
                        <ConvertToInstallmentTotal params={params} />
                        <ConvertToInstallmentParts params={params} />
                    </View>

                    <View className="gap-y-xl">
                        <InstallmentCountChips selectedCount={installmentCount} onSelect={handleSelectCount} />
                        <InstallmentTimeline operatedAt={params.operatedAt} />
                    </View>

                    <ConvertToInstallmentFee instrumentSymbol={params.instrumentSymbol} />
                </View>

                <View className="px-xl pt-2xl pb-xl">
                    <Button
                        content={t`Create plan`}
                        size="md"
                        isLoading={form.formState.isSubmitting}
                        disabled={!form.formState.isValid}
                        onPress={handleCreate}
                        testID={ConvertToInstallmentModalSelector.CreateButton}
                    />
                </View>
            </KeyboardAvoidingView>
        </FormProvider>
    );
};
