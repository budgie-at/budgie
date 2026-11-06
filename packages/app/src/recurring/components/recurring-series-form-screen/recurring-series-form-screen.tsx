import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { BottomChromeInsetProvider, ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';
import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { TransactionFormScreen } from '../../../transaction/components/transaction-form-screen/transaction-form-screen';
import { makeRecurringSeriesFormSchema } from '../../constant/recurring-series-form-schema.constant';
import { RecurringFormModeEnum } from '../../enum/recurring-form-mode.enum';
import { submitRecurringSeries } from '../../utils/submit-recurring-series.util';
import { RecurringSeriesFormFields } from '../recurring-series-form-fields/recurring-series-form-fields';

import { RecurringSeriesFormSelector } from './recurring-series-form.selector';

import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';
import type { RecurringSeriesFormTargetType } from '../../type/recurring-series-form-target.type';

interface Props {
    readonly target: RecurringSeriesFormTargetType;
    readonly initialValues: RecurringSeriesFormValues;
}

const FOOTER_STYLE = { position: 'relative' } as const;

export const RecurringSeriesFormScreen = ({ target, initialValues }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const saveFlight = useSingleFlight();
    const [defaultValues] = useState(initialValues);
    const isEditing = target.mode === RecurringFormModeEnum.EDIT;
    const form = useForm<RecurringSeriesFormValues>({
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(makeRecurringSeriesFormSchema(isEditing ? target.anchorDate : null))),
        defaultValues,
        mode: 'onSubmit'
    });
    const createTitle =
        target.mode === RecurringFormModeEnum.CREATE && isDefined(target.transactionId) ? t`Make recurring` : t`New recurring payment`;
    const title = isEditing ? t`Edit recurring payment` : createTitle;
    const [amount, seriesTitle] = useWatch({ control: form.control, name: ['amount', 'title'] });
    const isSaveDisabled = !isPositiveNumber(amount) || !isNotEmptyString(seriesTitle.trim());
    const saveHint = isSaveDisabled ? (
        <Text className="pb-md text-center text-[13px] text-primary/65">
            <Trans>Add an amount and a name to save</Trans>
        </Text>
    ) : null;

    const handleGoBack = () => void router.back();

    const handleSaved = (seriesId: number) => {
        if (isEditing) {
            router.back();
        } else {
            router.replace({ pathname: '/recurring/[id]', params: { id: String(seriesId) } });
        }
    };

    const handleSave = form.handleSubmit(
        values =>
            saveFlight.run(
                submitRecurringSeries(target, values, defaultValues).pipe(
                    Effect.tap(seriesId => Effect.sync(() => void handleSaved(seriesId))),
                    toastOnFailure(t`Could not save recurring payment.`)
                )
            ),
        () => void showErrorToast(t`Could not save recurring payment.`, t`Check the repeat and end settings.`)
    );

    return (
        <TransactionFormScreen title={title} onGoBack={handleGoBack}>
            <FormProvider {...form}>
                <BottomChromeInsetProvider>
                    <View className="flex-1" testID={RecurringSeriesFormSelector.Page}>
                        <RecurringSeriesFormFields target={target} />
                        <View className="pt-lg pb-md">
                            <ScreenChromeFooter includeBottomSafeArea={false} style={FOOTER_STYLE}>
                                {saveHint}
                                <PillButton
                                    label={t`Save`}
                                    onPress={handleSave}
                                    isLoading={saveFlight.isLoading}
                                    isDisabled={isSaveDisabled}
                                    testID={RecurringSeriesFormSelector.Save}
                                />
                            </ScreenChromeFooter>
                        </View>
                    </View>
                </BottomChromeInsetProvider>
            </FormProvider>
        </TransactionFormScreen>
    );
};
