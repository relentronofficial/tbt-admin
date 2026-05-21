import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import { Server } from 'socket.io';

async function socketPlugin(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  const io = new Server(fastify.server, {
    cors: {
      origin: '*', // In production, specify origins
    },
  } as any);

  fastify.decorate('io', io);

  io.on('connection', (socket) => {
    fastify.log.info(`Socket connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
      fastify.log.info(`Socket disconnected: ${socket.id}`);
    });
  });

  fastify.addHook('onClose', (instance, done) => {
    instance.io.close();
    done();
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

export default fp(socketPlugin);
