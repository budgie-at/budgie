import { useLingui } from '@lingui/react/macro';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
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
    const { height } = useWindowDimensions();
    const { top, bottom } = useSafeAreaInsets();
    const scrollViewStyle = { flexGrow: 0, maxHeight: height - top - bottom };
    const handleClose = () => void goBackOrReplace('/');
    const stateDescription =
        description ??
        (isError ? t`Your data could not be loaded. Close this screen and try again.` : t`This budget may have been deleted.`);

    return (
        <View className="bg-sheet-surface" collapsable={false}>
            <ScrollView className="bg-sheet-surface" style={scrollViewStyle} contentInsetAdjustmentBehavior="automatic">
                <FormsheetHeader size="sm" title={title} titleClassName="leading-tight" />
                <View className="px-5xl pt-md pb-3xl gap-y-xl">
                    <BudgetDataState isLoading={isLoading} isError={isError} description={stateDescription} title={unavailableTitle} />
                    <PillButton label={t`Close`} testID={BudgetSelector.DataStateCloseButton} onPress={handleClose} />
                </View>
            </ScrollView>
        </View>
    );
};
