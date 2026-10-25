import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './utils/prisma.js';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 TrustVault Server running securely on port ${env.PORT} in [${env.NODE_ENV}] mode`);
  logger.info(`🔒 CORS Origin allowed: ${env.CLIENT_URL}`);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
