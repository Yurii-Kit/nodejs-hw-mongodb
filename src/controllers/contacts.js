import {
  getAllContacts,
  getContactById,
  createContact,
  deleteContact,
  updateContact,
} from '../services/contacts.js';

import createHttpError from 'http-errors';

import { parsePaginationParams } from '../utils/parsePaginationParams.js';

import { parseSortParams } from '../utils/parseSortParams.js';

import { parseFilterParams } from '../utils/parseFilterParams.js';

export const getContactsController = async (req, res) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query);
  const filter = parseFilterParams(req.query);
  const contacts = await getAllContacts({
    page,
    perPage,
    sortBy,
    sortOrder,
    filter,
    ownerId: req.user.id,
  });
  res.status(200).json({
    status: 200,
    message: 'Successfully found contacts!',
    data: contacts,
  });
};

export const getContactByIdController = async (req, res) => {
  // console.log(req.user);

  const { contactId } = req.params;
  const contact = await getContactById(contactId);

  // Створюємо та налаштовуємо помилку
  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }
  // Перевіряємо, чи контакт належить користувачу
  if (!contact.ownerId.equals(req.user.id)) {
    throw createHttpError.Forbidden(
      'You do not have permission to access this contact',
    );
  }

  // Відповідь, якщо контакт знайдено
  res.status(200).json({
    status: 200,
    message: `Successfully found contact with id ${contactId}!`,
    data: contact,
  });
};

export const createContactsController = async (req, res) => {
  const contact = await createContact({ ...req.body, ownerId: req.user.id });
  res.status(201).json({
    status: 201,
    message: `Successfully created a contact!`,
    data: contact,
  });
};

// Контролер для видалення контакту
export const deleteContactController = async (req, res, next) => {
  const { contactId } = req.params;
  const contact = await getContactById(contactId);

  if (!contact) {
    return next(createHttpError(404, 'Contact not found'));
  }

  if (!contact.ownerId.equals(req.user.id)) {
    return next(createHttpError.Forbidden('Access denied: not contact owner'));
  }

  await deleteContact(contactId);
  res.status(204).send();
};

// Контролер для оновлення контакту
export const updateContactController = async (req, res, next) => {
  const { contactId } = req.params;
  const contact = await getContactById(contactId);

  if (!contact) {
    return next(createHttpError(404, 'Contact not found'));
  }

  if (!contact.ownerId.equals(req.user.id)) {
    return next(createHttpError.Forbidden('Access denied: not contact owner'));
  }

  const updatedContact = await updateContact(contactId, req.body);

  res.json({
    status: 200,
    message: 'Successfully patched a contact!',
    data: updatedContact,
  });
};
