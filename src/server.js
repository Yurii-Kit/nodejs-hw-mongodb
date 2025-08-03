import express from 'express';
import cookieParser from 'cookie-parser';
import pino from 'pino-http';
import cors from 'cors';

import { getEnvVar } from './utils/getEnvVar.js';

// Імпортуємо роутер
import contactsRouter from './routers/contacts.js';
import authRouter from './routers/auth.js';

// Імпортуємо middleware
import { errorHandler } from './middlewares/errorHendler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';

// Читаємо змінну оточення PORT
const PORT = Number(getEnvVar('PORT', '3000'));

export const setupServer = () => {
  const app = express();

  app.use(express.json());

  app.use(cookieParser());

  app.use(cors());

  app.use(
    pino({
      transport: {
        target: 'pino-pretty',
      },
    }),
  );

  app.get('/', (req, res) => {
    res.json({
      message: 'Hello world!',
    });
  });

  app.use('/auth', authRouter); // Додаємо роутер до app як middleware
  app.use('/contacts', contactsRouter); // Додаємо роутер до app як middleware

  app.use(notFoundHandler); // Middleware для обробки 404 помилок

  app.use(errorHandler); // Middleware для обробки помилок

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
