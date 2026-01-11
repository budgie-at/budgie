import { TestimonialsHeader } from './testimonials-header';
import { TestimonialsSlider } from './testimonials-slider';

export const TestimonialsSection = () => (
    <section className="w-full py-20 md:py-32 overflow-hidden" id="testimonials">
        <div className="container px-4 md:px-6">
            <TestimonialsHeader />
            <TestimonialsSlider />
        </div>
    </section>
);
