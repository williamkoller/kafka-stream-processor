import { randomUUID } from 'node:crypto';
import { producer } from './infra/streams/kafka/producer';
import { CompressionTypes } from 'kafkajs';
import { consumer } from './infra/streams/kafka/consumer';
import Logger from './infra/log';

const topic = process.env.KAFKA_TOPIC || 'topic-test';

const data = [
  {
    id: randomUUID(),
    name: 'John Doe',
    age: 36,
  },
  {
    id: randomUUID(),
    name: 'Jane Doe',
    age: 32,
  },
  {
    id: randomUUID(),
    name: 'Jack Doe',
    age: 34,
  },
];

async function bootstrap() {
  try {
    const prod = await producer();
    Logger.info('Producer connected successfully.');

    await prod.send({
      topic,
      compression: CompressionTypes.GZIP,
      messages: [
        {
          key: data.map((d) => d.id).join(','),
          value: JSON.stringify(data),
        },
      ],
    });
    Logger.info('Messages sent successfully.');

    await prod.disconnect();
    Logger.info('Producer disconnected successfully.');

    consumer().catch((error) => {
      Logger.error('Error in Kafka consumer:', error);
    });
  } catch (error) {
    Logger.error('Error in Kafka bootstrap process:', error);
  }
}

bootstrap();

const handleExit = async () => {
  try {
    await consumer().then((c) => {
      if (c) {
        c.disconnect();
      }

      Logger.info('Kafka consumer disconnected gracefully.');
    });
    Logger.info('Kafka consumer disconnected gracefully.');
  } catch (error) {
    Logger.error('Error during Kafka consumer disconnection:', error);
  } finally {
    process.exit();
  }
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
