import { Input } from '../../../@generic/component/input/input';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';

import type { UserIconType } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly value: string;
    readonly onChangeText: (value: string) => void;
    readonly placeholder: string;
    readonly secureTextEntry?: boolean;
    readonly right?: ReactNode;
    readonly testID?: string;
}

export const SyncCredentialRow = ({ icon, title, value, onChangeText, placeholder, secureTextEntry, right, testID }: Props) => (
    <SettingsRow
        icon={icon}
        variant="secondary"
        title={title}
        right={right}
        subtitle={
            <Input
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                accessibilityLabel={title}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                secureTextEntry={secureTextEntry}
                borderless
                className="-my-[13px] h-auto min-h-[44px] px-0 text-[13px]"
                testID={testID}
            />
        }
    />
);
