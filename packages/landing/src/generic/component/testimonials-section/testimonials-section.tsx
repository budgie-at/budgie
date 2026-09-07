import { TestimonialsHeader } from './testimonials-header';
import { TestimonialsSlider } from './testimonials-slider';

export const TestimonialsSection = () => (
    <section className="w-full py-8 md:py-20" id="testimonials">
        <div className="container px-4 md:px-6 max-w-7xl">
            <TestimonialsHeader />
            <TestimonialsSlider />
        </div>
    </section>
);
