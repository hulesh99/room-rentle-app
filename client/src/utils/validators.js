export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

export const isValidPassword = (password) =>
  typeof password === 'string' && password.length >= 6;

export const isValidName = (name) => typeof name === 'string' && name.trim().length >= 2;

export const isValidPhone = (phone) => /^(\+91[\s-]?)?[6-9]\d{9}$/.test(String(phone || ''));

export const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!isValidEmail(email)) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
};

export const validateRegister = ({ name, email, password, role }) => {
  const errors = {};
  if (!isValidName(name)) errors.name = 'Name must be at least 2 characters';
  if (!isValidEmail(email)) errors.email = 'Enter a valid email address';
  if (!isValidPassword(password)) errors.password = 'Password must be at least 6 characters';
  if (!['OWNER', 'RENTER'].includes(role)) errors.role = 'Select an account type';
  return errors;
};
