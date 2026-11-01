import { useEffect } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { PillButton } from '../pill-button/pill-button';

import type { DestinationCommitCopyInterface } from '../../interface/destination-commit-copy.interface';

interface Props {
    readonly commitCopy: DestinationCommitCopyInterface | null;
    readonly commitLabel: string;
    readonly pickLabel: string;
    readonly onCommit: () => void;
    readonly testID: string;
}

const MIN_BOTTOM_SPACING = 16;

export const DestinationSheetFooter = ({ commitCopy, commitLabel, pickLabel, onCommit, testID }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const style = { paddingBottom: Math.max(bottom, MIN_BOTTOM_SPACING) };
    const summary = commitCopy?.summary ?? null;
    const label = isDefined(commitCopy) ? commitLabel : pickLabel;
    const accessibilityLabel = commitCopy?.accessibilityLabel ?? pickLabel;

    useEffect(() => {
        if (isNotEmptyString(summary)) {
            AccessibilityInfo.announceForAccessibility(summary);
        }
    }, [summary]);

    return (
        <View className="gap-y-md border-t-hairline border-surface-separator bg-primary-reverse px-xl pt-lg" style={style}>
            {isNotEmptyString(summary) ? (
                <Text className="text-secondary-foreground px-md text-[15px] leading-[20px]">{summary}</Text>
            ) : null}
            <PillButton
                label={label}
                accessibilityLabel={accessibilityLabel}
                variant="destructive"
                isDisabled={!isDefined(commitCopy)}
                onPress={onCommit}
                testID={testID}
            />
        </View>
    );
};
