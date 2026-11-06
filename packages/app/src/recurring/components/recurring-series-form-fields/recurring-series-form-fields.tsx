import { RecurringSeriesSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { ScreenChromeScrollView } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { RecurringFormModeEnum } from '../../enum/recurring-form-mode.enum';
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

import type { RecurringSeriesFormTargetType } from '../../type/recurring-series-form-target.type';

interface Props {
    readonly target: RecurringSeriesFormTargetType;
}
const CONTENT_STYLE = { paddingBottom: 96 };
export const RecurringSeriesFormFields = ({ target }: Props) => {
    const { t } = useLingui();
    const isEditing = target.mode === RecurringFormModeEnum.EDIT;
    const isDetected = isEditing && target.source === RecurringSeriesSourceEnum.DETECTED;
    const sourceTransactionId = target.mode === RecurringFormModeEnum.CREATE ? target.transactionId : null;
    const kindField = isEditing || isDefined(sourceTransactionId) ? null : <RecurringFormKindField />;
    const sourceSection = isDefined(sourceTransactionId) ? (
        <View>
            <GroupedListSectionTitle title={t`From transaction`} />
            <MakeRecurringSourceRow transactionId={sourceTransactionId} />
        </View>
    ) : null;
    const dateTitle = isDefined(sourceTransactionId) ? t`First payment` : t`Next payment`;

    return (
        <ScreenChromeScrollView
            includeTopSafeArea={false}
            contentContainerStyle={CONTENT_STYLE}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
        >
            <View className="gap-y-3xl pt-md">
                {sourceSection}
                {kindField}
                {isDetected ? null : <RecurringFormAmountField label={t`Amount`} />}
                <RecurringFormTitleField />

                <RecurringFormRepeatSection dateTitle={dateTitle} />
                <GroupedListSection title={t`Details`}>
                    {isDetected ? null : <RecurringFormCurrencyField />}
                    <RecurringFormCategoryField />
                    <RecurringFormAccountField />
                </GroupedListSection>
                <RecurringFormEndSection />
                <RecurringFormReminderSection />
            </View>
        </ScreenChromeScrollView>
    );
};
