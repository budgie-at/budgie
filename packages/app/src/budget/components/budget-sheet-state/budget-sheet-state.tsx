import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetSelector } from '../../budget.selector';
import { BudgetDataState } from '../budget-data-state/budget-data-state';
import { BudgetScrollableSheet } from '../budget-scrollable-sheet/budget-scrollable-sheet';

interface Props {
    readonly title: string;
    readonly isLoading: boolean;
    readonly isError?: boolean;
    readonly description?: string;
    readonly unavailableTitle?: string;
}

export const BudgetSheetState = (props: Props) => {
    const { title, isLoading, isError, description, unavailableTitle } = props;
    const { t } = useLingui();
    const handleClose = () => void goBackOrReplace('/');
    const stateDescription =
        description ??
        (isError ? t`Your data could not be loaded. Close this screen and try again.` : t`This budget may have been deleted.`);

    return (
        <BudgetScrollableSheet>
            <FormsheetHeader size="sm" title={title} titleClassName="leading-tight" />
            <View className="px-5xl pt-md pb-3xl gap-y-xl">
                <BudgetDataState isLoading={isLoading} isError={isError} description={stateDescription} title={unavailableTitle} />
                <PillButton label={t`Close`} testID={BudgetSelector.DataStateCloseButton} onPress={handleClose} />
            </View>
        </BudgetScrollableSheet>
    );
};
