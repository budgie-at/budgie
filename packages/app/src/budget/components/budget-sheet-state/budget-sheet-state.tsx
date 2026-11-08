import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { useMorphingSheetDismiss } from '../../../@generic/context/morphing-sheet.context';
import { BudgetSelector } from '../../budget.selector';
import { BudgetDataState } from '../budget-data-state/budget-data-state';

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
    const dismiss = useMorphingSheetDismiss();
    const stateDescription =
        description ??
        (isError ? t`Your data could not be loaded. Close this screen and try again.` : t`This budget may have been deleted.`);

    return (
        <SheetSurface
            className="flex-none pt-lg"
            contentClassName="flex-none"
            header={<FormsheetHeader size="sm" title={title} titleClassName="leading-tight" />}
        >
            <View className="px-5xl pt-md pb-3xl gap-y-xl">
                <BudgetDataState isLoading={isLoading} isError={isError} description={stateDescription} title={unavailableTitle} />
                <PillButton label={t`Close`} testID={BudgetSelector.DataStateCloseButton} onPress={dismiss} />
            </View>
        </SheetSurface>
    );
};
