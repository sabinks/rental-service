import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe('pk_test_51BK6tmG7XkWd5N2y3vsOFqqItQbWGABYdJL5O63cd1hUSWZbszjmACDLy9WB1tgKRwLMXFrVKPZQ4Z4oLMGpMAkn00a9kSpHfV');

function App() {
    const options: {
        mode: 'payment' | 'setup',
        amount: number, currency: string, paymentMethodCreation: 'manual', layout: { type: string, defaultCollapsed: boolean, radios: boolean, spacedAccordionItems: false }, appearance: { theme: 'flat' }
    } = {
        mode: 'payment',
        amount: 10 * 100,
        currency: 'cad',
        paymentMethodCreation: 'manual',
        // Fully customizable with appearance API.
        layout: {
            type: 'accordion',
            defaultCollapsed: false,
            radios: true,
            spacedAccordionItems: false
        },
        appearance: { theme: 'flat' },
    };

    return (
        <div className="">
            <Elements stripe={stripePromise} options={options}>
                <CheckoutForm amount={"10"} currency={"cad"} />
            </Elements>
        </div>
    );
};

export default App