import { Trans } from '@lingui/react/macro';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '../../../ui/button';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { Motion } from '../motion/motion';

interface Props {
    readonly onClose: () => void;
    readonly lang: string;
}

const exitProps = { opacity: 0, y: -20 };
const initialProps = { opacity: 0, y: -20 };

export const MobileMenu = ({ onClose, lang }: Props) => (
    <Motion
        className="md:hidden absolute top-16 inset-x-0 bg-background/95 backdrop-blur-lg border-b"
        exit={exitProps}
        initial={initialProps}
    >
        <div className="container py-4 flex flex-col gap-4">
            <Link className="py-2 text-sm font-medium" href={`/${lang}/features`} onClick={onClose}>
                <Trans>Features</Trans>
            </Link>

            <Link className="py-2 text-sm font-medium" href={`/${lang}#testimonials`} onClick={onClose}>
                <Trans>Testimonials</Trans>
            </Link>

            <Link className="py-2 text-sm font-medium" href={`/${lang}/blog`} onClick={onClose}>
                <Trans>Blog</Trans>
            </Link>

            <Link className="py-2 text-sm font-medium" href={`/${lang}#faq`} onClick={onClose}>
                <Trans>FAQ</Trans>
            </Link>

            <div className="flex flex-col gap-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        <Trans>Language</Trans>
                    </span>
                    <LanguageSwitcher />
                </div>

                <Button asChild className="rounded-full">
                    <Link href={`/${lang}#waitlist`} onClick={onClose}>
                        <Trans>Join Waitlist</Trans>
                        <ChevronRight className="ml-1 size-4" />
                    </Link>
                </Button>
            </div>
        </div>
    </Motion>
);
