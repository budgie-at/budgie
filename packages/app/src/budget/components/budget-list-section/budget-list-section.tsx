import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { HeaderTextAction } from '../../../@generic/component/header-text-action/header-text-action';
import { SectionHeader } from '../../../@generic/component/section-header/section-header';

interface Props {
    readonly label: string;
    readonly testID: string;
    readonly addTestID: string;
    readonly onAddPress: () => void;
    readonly footnote: ReactNode;
    readonly children: ReactNode;
}

export const BudgetListSection = ({ label, testID, addTestID, onAddPress, footnote, children }: Props) => {
    const { t } = useLingui();

    return (
        <EntranceReveal step={5} className="gap-y-lg">
            <View collapsable={false} className="gap-y-lg" testID={testID}>
                <SectionHeader label={label} trailing={<HeaderTextAction label={t`Add`} onPress={onAddPress} testID={addTestID} />} />
                <View className="gap-y-lg">{children}</View>
                {footnote}
            </View>
        </EntranceReveal>
    );
};
