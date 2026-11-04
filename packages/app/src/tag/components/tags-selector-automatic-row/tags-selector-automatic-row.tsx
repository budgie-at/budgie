import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { GroupedListItem } from '../../../@generic/component/grouped-list-item/grouped-list-item';
import { Icon } from '../../../@generic/component/icon/icon';
import { SelectorRow } from '../../../@generic/component/selector-row/selector-row';

interface Props {
    readonly label: string;
    readonly isSelected: boolean;
    readonly onPress: () => void;
}

export const TagsSelectorAutomaticRow = ({ label, isSelected, onPress }: Props) => {
    const { t } = useLingui();

    return (
        <View className="pb-3xl">
            <GroupedListItem isFirst isLast>
                <SelectorRow
                    title={label}
                    subtitle={t`A tag named after the event, created if needed`}
                    isSelected={isSelected}
                    onPress={onPress}
                    left={<Icon icon={UserIconNameEnum.Sparkles} size={22} className="text-secondary-foreground" />}
                />
            </GroupedListItem>
        </View>
    );
};
