import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { BottomChromeInsetProvider, ScreenChromeFooter, ScreenChromeScrollView } from '@rnw-community/react-native-screen-chrome';
import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { TransactionFormScreen } from '../../../transaction/components/transaction-form-screen/transaction-form-screen';
import { RecurringSeriesFormSchema } from '../../constant/recurring-series-form-schema.constant';
import { RecurringFormModeEnum } from '../../enum/recurring-form-mode.enum';
import { submitRecurringSeries } from '../../utils/submit-recurring-series.util';
import { MakeRecurringSourceRow } from '../make-recurring-source-row/make-recurring-source-row';
import { RecurringFormAccountField } from '../recurring-form-account-field/recurring-form-account-field';
import { RecurringFormAmountField } from '../recurring-form-amount-field/recurring-form-amount-field';
import { RecurringFormCategoryField } from '../recurring-form-category-field/recurring-form-category-field';
import { RecurringFormCurrencyField } from '../recurring-form-currency-field/recurring-form-currency-field';
import { RecurringFormEndSection } from '../recurring-form-end-section/recurring-form-end-section';
import { RecurringFormKindField } from '../recurring-form-kind-field/recurring-form-kind-field';
import { RecurringFormReminderSection } from '../recurring-form-reminder-section/recurring-form-reminder-section';
import { RecurringFormRepeatSection } from '../recurring-form-repeat-section/recurring-form-repeat-section';
import { RecurringFormTitleField } from '../recurring-form-title-field/recurring-form-title-field';

import { RecurringSeriesFormSelector } from './recurring-series-form.selector';

import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';
import type { RecurringSeriesFormTargetType } from '../../type/recurring-series-form-target.type';

interface Props {
    readonly target: RecurringSeriesFormTargetType;
    readonly initialValues: RecurringSeriesFormValues;
}

const FOOTER_STYLE = { position: 'relative' } as const;
const CONTENT_STYLE = { paddingBottom: 32 };

export const RecurringSeriesFormScreen = ({ target, initialValues }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const saveFlight = useSingleFlight();
    const [defaultValues] = useState(initialValues);
    const form = useForm<RecurringSeriesFormValues>({
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(RecurringSeriesFormSchema)),
        defaultValues,
        mode: 'onSubmit'
    });
    const isEditing = target.mode === RecurringFormModeEnum.EDIT;
    const title = isEditing ? t`Edit recurring payment` : t`New recurring payment`;
    const kindField = isEditing ? null : <RecurringFormKindField />;
    const sourceTransactionId = target.mode === RecurringFormModeEnum.CREATE ? target.transactionId : null;
    const sourceSection = isDefined(sourceTransactionId) ? (
        <View className="gap-y-sm">
            <Text className="px-3xl text-[13px] font-medium text-secondary-foreground">
                <Trans>From transaction</Trans>
            </Text>
            <MakeRecurringSourceRow transactionId={sourceTransactionId} />
        </View>
    ) : null;
    const [amount, seriesTitle] = useWatch({ control: form.control, name: ['amount', 'title'] });
    const isSaveDisabled = !isPositiveNumber(amount) || !isNotEmptyString(seriesTitle.trim());
    const saveHint = isSaveDisabled ? (
        <Text className="pb-md text-center text-[13px] text-secondary-foreground">
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

    const handleSave = form.handleSubmit(values =>
        saveFlight.run(
            submitRecurringSeries(target, values, defaultValues).pipe(
                Effect.tap(seriesId => Effect.sync(() => void handleSaved(seriesId))),
                toastOnFailure(t`Could not save recurring payment.`)
            )
        )
    );

    return (
        <TransactionFormScreen title={title} onGoBack={handleGoBack}>
            <FormProvider {...form}>
                <BottomChromeInsetProvider>
                    <View className="flex-1" testID={RecurringSeriesFormSelector.Page}>
                        <ScreenChromeScrollView
                            includeTopSafeArea={false}
                            contentContainerStyle={CONTENT_STYLE}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                            automaticallyAdjustKeyboardInsets
                            showsVerticalScrollIndicator={false}
                        >
                            <View className="gap-y-5xl pt-md">
                                {sourceSection}
                                {kindField}
                                <RecurringFormAmountField label={t`Amount`} />
                                <RecurringFormTitleField />

                                <RecurringFormRepeatSection />
                                <GroupedListSection title={t`Details`}>
                                    <RecurringFormCurrencyField />
                                    <RecurringFormCategoryField />
                                    <RecurringFormAccountField />
                                </GroupedListSection>
                                <RecurringFormEndSection />
                                <RecurringFormReminderSection />
                            </View>
                        </ScreenChromeScrollView>
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
