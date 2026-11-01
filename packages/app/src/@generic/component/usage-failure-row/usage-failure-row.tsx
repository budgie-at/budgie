import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../circle-icon/circle-icon';
import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../grouped-list-section/grouped-list-section';
import { Icon } from '../icon/icon';

interface Props {
    readonly onRetry: EmptyFn;
}

export const UsageFailureRow = ({ onRetry }: Props) => {
    const { t } = useLingui();

    return (
        <View className="pb-3xl">
            <GroupedListSection>
                <GroupedListRow
                    left={
                        <CircleIcon
                            icon={UserIconNameEnum.TriangleAlert}
                            variant="ghost"
                            size={36}
                            iconSize={18}
                            radius={18}
                            border={false}
                        />
                    }
                    title={t`Couldn’t load transaction counts`}
                    subtitle={t`Names are up to date. Tap to try again.`}
                    right={<Icon icon={UserIconNameEnum.RotateCw} size={16} className="text-secondary-foreground" />}
                    onPress={onRetry}
                />
            </GroupedListSection>
        </View>
    );
};
