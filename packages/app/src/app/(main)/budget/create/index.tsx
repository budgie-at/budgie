import { t } from '@lingui/core/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { BudgetMissingCurrencyGuard } from '../../../../budget/components/budget-missing-currency-guard/budget-missing-currency-guard';
import { BudgetTemplateChooser } from '../../../../budget/components/budget-template-chooser/budget-template-chooser';
import { useSetting } from '../../../../settings/hook/use-setting.hook';

const handleGoBack = () => void goBackOrReplace('/');

export default function BudgetTemplateChooserScreen() {
    const defaultInstrumentId = useSetting('defaultInstrumentId');

    if (!isPositiveNumber(defaultInstrumentId)) {
        return <BudgetMissingCurrencyGuard />;
    }

    return (
        <Page header={<PageHeader title={t`Create budget`} onGoBack={handleGoBack} />}>
            <BudgetTemplateChooser />
        </Page>
    );
}
