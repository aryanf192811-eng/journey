// apps/api/src/server.ts

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { journeyRoutes } from './routes/journeys';
import { stationRoutes } from './routes/stations';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  app.get('/health', async () => ({ ok: true }));

  await app.register(journeyRoutes);
  await app.register(stationRoutes);

  app.setErrorHandler((err, _req, reply) => {
    app.log.error(err);
    reply.code(500).send({ error: 'Internal server error' });
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
