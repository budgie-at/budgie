import { CollapsibleChromeScrollFade } from '../../../@generic/component/collapsible-chrome-scroll-fade/collapsible-chrome-scroll-fade';
import { YieldEntryRow } from '../../../yield/component/yield-entry-row/yield-entry-row';

interface Props {
    readonly accountId: number;
}

export const AccountDetailsYieldEntry = ({ accountId }: Props) => {
    const scope = { positionAccountId: accountId, instrumentId: null };

    return (
        <CollapsibleChromeScrollFade>
            <YieldEntryRow scope={scope} />
        </CollapsibleChromeScrollFade>
    );
};
