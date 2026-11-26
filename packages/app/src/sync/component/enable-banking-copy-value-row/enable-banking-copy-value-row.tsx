import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { setStringAsync } from 'expo-clipboard';
import Toast from 'react-native-toast-message';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toNativeCallError } from '../../../@generic/utils/to-native-call-error.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';

interface Props {
    readonly label: string;
    readonly value: string;
}

export const EnableBankingCopyValueRow = ({ label, value }: Props) => {
    const { t } = useLingui();

    const { run } = useSingleFlight();
    const accessibilityProps = { accessibilityLabel: `${label}: ${value}`, accessibilityHint: t`Copies the value` };

    const handlePress = () => {
        void run(
            Effect.tryPromise({ try: () => setStringAsync(value), catch: toNativeCallError }).pipe(
                Effect.andThen(
                    Effect.sync(() => {
                        Toast.show({ type: 'success', text1: t`Copied`, text2: label });
                    })
                ),
                toastOnFailure(t`Could not copy value`)
            )
        );
    };

    return (
        <GroupedListRow
            title={label}
            subtitle={value}
            right={<Icon icon={UserIconNameEnum.Copy} size={16} className="text-secondary-foreground" />}
            onPress={handlePress}
            pressableProps={accessibilityProps}
        />
    );
};
