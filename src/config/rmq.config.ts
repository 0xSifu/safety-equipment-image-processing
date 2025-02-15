import { registerAs } from '@nestjs/config';

export default registerAs(
  'rmq',
  (): Record<string, any> => ({
    uri: process.env.RABBITMQ_URL,
    files: process.env.RABBITMQ_FILES_QUEUE,
    auth: process.env.RABBITMQ_AUTH_QUEUE,
    tag: process.env.RABBITMQ_TAG_QUEUE,
    product: process.env.RABBITMQ_PRODUCT_QUEUE,
    batch: process.env.RABBITMQ_BATCH_QUEUE,
    transaction: process.env.RABBITMQ_TRANSACTION_QUEUE
  }),
);
