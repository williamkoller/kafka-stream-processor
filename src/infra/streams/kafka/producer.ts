import { Partitioners } from 'kafkajs';
import { kafka } from './index';
import Logger from '../../log';

export const producer = async () => {
  const topic = process.env.KAFKA_TOPIC;
  if (!topic) {
    throw new Error('The KAFKA_TOPIC environment variable is not defined.');
  }

  try {
    const producer = kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
      allowAutoTopicCreation: false,
      transactionTimeout: 30000,
    });

    await producer.connect();
    Logger.info('Kafka producer successfully connected.');

    return producer;
  } catch (error) {
    Logger.error('Error connecting to Kafka producer:', error);
    throw error;
  }
};

producer().catch((error) => {
  Logger.error('Error initializing Kafka producer:', error);
});
