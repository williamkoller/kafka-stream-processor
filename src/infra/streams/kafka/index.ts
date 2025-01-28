import { Kafka, logLevel, LogEntry } from 'kafkajs';
import Logger from '../../log';

const clientId = process.env.APP_NAME || 'default-app';
const brokers = process.env.BOOTSTRAP_SERVER
  ? process.env.BOOTSTRAP_SERVER.split(',')
  : [];
if (!brokers.length) {
  throw new Error(
    'BOOTSTRAP_SERVER environment variable is not defined or empty.'
  );
}

const logCreator =
  (level: logLevel) =>
  ({ log }: LogEntry) => {
    const { message, ...extra } = log;
    switch (level) {
      case logLevel.ERROR:
        Logger.error(message, extra);
        break;
      case logLevel.WARN:
        Logger.warn(message, extra);
        break;
      case logLevel.INFO:
        Logger.info(message, extra);
        break;
      case logLevel.DEBUG:
        Logger.debug(message, extra);
        break;
      default:
        Logger.info(message, extra);
    }
  };

export const kafka = new Kafka({
  clientId,
  brokers,
  connectionTimeout: 3000,
  requestTimeout: 25000,
  enforceRequestTimeout: false,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
  reauthenticationThreshold: 10000,
  logLevel: logLevel.INFO,
  logCreator,
});
