/* eslint-disable max-lines-per-function */
/* eslint-disable react/jsx-max-depth */
/* eslint-disable lingui/no-unlocalized-strings */
/* eslint-disable max-lines */

import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { Footer } from '../../../generic/component/footer/footer';
import { Header } from '../../../generic/component/header/header';
import { Motion } from '../../../generic/component/motion/motion';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';

export default async function LicensePage(props: PageLangParam) {
    const { lang } = await props.params;

    initLingui(lang);

    return (
        <div className="flex min-h-dvh flex-col">
            <Header lang={lang} />

            <main className="flex-1">
                <section className="w-full py-20 md:py-32">
                    <div className="container px-4 md:px-6 max-w-4xl">
                        <Motion className="space-y-8">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                                    <Trans>Open Source License</Trans>
                                </h1>
                                <p className="text-muted-foreground">
                                    <Trans>Last Updated: November 6, 2024</Trans>
                                </p>
                            </div>

                            <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>1. Commitment to Open Source</Trans>
                                    </h2>
                                    <p>
                                        <Trans>
                                            Budgie is committed to transparency, security, and community collaboration. We believe that open source software is essential for building trust, especially when it comes to financial applications that handle sensitive personal data. By making our source code publicly available, we enable security audits, community contributions, and user verification of our privacy claims.
                                        </Trans>
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>2. Software License</Trans>
                                    </h2>
                                    
                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>2.1 Prosperity Public License 3.0.0</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            Budgie is licensed under the Prosperity Public License 3.0.0, a source-available license that allows free use for noncommercial purposes while requiring a separate commercial license for commercial use. This license enables:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <Trans>Free use, copying, modification, and sharing for noncommercial purposes</Trans>
                                        </li>
                                        <li>
                                            <Trans>Full access to source code for review and security audits</Trans>
                                        </li>
                                        <li>
                                            <Trans>Community contributions and improvements</Trans>
                                        </li>
                                        <li>
                                            <Trans>Personal use without restrictions</Trans>
                                        </li>
                                    </ul>

                                    <div className="mt-6 p-6 bg-muted rounded-lg border border-border">
                                        <h4 className="font-semibold mb-3">
                                            <Trans>Prosperity Public License 3.0.0</Trans>
                                        </h4>
                                        <div className="space-y-3 text-sm font-mono">
                                            <p>
                                                <Trans>Licensor: Budgie</Trans>
                                            </p>
                                            <p>
                                                <Trans>Software: Budgie – Mobile Expenses, Banking & Wealth Tracker</Trans>
                                            </p>
                                            <p>
                                                <Trans>Purpose: Noncommercial use</Trans>
                                            </p>
                                            <div className="mt-4 pt-4 border-t border-border">
                                                <p>
                                                    <Trans>
                                                        Permission is hereby granted, free of charge, to any person obtaining a copy of the Software to use, copy, modify, and share the Software for noncommercial purposes, subject to the following conditions:
                                                    </Trans>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-semibold mb-3 mt-8">
                                        <Trans>2.2 License Conditions</Trans>
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">
                                                <Trans>1. Noncommercial Use Only</Trans>
                                            </h4>
                                            <p>
                                                <Trans>
                                                    You may not use the Software for a fee, charge, consideration, or in or for a commercial product, service, or activity without a separate commercial license from the Licensor.
                                                </Trans>
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2">
                                                <Trans>2. Notices</Trans>
                                            </h4>
                                            <p>
                                                <Trans>
                                                    You must retain the copyright notice, this license notice, and the following attribution in all copies or substantial portions of the Software and derivative works:
                                                </Trans>
                                            </p>
                                            <div className="mt-2 p-3 bg-muted/50 rounded border border-border">
                                                <p className="text-sm italic">
                                                    <Trans>
                                                        &quot;This software is licensed for noncommercial use under the Prosperity Public License. Commercial use requires a license from Budgie.&quot;
                                                    </Trans>
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2">
                                                <Trans>3. No Liability</Trans>
                                            </h4>
                                            <p>
                                                <Trans>
                                                    THE SOFTWARE IS PROVIDED &quot;AS IS,&quot; WITHOUT WARRANTY OF ANY KIND. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                                                </Trans>
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>3. Commercial Use</Trans>
                                    </h2>
                                    <p>
                                        <Trans>
                                            If you wish to use Budgie for commercial purposes, including but not limited to:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <Trans>Offering Budgie as a service to customers or clients</Trans>
                                        </li>
                                        <li>
                                            <Trans>Integrating Budgie into a commercial product</Trans>
                                        </li>
                                        <li>
                                            <Trans>Using Budgie in a business or organizational context for profit</Trans>
                                        </li>
                                        <li>
                                            <Trans>Distributing modified versions of Budgie commercially</Trans>
                                        </li>
                                    </ul>
                                    <p className="mt-4">
                                        <Trans>
                                            You must obtain a separate commercial license. Please contact us at:
                                        </Trans>
                                    </p>
                                    <div className="mt-4 p-4 bg-muted rounded-lg">
                                        <p className="font-semibold">Budgie Commercial Licensing</p>
                                        <p>
                                            <Trans>Email: licensing@budgie.at</Trans>
                                        </p>
                                        <p>
                                            <Trans>Website: https://budgie.at</Trans>
                                        </p>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>4. Third-Party Open Source Components</Trans>
                                    </h2>
                                    <p>
                                        <Trans>
                                            Budgie incorporates and depends on numerous open source libraries and frameworks. We are deeply grateful to the open source community for their contributions. The following are some of the key open source components used in Budgie:
                                        </Trans>
                                    </p>

                                    <div className="mt-6 space-y-4">
                                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                            <h4 className="font-semibold mb-2">React Native & Expo</h4>
                                            <p className="text-sm text-muted-foreground">
                                                <Trans>
                                                    MIT License - Cross-platform mobile application framework
                                                </Trans>
                                            </p>
                                        </div>

                                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                            <h4 className="font-semibold mb-2">Next.js</h4>
                                            <p className="text-sm text-muted-foreground">
                                                <Trans>
                                                    MIT License - React framework for web applications
                                                </Trans>
                                            </p>
                                        </div>

                                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                            <h4 className="font-semibold mb-2">TypeScript</h4>
                                            <p className="text-sm text-muted-foreground">
                                                <Trans>
                                                    Apache License 2.0 - Typed superset of JavaScript
                                                </Trans>
                                            </p>
                                        </div>

                                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                            <h4 className="font-semibold mb-2">WatermelonDB</h4>
                                            <p className="text-sm text-muted-foreground">
                                                <Trans>
                                                    MIT License - Reactive database framework for React Native
                                                </Trans>
                                            </p>
                                        </div>

                                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                            <h4 className="font-semibold mb-2">TanStack Query</h4>
                                            <p className="text-sm text-muted-foreground">
                                                <Trans>
                                                    MIT License - Data fetching and state management
                                                </Trans>
                                            </p>
                                        </div>

                                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                            <h4 className="font-semibold mb-2">Lingui</h4>
                                            <p className="text-sm text-muted-foreground">
                                                <Trans>
                                                    MIT License - Internationalization framework
                                                </Trans>
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-6">
                                        <Trans>
                                            For a complete list of all open source dependencies and their respective licenses, please refer to the package.json files in our GitHub repository. Each component is used in accordance with its respective license terms.
                                        </Trans>
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>5. Contributing to Budgie</Trans>
                                    </h2>
                                    <p>
                                        <Trans>
                                            We welcome contributions from the community! By contributing to Budgie, you agree that:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <Trans>Your contributions will be licensed under the same Prosperity Public License 3.0.0</Trans>
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

                                    <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                        <h4 className="font-semibold mb-2">
                                            <Trans>How to Contribute</Trans>
                                        </h4>
                                        <ol className="list-decimal pl-6 space-y-2">
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
                                        <p className="mt-4">
                                            <Trans>
                                                Visit our GitHub repository at{' '}
                                            </Trans>
                                            <Link 
                                                className="text-primary hover:underline font-semibold" 
                                                href="https://github.com/budgie-at/budgie"
                                            >
                                                github.com/budgie-at/budgie
                                            </Link>
                                        </p>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>6. Source Code Access</Trans>
                                    </h2>
                                    <p>
                                        <Trans>
                                            The complete source code for Budgie is available on GitHub. You can:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
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

                                    <div className="mt-6 p-4 bg-muted rounded-lg">
                                        <p className="font-semibold mb-2">
                                            <Trans>Repository Information</Trans>
                                        </p>
                                        <p className="text-sm">
                                            <Trans>GitHub:</Trans>{' '}
                                            <Link 
                                                className="text-primary hover:underline" 
                                                href="https://github.com/budgie-at/budgie"
                                            >
                                                https://github.com/budgie-at/budgie
                                            </Link>
                                        </p>
                                        <p className="text-sm mt-2">
                                            <Trans>License:</Trans>{' '}
                                            <Link 
                                                className="text-primary hover:underline" 
                                                href="https://github.com/budgie-at/budgie/blob/main/LICENSE"
                                            >
                                                Prosperity Public License 3.0.0
                                            </Link>
                                        </p>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>7. Security Disclosures</Trans>
                                    </h2>
                                    <p>
                                        <Trans>
                                            We take security seriously. If you discover a security vulnerability in Budgie:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
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
                                    <p className="mt-4">
                                        <Trans>
                                            For more information, see our{' '}
                                        </Trans>
                                        <Link 
                                            className="text-primary hover:underline" 
                                            href="https://github.com/budgie-at/budgie/blob/main/SECURITY.md"
                                        >
                                            <Trans>Security Policy</Trans>
                                        </Link>
                                        .
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>8. Trademark Usage</Trans>
                                    </h2>
                                    <p>
                                        <Trans>
                                            While the Budgie source code is available under the Prosperity Public License, the &quot;Budgie&quot; name and logo are trademarks of Budgie. Use of these trademarks is subject to the following guidelines:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
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
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>9. Questions and Contact</Trans>
                                    </h2>
                                    <p>
                                        <Trans>
                                            If you have questions about our open source license, commercial licensing options, or anything else related to Budgie&apos;s licensing:
                                        </Trans>
                                    </p>
                                    <div className="mt-4 p-4 bg-muted rounded-lg">
                                        <p className="font-semibold">Budgie Licensing</p>
                                        <p>
                                            <Trans>Email: licensing@budgie.at</Trans>
                                        </p>
                                        <p>
                                            <Trans>General inquiries: hello@budgie.at</Trans>
                                        </p>
                                        <p>
                                            <Trans>Website: https://budgie.at</Trans>
                                        </p>
                                        <p className="mt-2">
                                            <Trans>GitHub:</Trans>{' '}
                                            <Link 
                                                className="text-primary hover:underline" 
                                                href="https://github.com/budgie-at/budgie"
                                            >
                                                github.com/budgie-at/budgie
                                            </Link>
                                        </p>
                                    </div>
                                </section>

                                <section className="mt-8 p-6 bg-primary/10 border border-primary/20 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-3">
                                        <Trans>Our Commitment</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            We believe in transparent, ethical software development. By keeping Budgie open source, we ensure that our privacy and security claims can be independently verified. We are committed to maintaining Budgie as an open source project and fostering a welcoming community for contributors and users alike.
                                        </Trans>
                                    </p>
                                </section>
                            </div>
                        </Motion>
                    </div>
                </section>
            </main>

            <Footer lang={lang} />
        </div>
    );
}
