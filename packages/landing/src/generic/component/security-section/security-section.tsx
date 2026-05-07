import { SecuritySectionCards } from './security-section-cards';
import { SecuritySectionHeader } from './security-section-header';
import { SecuritySectionVisual } from './security-section-visual';

interface Props {
    readonly locale: string;
}

export const SecuritySection = ({ locale }: Props) => (
    <section className="w-full py-20 md:py-32 bg-muted/30" id="security">
        <div className="container px-4 md:px-6">
            <SecuritySectionHeader locale={locale} />

            <div className="grid lg:grid-cols-2 gap-8 items-center">
                <SecuritySectionCards />
                <SecuritySectionVisual />
            </div>
        </div>
    </section>
);
