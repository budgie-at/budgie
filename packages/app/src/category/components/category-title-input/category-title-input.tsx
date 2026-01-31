import { CATEGORY_TITLE_MAX_LENGTH } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';

interface Props {
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly animationDelay?: number;
}

const DEFAULT_ANIMATION_DELAY = 100;

export const CategoryTitleInput = ({ value, onChange, animationDelay = DEFAULT_ANIMATION_DELAY }: Props) => {
    const { t } = useLingui();

    return (
        <Animated.View entering={FadeInUp.delay(animationDelay).duration(200)} className="px-3xl">
            <FormItem label={t`Category Name`}>
                <Input
                    size="lg"
                    value={value}
                    onChangeText={onChange}
                    maxLength={CATEGORY_TITLE_MAX_LENGTH}
                    placeholder={t`e.g. Groceries, Entertainment`}
                    autoCapitalize="words"
                    autoCorrect={false}
                    autoComplete="off"
                />
            </FormItem>
        </Animated.View>
    );
};
