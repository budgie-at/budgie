import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly children: ReactNode;
    readonly testID?: string;
}

const ICON_SIZE = 12;

export const RuleActionPillContainer = ({ icon, children, testID }: Props) => (
    <View
        className="flex-row items-center gap-x-sm rounded-2xl border border-secondary-corner bg-ghost-background px-lg py-md"
        testID={testID}
    >
        <Icon icon={icon} size={ICON_SIZE} className="text-primary" />
        <Text className="text-xs text-primary" {...testIDProps(testID, TestIDPartEnum.LABEL)}>
            {children}
        </Text>
    </View>
);
