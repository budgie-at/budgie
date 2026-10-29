import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { CategorizeInboxGroupScreenSelector } from '../categorize-inbox-group-screen/categorize-inbox-group-screen.selector';

interface Props {
    readonly nextKey: string | null;
}

export const CategorizeInboxGroupNextButton = ({ nextKey }: Props) => {
    const { t } = useLingui();
    const router = useRouter();

    const handlePress = (): void => {
        if (isDefined(nextKey)) {
            router.replace({ pathname: '/categorize/group/[key]', params: { key: nextKey } });
        }
    };

    if (!isDefined(nextKey)) {
        return null;
    }

    return (
        <HapticPressable
            onPress={handlePress}
            className="bg-secondary-background h-11 w-11 items-center justify-center rounded-full"
            accessibilityRole="button"
            accessibilityLabel={t`Next group`}
            testID={CategorizeInboxGroupScreenSelector.Next}
        >
            <Icon icon={UserIconNameEnum.ChevronRight} size={20} className="text-primary" />
        </HapticPressable>
    );
};
