import { useLingui } from '@lingui/react/macro';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { TransactionFormSelectors } from '../../../@e2e/selectors/transaction-form.selector';
import { FormFooter } from '../../../@generic/component/form-footer/form-footer';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { SuggestRuleSection } from '../../../rule/components/suggest-rule-section/suggest-rule-section';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly buttonText: string;
    readonly onSubmit: EmptyFn;
    readonly onDelete?: EmptyFn;
    readonly showSuggestRule?: boolean;
    readonly onSuggestRulePress?: EmptyFn;
    readonly showConvertButton?: boolean;
    readonly onConvert?: EmptyFn;
}

export const TransactionFormFooter = (props: Props) => {
    const { variant, buttonText, onSubmit, onDelete, showConvertButton, onConvert, showSuggestRule, onSuggestRulePress } = props;
    const { t } = useLingui();

    return (
        <FormFooter
            variant={variant}
            buttonText={buttonText}
            onSubmit={onSubmit}
            onDelete={onDelete}
            onConvert={onConvert}
            showConvertButton={showConvertButton}
            deleteConfirmTitle={t`Are you sure you want to delete this transaction?`}
            deleteConfirmButtonText={t`Delete transaction`}
            submitTestID={TransactionFormSelectors.SubmitButton}
        >
            {showSuggestRule && isDefined(onSuggestRulePress) ? <SuggestRuleSection onPress={onSuggestRulePress} /> : null}
        </FormFooter>
    );
};
