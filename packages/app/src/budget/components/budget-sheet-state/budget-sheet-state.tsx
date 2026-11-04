import { View } from 'react-native';

import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { BudgetDataState } from '../budget-data-state/budget-data-state';

interface Props {
    readonly title: string;
    readonly isLoading: boolean;
    readonly isError?: boolean;
    readonly description?: string;
}

export const BudgetSheetState = ({ title, isLoading, isError, description }: Props) => (
    <View className="bg-sheet-surface">
        <FormsheetHeader size="md" title={title} />
        <View className="px-5xl pt-md pb-3xl">
            <BudgetDataState isLoading={isLoading} isError={isError} description={description} />
        </View>
    </View>
);
