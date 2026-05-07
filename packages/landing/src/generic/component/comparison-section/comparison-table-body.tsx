import { Trans } from '@lingui/react/macro';

import { ComparisonRow } from './comparison-row';

export const ComparisonTableBody = () => (
    <tbody>
        <ComparisonRow budgie feature={<Trans>100% Offline</Trans>} others={false} />
        <ComparisonRow budgie feature={<Trans>Data on your device only</Trans>} others={false} />
        <ComparisonRow budgie feature={<Trans>Biometric lock + AES-256 encrypted storage</Trans>} others={false} />
        <ComparisonRow budgie feature={<Trans>Source-available code</Trans>} others={false} />
        <ComparisonRow budgie feature={<Trans>No account required</Trans>} others={false} />
        <ComparisonRow budgie feature={<Trans>Works without internet</Trans>} others={false} />
        <ComparisonRow budgie feature={<Trans>No data mining</Trans>} others={false} />
        <ComparisonRow budgie feature={<Trans>Bank sync available</Trans>} others />
        <ComparisonRow budgie feature={<Trans>Crypto tracking</Trans>} others={false} />
        <ComparisonRow budgie feature={<Trans>Multi-currency support</Trans>} others />
    </tbody>
);
