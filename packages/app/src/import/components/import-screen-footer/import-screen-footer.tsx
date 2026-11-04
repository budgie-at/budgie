import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';
import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { ImportScreenSelector } from '../../../app/(tabs)/settings/import-screen.selector';

interface Props {
    readonly buttonContent: string;
    readonly accessibilityHint: string;
    readonly onImport: () => void;
    readonly isDisabled: boolean;
    readonly isLoading: boolean;
    readonly missingRequiredCount: number;
}

export const ImportScreenFooter = (props: Props) => {
    const { buttonContent, accessibilityHint, onImport, isDisabled, isLoading, missingRequiredCount } = props;
    const { t } = useLingui();
    const style = useResolveClassNames('bg-surface');
    const edgeFadeProps = { height: 0 };
    const buttonClassName = isDisabled ? 'bg-cta-background/40 border-transparent opacity-100' : '';
    const blockerDescription = t({
        message: plural(missingRequiredCount, {
            one: 'Choose a column for # required field.',
            other: 'Choose columns for # required fields.'
        })
    });

    return (
        <ScreenChromeFooter style={style} edgeFadeProps={edgeFadeProps}>
            <View className="bg-surface border-t-hairline border-surface-separator gap-y-[8px] px-5xl py-lg">
                {isPositiveNumber(missingRequiredCount) ? (
                    <Text className="text-secondary-foreground px-3xl text-[13px] leading-[18px]">{blockerDescription}</Text>
                ) : null}
                <Button
                    content={buttonContent}
                    accessibilityLabel={buttonContent}
                    accessibilityHint={accessibilityHint}
                    variant="cta"
                    className={buttonClassName}
                    onPress={onImport}
                    size="lg"
                    disabled={isDisabled}
                    isLoading={isLoading}
                    testID={ImportScreenSelector.StartImportButton}
                />
            </View>
        </ScreenChromeFooter>
    );
};
