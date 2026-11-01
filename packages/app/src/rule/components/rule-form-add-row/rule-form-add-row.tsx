import { UserIconNameEnum } from '@budgie/contracts';
import { Fragment } from 'react';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';

interface Props {
    readonly label: string;
    readonly onPress: () => void;
    readonly testID: string;
}

export const RuleFormAddRow = ({ label, onPress, testID }: Props) => (
    <GroupedListRow
        left={
            <CircleIcon
                icon={UserIconNameEnum.Plus}
                variant="default"
                size={36}
                iconSize={18}
                radius={18}
                border={false}
                className={TONAL_DISC_BACKGROUND.default}
            />
        }
        title={label}
        titleClassName="text-default-foreground"
        right={<Fragment />}
        onPress={onPress}
        testID={testID}
    />
);
