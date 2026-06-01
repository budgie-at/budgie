/* eslint-disable max-lines, max-lines-per-function -- legal page keeps binding copy inline instead of MDX or registries */
import { Trans } from '@lingui/react/macro';

import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { LICENSE_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return {
        title: i18n._(LICENSE_METADATA.title),
        description: i18n._(LICENSE_METADATA.description)
    };
}

export default async function LicensePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);
    const updatedAtText = i18n._(LICENSE_METADATA.updatedAt);

    return (
        <>
            <h1>
                <Trans>Open Source License</Trans>
            </h1>
            <div className="text-muted-foreground mb-8">
                <Trans>Last Updated: {updatedAtText}</Trans>
            </div>
            <h2>
                <Trans>1. Commitment to Open Source</Trans>
            </h2>
            <p>
                <Trans>
                    Budgie is committed to transparency, security, and community collaboration. We believe that open source software is
                    essential for building trust, especially when it comes to financial applications that handle sensitive personal data. By
                    making our source code publicly available, we enable security audits, community contributions, and user verification of
                    our privacy claims.
                </Trans>
            </p>
            <h2>
                <Trans>2. Software License</Trans>
            </h2>
            <h3>
                <Trans>2.1 O&apos;Saasy License Agreement</Trans>
            </h3>
            <p>
                <Trans>
                    Budgie is licensed under the O&apos;Saasy License, a source-available license that allows free use, modification, and
                    distribution while preventing direct SaaS competition. This license enables:
                </Trans>
            </p>
            <ul>
                <li>
                    <Trans>Free use, copying, modification, and sharing for personal and business purposes</Trans>
                </li>
                <li>
                    <Trans>Full access to source code for review and security audits</Trans>
                </li>
                <li>
                    <Trans>Community contributions and improvements</Trans>
                </li>
                <li>
                    <Trans>Self-hosting and internal use without restrictions</Trans>
                </li>
                <li>
                    <Trans>Commercial use except for competing SaaS offerings</Trans>
                </li>
            </ul>
            <p>
                <strong>
                    <Trans>O&apos;Saasy License Agreement</Trans>
                </strong>
            </p>
            <p>
                <Trans>Copyright &copy; 2024-2026, Budgie</Trans>
            </p>
            <p>
                <Trans>
                    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
                    documentation files (the &quot;Software&quot;), to deal in the Software without restriction, including without
                    limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
                    and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
                </Trans>
            </p>
            <h3>
                <Trans>2.2 License Conditions</Trans>
            </h3>
            <p>
                <strong>
                    <Trans>1. Copyright and Permission Notice</Trans>
                </strong>
            </p>
            <p>
                <Trans>
                    The copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
                </Trans>
            </p>
            <p>
                <strong>
                    <Trans>2. Non-Compete for SaaS</Trans>
                </strong>
            </p>
            <p>
                <Trans>
                    No licensee or downstream recipient may use the Software (including any modified or derivative versions) to directly
                    compete with the original Licensor by offering it to third parties as a hosted, managed, or Software-as-a-Service (SaaS)
                    product or cloud service where the primary value of the service is the functionality of the Software itself.
                </Trans>
            </p>
            <p>
                <strong>
                    <Trans>3. No Liability</Trans>
                </strong>
            </p>
            <p>
                <Trans>
                    THE SOFTWARE IS PROVIDED &quot;AS IS,&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
                    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT
                    OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                </Trans>
            </p>
            <h2>
                <Trans>3. Permitted Uses</Trans>
            </h2>
            <p>
                <Trans>The O&apos;Saasy license allows you to:</Trans>
            </p>
            <ul>
                <li>
                    <Trans>
                        <strong>Personal Use</strong>: Use Budgie for your own personal finance tracking
                    </Trans>
                </li>
                <li>
                    <Trans>
                        <strong>Self-Hosting</strong>: Host Budgie on your own servers for yourself or your organization
                    </Trans>
                </li>
                <li>
                    <Trans>
                        <strong>Internal Business Use</strong>: Deploy Budgie within your company for employee use
                    </Trans>
                </li>
                <li>
                    <Trans>
                        <strong>Modifications</strong>: Create and use modified versions of Budgie
                    </Trans>
                </li>
                <li>
                    <Trans>
                        <strong>Learning &amp; Education</strong>: Study the code for educational purposes
                    </Trans>
                </li>
                <li>
                    <Trans>
                        <strong>Security Research</strong>: Audit and review the code for security vulnerabilities
                    </Trans>
                </li>
                <li>
                    <Trans>
                        <strong>Contributions</strong>: Contribute improvements back to the project
                    </Trans>
                </li>
            </ul>
            <h2>
                <Trans>4. Restricted Uses</Trans>
            </h2>
            <p>
                <Trans>The following uses require explicit permission or a separate commercial license:</Trans>
            </p>
            <ul>
                <li>
                    <Trans>
                        <strong>Competing SaaS</strong>: Offering Budgie (or derivatives) as a hosted service to third parties
                    </Trans>
                </li>
                <li>
                    <Trans>
                        <strong>Managed Services</strong>: Providing Budgie as a managed, cloud-based product to customers
                    </Trans>
                </li>
                <li>
                    <Trans>
                        <strong>White-Label Solutions</strong>: Rebranding Budgie and selling it as a SaaS product
                    </Trans>
                </li>
            </ul>
            <p>
                <Trans>If you wish to offer Budgie-based services that compete with our hosted offering, please contact us at:</Trans>
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg mb-8">
                <h4>
                    <Trans>Budgie Commercial Licensing</Trans>
                </h4>
                <ul>
                    <li>
                        <Trans>Email: licensing@budgie.at</Trans>
                    </li>
                    <li>
                        <Trans>Website: https://budgie.at</Trans>
                    </li>
                </ul>
            </div>
            <p>
                <Trans>
                    For more information about the O&apos;Saasy license, visit <a href="https://osaasy.dev">https://osaasy.dev</a>
                </Trans>
            </p>
            <h2>
                <Trans>5. Third-Party Open Source Components</Trans>
            </h2>
            <p>
                <Trans>
                    Budgie incorporates and depends on numerous open source libraries and frameworks. We are deeply grateful to the open
                    source community for their contributions. The following are some of the key open source components used in Budgie:
                </Trans>
            </p>
            <p>
                <Trans>
                    <strong>React Native &amp; Expo</strong> MIT License - Cross-platform mobile application framework
                </Trans>
            </p>
            <p>
                <Trans>
                    <strong>Next.js</strong> MIT License - React framework for web applications
                </Trans>
            </p>
            <p>
                <Trans>
                    <strong>TypeScript</strong> Apache License 2.0 - Typed superset of JavaScript
                </Trans>
            </p>
            <p>
                <Trans>
                    <strong>WatermelonDB</strong> MIT License - Reactive database framework for React Native
                </Trans>
            </p>
            <p>
                <Trans>
                    <strong>TanStack Query</strong> MIT License - Data fetching and state management
                </Trans>
            </p>
            <p>
                <Trans>
                    <strong>Lingui</strong> MIT License - Internationalization framework
                </Trans>
            </p>
            <p>
                <Trans>
                    For a complete list of all open source dependencies and their respective licenses, please refer to the package.json
                    files in our <a href="https://github.com/budgie-at/budgie">GitHub repository</a>. Each component is used in accordance
                    with its respective license terms.
                </Trans>
            </p>
            <h2>
                <Trans>6. Contributing to Budgie</Trans>
            </h2>
            <p>
                <Trans>We welcome contributions from the community! By contributing to Budgie, you agree that:</Trans>
            </p>
            <ul>
                <li>
                    <Trans>Your contributions will be licensed under the same O&apos;Saasy License</Trans>
                </li>
                <li>
                    <Trans>You have the right to make the contribution and grant us the rights to use it</Trans>
                </li>
                <li>
                    <Trans>Your contribution does not violate any third-party rights</Trans>
                </li>
                <li>
                    <Trans>You agree to follow our code of conduct and contribution guidelines</Trans>
                </li>
            </ul>
            <p>
                <strong>
                    <Trans>How to Contribute</Trans>
                </strong>
            </p>
            <ol>
                <li>
                    <Trans>Fork the repository on GitHub</Trans>
                </li>
                <li>
                    <Trans>Create a feature branch for your changes</Trans>
                </li>
                <li>
                    <Trans>Make your changes with clear, descriptive commit messages</Trans>
                </li>
                <li>
                    <Trans>Add tests for new functionality</Trans>
                </li>
                <li>
                    <Trans>Submit a pull request with a detailed description</Trans>
                </li>
            </ol>
            <p>
                <Trans>
                    Visit our GitHub repository at <a href="https://github.com/budgie-at/budgie">github.com/budgie-at/budgie</a>
                </Trans>
            </p>
            <h2>
                <Trans>7. Source Code Access</Trans>
            </h2>
            <p>
                <Trans>The complete source code for Budgie is available on GitHub. You can:</Trans>
            </p>
            <ul>
                <li>
                    <Trans>Browse the source code online</Trans>
                </li>
                <li>
                    <Trans>Clone the repository for local development</Trans>
                </li>
                <li>
                    <Trans>Review our commit history and development process</Trans>
                </li>
                <li>
                    <Trans>Audit our security and privacy implementations</Trans>
                </li>
                <li>
                    <Trans>Build the application from source</Trans>
                </li>
            </ul>
            <p>
                <strong>
                    <Trans>Repository Information</Trans>
                </strong>
            </p>
            <p>
                <Trans>
                    GitHub: <a href="https://github.com/budgie-at/budgie">https://github.com/budgie-at/budgie</a> License:{' '}
                    <a href="https://github.com/budgie-at/budgie/blob/main/LICENSE">O&apos;Saasy License</a>
                </Trans>
            </p>
            <h2>
                <Trans>8. Security Disclosures</Trans>
            </h2>
            <p>
                <Trans>We take security seriously. If you discover a security vulnerability in Budgie:</Trans>
            </p>
            <ul>
                <li>
                    <Trans>Please report it responsibly by emailing security@budgie.at</Trans>
                </li>
                <li>
                    <Trans>Do not publicly disclose the vulnerability until we have addressed it</Trans>
                </li>
                <li>
                    <Trans>Provide detailed information to help us reproduce and fix the issue</Trans>
                </li>
                <li>
                    <Trans>We will acknowledge your report within 48 hours</Trans>
                </li>
            </ul>
            <p>
                <Trans>
                    For more information, see our <a href="https://github.com/budgie-at/budgie/blob/main/SECURITY.md">Security Policy</a>.
                </Trans>
            </p>
            <h2>
                <Trans>9. Trademark Usage</Trans>
            </h2>
            <p>
                <Trans>
                    While the Budgie source code is available under the O&apos;Saasy License, the &quot;Budgie&quot; name and logo are
                    trademarks of Budgie. Use of these trademarks is subject to the following guidelines:
                </Trans>
            </p>
            <ul>
                <li>
                    <Trans>You may use the name &quot;Budgie&quot; to refer to the software project</Trans>
                </li>
                <li>
                    <Trans>You may not use our trademarks in a way that suggests endorsement</Trans>
                </li>
                <li>
                    <Trans>Modified versions must be clearly identified as such</Trans>
                </li>
                <li>
                    <Trans>Commercial use of our trademarks requires explicit permission</Trans>
                </li>
            </ul>
            <h2>
                <Trans>10. Questions and Contact</Trans>
            </h2>
            <p>
                <Trans>
                    If you have questions about our open source license, commercial licensing options, or anything else related to
                    Budgie&apos;s licensing:
                </Trans>
            </p>
            <p>
                <Trans>
                    <strong>Budgie Licensing</strong> Email: licensing@budgie.at General inquiries: hello@budgie.at Website:
                    https://budgie.at GitHub: <a href="https://github.com/budgie-at/budgie">github.com/budgie-at/budgie</a>
                </Trans>
            </p>
            <hr />
            <h3>
                <Trans>Our Commitment</Trans>
            </h3>
            <p>
                <Trans>
                    We believe in transparent, ethical software development. By keeping Budgie open source, we ensure that our privacy and
                    security claims can be independently verified. We are committed to maintaining Budgie as an open source project and
                    fostering a welcoming community for contributors and users alike.
                </Trans>
            </p>
        </>
    );
}
