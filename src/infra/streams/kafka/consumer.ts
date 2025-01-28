import { Consumer, Kafka } from 'kafkajs';
import Logger from '../../log';
import { kafka } from './index';

const topic = process.env.KAFKA_TOPIC || 'topic-test';
const app = 'default-app';

export const consumer = async (): Promise<Consumer | undefined> => {
  const consumer = kafka.consumer({
    groupId: app,
  });

  try {
    await consumer.connect();
    Logger.info('Kafka consumer connected successfully.');

    await consumer.subscribe({ topic, fromBeginning: true });
    Logger.info(`Subscribed to topic: ${topic}`);

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (message.value) {
            const dataParse = JSON.parse(message.value.toString());
            const kafkaMessage = {
              topic,
              dataParse,
              partition,
              offset: Number(message.offset),
            };

            Logger.info(`Kafka message: ${JSON.stringify(kafkaMessage)}`);

            await consumer.commitOffsets([
              {
                topic,
                partition,
                offset: (Number(message.offset) + 1).toString(),
              },
            ]);
            Logger.info(`Offset committed: ${Number(message.offset) + 1}`);
          } else {
            Logger.warn('Received message with no value.');
          }
        } catch (error) {
          Logger.error(`Error processing message: ${error.message}`, error);
          throw error;
        }
      },
    });
    return consumer;
  } catch (error) {
    Logger.error(`Error in Kafka consumer: ${error.message}`, error);
    await consumer.disconnect();
    Logger.info('Kafka consumer disconnected due to error.');
  }

  const handleExit = async () => {
    try {
      await consumer.disconnect();
      Logger.info('Kafka consumer disconnected gracefully.');
    } catch (error) {
      Logger.error('Error during Kafka consumer disconnection:', error);
    } finally {
      process.exit();
    }
  };

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);
};

consumer().catch((error) => {
  Logger.error('Error initializing Kafka consumer:', error);
});
