import amqp from 'amqplib';
import 'dotenv/config';

const RABBITMQ_URL = process.env.RABBITMQ_URL;

async function sendPaymentRequest(paymentData) {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        const queue = "paymentQueue";
        await channel.assertQueue(queue, { durable: true });

        channel.sendToQueue(queue, Buffer.from(JSON.stringify(paymentData)), { persistent: true });

        console.log("Payment Request Sent:", paymentData);

        setTimeout(() => {
            connection.close();
        }, 500);
    } catch (err) {
        console.error("Error Sending Payment Request:", err);
    }
}

export { sendPaymentRequest };