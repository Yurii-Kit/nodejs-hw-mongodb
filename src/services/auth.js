import createHttpError from 'http-errors';
import { UsersCollection } from '../db/models/user.js';
import bcrypt from 'bcrypt';
import { SessionsCollection } from '../db/models/session.js';
import { FIFTEEN_MINUTES, THIRTY_DAYS } from '../constants/index.js';
import { randomBytes } from 'crypto';

const generateToken = () => randomBytes(30).toString('base64');

// const createSessionData = () => ({на видалення!!!!!!!!
//   accessToken: generateToken(),
//   refreshToken: generateToken(),
//   accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
//   refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
// });

export const registerUser = async (payload) => {
  const user = await UsersCollection.findOne({ email: payload.email });
  if (user) throw createHttpError.Conflict('Email is already in use');

  const encryptedPassword = await bcrypt.hash(payload.password, 10);

  return UsersCollection.create({
    ...payload,
    password: encryptedPassword,
  });
};

export const loginUser = async (payload) => {
  const user = await UsersCollection.findOne({ email: payload.email });
  if (!user)
    throw createHttpError.Unauthorized('Email or password is inncorrect');

  const isMatch = await bcrypt.compare(payload.password, user.password);
  console.log(`Password match: ${isMatch}`);

  if (!isMatch)
    throw createHttpError.Unauthorized('Email or password is inncorrect');

  await SessionsCollection.deleteOne({ userId: user._id });

  return SessionsCollection.create({
    userId: user._id,
    accessToken: generateToken(),
    refreshToken: generateToken(),
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  });
};

export const logoutUser = async (sessionId) => {
  await SessionsCollection.deleteOne({ _id: sessionId });
};

export const refreshUsersSession = async (sessionId, refreshToken) => {
  const session = await SessionsCollection.findById(sessionId);

  if (session === null) {
    throw createHttpError.Unauthorized('Session not found');
  }
  if (session.refreshToken !== refreshToken) {
    throw createHttpError.Unauthorized('Refresh token is invalid');
  }

  if (session.refreshTokenValidUntil < new Date()) {
    throw createHttpError.Unauthorized('Refresh token expired');
  }

  await SessionsCollection.deleteOne({ _id: session._id });

  return SessionsCollection.create({
    userId: session.userId,
    accessToken: generateToken(),
    refreshToken: generateToken(),
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  });
};
