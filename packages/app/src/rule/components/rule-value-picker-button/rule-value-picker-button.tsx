import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { RuleValueField } from '../rule-value-field/rule-value-field';

import type { ReactNode } from 'react';

interface Props {
    readonly value: string | null;
    readonly placeholder: string;
    readonly name: string;
    readonly isMissing: boolean;
    readonly leading: ReactNode;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const RuleValuePickerButton = ({ value, placeholder, name, isMissing, leading, onPress, testID }: Props) => {
    const { t } = useLingui();
    const hasValue = isNotEmptyString(value);
    const label = hasValue ? value : placeholder;
    const labelClassName = hasValue ? 'flex-1 text-[17px] text-primary' : 'flex-1 text-[17px] text-secondary-foreground';
    const hint = isMissing ? t`Needed to save this rule` : null;

    return (
        <RuleValueField
            isFocused={false}
            hint={hint}
            isHintWarning={isMissing}
            onPress={onPress}
            accessibilityLabel={`${name}: ${label}`}
            testID={testID}
        >
            {leading}
            <Text className={labelClassName} numberOfLines={1} {...testIDProps(testID, TestIDPartEnum.VALUE)}>
                {label}
            </Text>
            <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
        </RuleValueField>
    );
};
