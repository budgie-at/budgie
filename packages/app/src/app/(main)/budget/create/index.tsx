import { t } from '@lingui/core/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../../@generic/component/header-back-button/header-back-button';
import { BudgetMissingCurrencyGuard } from '../../../../budget/components/budget-missing-currency-guard/budget-missing-currency-guard';
import { BudgetTemplateChooser } from '../../../../budget/components/budget-template-chooser/budget-template-chooser';
import { useSetting } from '../../../../settings/hook/use-setting.hook';

export default function BudgetTemplateChooserScreen() {
    const defaultInstrumentId = useSetting('defaultInstrumentId');

    if (!isPositiveNumber(defaultInstrumentId)) {
        return <BudgetMissingCurrencyGuard />;
    }

    return (
        <CollapsibleChromePage title={t`Create budget`} leading={<HeaderBackButton />}>
            <BudgetTemplateChooser />
        </CollapsibleChromePage>
    );
}
