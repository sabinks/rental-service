import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { StripeError } from '@stripe/stripe-js';
import apiClient from './api';
interface ServerResponse {
    error?: string;
    status?: string;
    clientSecret?: string;
}
export default function CheckoutForm({ amount, currency }: { amount: string, currency: string }) {
    const stripe = useStripe();
    const elements = useElements();

    const [errorMessage, setErrorMessage] = useState<string>();
    const [loading, setLoading] = useState(false);


    const handleError = (error: Error | StripeError) => {
        setLoading(false);
        setErrorMessage(error.message);
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!stripe) {
            return;
        }
        setLoading(true);
        if (!elements) {
            handleError(new Error("Elements is not loaded"));
            return;
        }
        const { error: submitError } = await elements.submit();
        if (submitError) {
            handleError(submitError);
            return;
        }
        const { error, confirmationToken } = await stripe.createConfirmationToken({
            elements,
            params: {
                shipping: {
                    name: 'Jenny Rosen',
                    address: {
                        line1: '1234 Main Street',
                        line2: '',
                        city: 'San Francisco',
                        state: 'CA',
                        country: 'US',
                        postal_code: '94111',
                    },
                }
            }
        });

        if (error) {
            // This point is only reached if there's an immediate error when
            // creating the ConfirmationToken. Show the error to your customer (for example, payment details incomplete)
            handleError(error);
            return;
        }

        // Create the PaymentIntent
        const res = await apiClient.post("/stripe/create-confirm-intent", {
            amount: amount,
            currency: currency,
            confirmationTokenId: confirmationToken.id,
            paymentId: '679fd4a684501cb85732739b'
        })
        handleServerResponse(res)

    };


    const handleServerResponse = async (response: ServerResponse) => {
        if (response.error) {
            handleError(new Error(response.error));
        } else if (response.status === "requires_action") {
            if (!stripe) {
                handleError(new Error("Stripe is not loaded"));
                return;
            }
            if (!response.clientSecret) {
                handleError(new Error("Client secret is missing"));
                return;
            }
            const { error } = await stripe.handleNextAction({
                clientSecret: response.clientSecret
            });

            if (error) {
                console.log(error);

            } else {
                console.log("Success", response);
            }
        } else {
            console.log("Success", response);
        }
    }
    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            <button type="submit" disabled={!stripe || loading}>
                Pay ${currency} ${amount}
            </button>
            {errorMessage && <div>{errorMessage}</div>}
        </form>
    );
}