/* eslint-disable max-lines-per-function */
/* eslint-disable react/jsx-max-depth */
/* eslint-disable max-lines */

import { Trans } from '@lingui/react/macro';

import { Footer } from '../../../generic/component/footer/footer';
import { Header } from '../../../generic/component/header/header';
import { Motion } from '../../../generic/component/motion/motion';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';

export default async function TermsOfServicePage(props: PageLangParam) {
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
                                    <Trans>Terms of Service</Trans>
                                </h1>
                                <p className="text-muted-foreground">
                                    <Trans>Last Updated: November 6, 2024</Trans>
                                </p>
                            </div>

                            <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>1. Agreement to Terms</Trans>
                                    </h2>
                                    <p>
                                        <Trans>
                                            By accessing or using Budgie (&quot;Service,&quot; &quot;App,&quot; or &quot;Application&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all users of the Service, including without limitation users who are browsers, customers, and/or contributors of content.
                                        </Trans>
                                    </p>
                                    <p className="mt-4">
                                        <Trans>
                                            Budgie is operated by Budgie (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We reserve the right to update, change, or replace any part of these Terms by posting updates and changes to our website. Your continued use of the Service following the posting of any changes constitutes acceptance of those changes.
                                        </Trans>
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>2. Description of Service</Trans>
                                    </h2>
                                    <p>
                                        <Trans>
                                            Budgie is a privacy-first, offline-first mobile application designed to help users track expenses, manage budgets, sync bank accounts (optional), monitor investments (stocks and cryptocurrency), track debts and loans, set financial goals, and access AI-powered financial insights. The Service operates primarily on your device, with optional cloud features that require explicit user consent.
                                        </Trans>
                                    </p>
                                    <p className="mt-4">
                                        <Trans>
                                            The Service is provided &quot;as is&quot; and we reserve the right to modify, suspend, or discontinue any aspect of the Service at any time without notice.
                                        </Trans>
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>3. User Accounts and Eligibility</Trans>
                                    </h2>
                                    
                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>3.1 Eligibility</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            You must be at least 18 years of age to use this Service. By using the Service, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
                                        </Trans>
                                    </p>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>3.2 Account Security</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            If the Service requires account creation, you are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <Trans>Provide accurate, current, and complete information</Trans>
                                        </li>
                                        <li>
                                            <Trans>Maintain and promptly update your account information</Trans>
                                        </li>
                                        <li>
                                            <Trans>Maintain the security of your password and device</Trans>
                                        </li>
                                        <li>
                                            <Trans>Immediately notify us of any unauthorized use of your account</Trans>
                                        </li>
                                        <li>
                                            <Trans>Not share your account credentials with any third party</Trans>
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>4. License and Permitted Use</Trans>
                                    </h2>
                                    
                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>4.1 Limited License</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to download, install, and use the Application on your personal mobile device solely for your personal, non-commercial use.
                                        </Trans>
                                    </p>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>4.2 Restrictions</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            You agree NOT to:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <Trans>Modify, reverse engineer, decompile, or disassemble the Application</Trans>
                                        </li>
                                        <li>
                                            <Trans>Remove, alter, or obscure any proprietary notices or labels</Trans>
                                        </li>
                                        <li>
                                            <Trans>Use the Service for any illegal or unauthorized purpose</Trans>
                                        </li>
                                        <li>
                                            <Trans>Violate any laws in your jurisdiction</Trans>
                                        </li>
                                        <li>
                                            <Trans>Transmit viruses, malware, or any malicious code</Trans>
                                        </li>
                                        <li>
                                            <Trans>Attempt to gain unauthorized access to any part of the Service</Trans>
                                        </li>
                                        <li>
                                            <Trans>Use automated systems to access the Service without permission</Trans>
                                        </li>
                                        <li>
                                            <Trans>Resell, redistribute, or sublicense the Service</Trans>
                                        </li>
                                        <li>
                                            <Trans>Use the Service to provide services to third parties</Trans>
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>5. Financial Information and Disclaimers</Trans>
                                    </h2>
                                    
                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>5.1 Not Financial Advice</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            THE SERVICE IS FOR INFORMATIONAL AND ORGANIZATIONAL PURPOSES ONLY. NOTHING IN THE SERVICE CONSTITUTES FINANCIAL, INVESTMENT, LEGAL, OR TAX ADVICE. We are not licensed financial advisors, accountants, or tax professionals. You should consult with appropriate professionals before making any financial decisions.
                                        </Trans>
                                    </p>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>5.2 Data Accuracy</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            While we strive to provide accurate information, we do not warrant the accuracy, completeness, or reliability of:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <Trans>Market data and pricing information</Trans>
                                        </li>
                                        <li>
                                            <Trans>Bank synchronization data</Trans>
                                        </li>
                                        <li>
                                            <Trans>AI-generated insights and recommendations</Trans>
                                        </li>
                                        <li>
                                            <Trans>Calculations and projections</Trans>
                                        </li>
                                    </ul>
                                    <p className="mt-4">
                                        <Trans>
                                            You are responsible for verifying all financial information and calculations provided by the Service.
                                        </Trans>
                                    </p>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>5.3 Third-Party Services</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            When you use optional features such as bank synchronization or market data feeds, you are also subject to the terms and conditions of those third-party service providers. We are not responsible for the availability, accuracy, or reliability of third-party services.
                                        </Trans>
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>6. User Content and Data</Trans>
                                    </h2>
                                    
                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>6.1 Your Data</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            You retain all rights to the financial data and content you input into the Service (&quot;User Content&quot;). By using the Service, you grant us a limited license to process your User Content solely for the purpose of providing the Service to you.
                                        </Trans>
                                    </p>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>6.2 Data Backup</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            YOU ARE SOLELY RESPONSIBLE FOR BACKING UP YOUR DATA. While the Service stores data locally on your device and may offer optional cloud backup features, we are not responsible for any loss of data. We strongly recommend regularly exporting your data using the built-in export features.
                                        </Trans>
                                    </p>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>6.3 Prohibited Content</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            You agree not to use the Service to store or transmit any content that:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <Trans>Is illegal, fraudulent, or promotes illegal activity</Trans>
                                        </li>
                                        <li>
                                            <Trans>Violates the rights of others</Trans>
                                        </li>
                                        <li>
                                            <Trans>Contains malicious code or harmful components</Trans>
                                        </li>
                                        <li>
                                            <Trans>Is used to facilitate money laundering or other financial crimes</Trans>
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>7. Intellectual Property Rights</Trans>
                                    </h2>
                                    <p>
                                        <Trans>
                                            The Service, including its original content, features, and functionality, is owned by Budgie and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. Our trademarks and trade dress may not be used without our prior written permission.
                                        </Trans>
                                    </p>
                                    <p className="mt-4">
                                        <Trans>
                                            Subject to the open source license under which the software is distributed (see our Open Source License page), you may not copy, modify, distribute, sell, or lease any part of our Service or included software, nor may you reverse engineer or attempt to extract the source code of that software, except as permitted by law or with our written permission.
                                        </Trans>
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>8. Payment Terms</Trans>
                                    </h2>
                                    
                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>8.1 Free and Premium Features</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            The core features of the Service are provided free of charge. We may offer premium features, subscriptions, or in-app purchases (&quot;Premium Services&quot;) that require payment. All fees are clearly disclosed before purchase.
                                        </Trans>
                                    </p>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>8.2 Subscriptions</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            If you purchase a subscription:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <Trans>Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period</Trans>
                                        </li>
                                        <li>
                                            <Trans>Your account will be charged for renewal within 24 hours prior to the end of the current period</Trans>
                                        </li>
                                        <li>
                                            <Trans>You can manage subscriptions and turn off auto-renewal in your device&apos;s account settings</Trans>
                                        </li>
                                        <li>
                                            <Trans>Refunds are subject to the policies of the app store (Apple App Store or Google Play Store)</Trans>
                                        </li>
                                    </ul>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>8.3 Price Changes</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            We reserve the right to change our prices at any time. Price changes will not affect existing subscriptions until renewal. We will provide reasonable notice of price changes.
                                        </Trans>
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>9. Disclaimers and Limitation of Liability</Trans>
                                    </h2>
                                    
                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>9.1 Disclaimer of Warranties</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY. WE DO NOT WARRANT THAT:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <Trans>The Service will meet your requirements</Trans>
                                        </li>
                                        <li>
                                            <Trans>The Service will be uninterrupted, timely, secure, or error-free</Trans>
                                        </li>
                                        <li>
                                            <Trans>The results obtained from the Service will be accurate or reliable</Trans>
                                        </li>
                                        <li>
                                            <Trans>Any errors in the Service will be corrected</Trans>
                                        </li>
                                    </ul>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>9.2 Limitation of Liability</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL BUDGIE, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <Trans>Your access to or use of (or inability to access or use) the Service</Trans>
                                        </li>
                                        <li>
                                            <Trans>Any conduct or content of any third party on the Service</Trans>
                                        </li>
                                        <li>
                                            <Trans>Any content obtained from the Service</Trans>
                                        </li>
                                        <li>
                                            <Trans>Unauthorized access, use, or alteration of your content</Trans>
                                        </li>
                                        <li>
                                            <Trans>Financial losses or decisions made based on the Service</Trans>
                                        </li>
                                    </ul>
                                    <p className="mt-4">
                                        <Trans>
                                            OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.
                                        </Trans>
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>10. Indemnification</Trans>
                                    </h2>
                                    <p>
                                        <Trans>
                                            You agree to defend, indemnify, and hold harmless Budgie and its licensors, affiliates, and service providers, and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys&apos; fees) arising out of or relating to:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <Trans>Your violation of these Terms</Trans>
                                        </li>
                                        <li>
                                            <Trans>Your use or misuse of the Service</Trans>
                                        </li>
                                        <li>
                                            <Trans>Your violation of any law or the rights of a third party</Trans>
                                        </li>
                                        <li>
                                            <Trans>Any User Content you submit or transmit through the Service</Trans>
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>11. Termination</Trans>
                                    </h2>
                                    <p>
                                        <Trans>
                                            We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms. Upon termination:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <Trans>Your right to use the Service will immediately cease</Trans>
                                        </li>
                                        <li>
                                            <Trans>You should cease all use of the Service</Trans>
                                        </li>
                                        <li>
                                            <Trans>Data stored locally on your device will remain accessible</Trans>
                                        </li>
                                        <li>
                                            <Trans>We may delete any cloud-stored data in accordance with our data retention policy</Trans>
                                        </li>
                                    </ul>
                                    <p className="mt-4">
                                        <Trans>
                                            You may terminate your use of the Service at any time by uninstalling the Application and ceasing to access the Service.
                                        </Trans>
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>12. Governing Law and Dispute Resolution</Trans>
                                    </h2>
                                    
                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>12.1 Governing Law</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            These Terms shall be governed by and construed in accordance with the laws of Austria, without regard to its conflict of law provisions.
                                        </Trans>
                                    </p>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>12.2 Dispute Resolution</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            Any disputes arising from or relating to these Terms or the Service shall be resolved through:
                                        </Trans>
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <Trans>First, good-faith negotiation between the parties</Trans>
                                        </li>
                                        <li>
                                            <Trans>If negotiation fails, binding arbitration in accordance with Austrian law</Trans>
                                        </li>
                                        <li>
                                            <Trans>The arbitration shall be conducted in English in Vienna, Austria</Trans>
                                        </li>
                                    </ul>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>12.3 Class Action Waiver</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.
                                        </Trans>
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>13. General Provisions</Trans>
                                    </h2>
                                    
                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>13.1 Entire Agreement</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            These Terms, together with our Privacy Policy and any other legal notices published by us, constitute the entire agreement between you and Budgie concerning the Service.
                                        </Trans>
                                    </p>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>13.2 Severability</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that the remaining Terms remain in full force and effect.
                                        </Trans>
                                    </p>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>13.3 Waiver</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any other term, and our failure to assert any right or provision under these Terms shall not constitute a waiver of such right or provision.
                                        </Trans>
                                    </p>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>13.4 Assignment</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            You may not assign or transfer these Terms or your rights hereunder, in whole or in part, without our prior written consent. We may assign these Terms at any time without notice.
                                        </Trans>
                                    </p>

                                    <h3 className="text-xl font-semibold mb-3 mt-6">
                                        <Trans>13.5 Force Majeure</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            We shall not be liable for any failure to perform our obligations where such failure results from circumstances beyond our reasonable control, including but not limited to acts of God, war, riot, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemics, or strikes.
                                        </Trans>
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-4">
                                        <Trans>14. Contact Information</Trans>
                                    </h2>
                                    <p>
                                        <Trans>
                                            If you have any questions about these Terms, please contact us at:
                                        </Trans>
                                    </p>
                                    <div className="mt-4 p-4 bg-muted rounded-lg">
                                        <p className="font-semibold">
                                            <Trans>Budgie</Trans>
                                        </p>
                                        <p>
                                            <Trans>Email: legal@budgie.at</Trans>
                                        </p>
                                        <p>
                                            <Trans>Website: https://budgie.at</Trans>
                                        </p>
                                    </div>
                                </section>

                                <section className="mt-8 p-6 bg-muted/50 rounded-lg border border-border">
                                    <h3 className="text-lg font-semibold mb-3">
                                        <Trans>Acknowledgment</Trans>
                                    </h3>
                                    <p>
                                        <Trans>
                                            BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.
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
