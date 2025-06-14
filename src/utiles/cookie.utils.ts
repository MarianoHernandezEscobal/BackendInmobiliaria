import { FastifyReply } from 'fastify';

export const setCookie = (
  reply: FastifyReply,
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'None';
  } = {}
): void => {
  reply.setCookie(name, value, {
    httpOnly: options.httpOnly ?? true,
    maxAge: options.maxAge ?? 60 * 60 * 24, // 1 day in seconds
    path: options.path ?? '/',
    secure: options.secure ?? false
  });
};

export const clearCookie = (reply: FastifyReply, name: string, path: string = '/') => {
  reply.clearCookie(name, { path });
};
