import { useLingui } from '@lingui/react/macro';

import { EmptyFn, isDefined } from '@rnw-community/shared';

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
}

export const TransactionFormFooter = ({ variant, buttonText, onSubmit, onDelete, showSuggestRule, onSuggestRulePress }: Props) => {
    const { t } = useLingui();

    return (
        <FormFooter
            variant={variant}
            buttonText={buttonText}
            onSubmit={onSubmit}
            onDelete={onDelete}
            deleteConfirmTitle={t`Are you sure you want to delete this transaction?`}
            deleteConfirmButtonText={t`Delete transaction`}
        >
            {showSuggestRule && isDefined(onSuggestRulePress) ? <SuggestRuleSection onPress={onSuggestRulePress} /> : null}
        </FormFooter>
    );
};
