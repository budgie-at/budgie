import { DebtSectionContent } from './debt-section-content';
import { DebtSectionVisual } from './debt-section-visual';

export const DebtSection = () => (
    <section className="w-full py-20 md:py-32 bg-muted/30">
        <div className="container px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <DebtSectionVisual />
                <DebtSectionContent />
            </div>
        </div>
    </section>
);
