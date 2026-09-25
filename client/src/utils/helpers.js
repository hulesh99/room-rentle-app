export const getInitials = (name = '') => {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]);
  return (parts.slice(0, 2).join('') || '?').toUpperCase();
};

export const dashboardPath = (role) =>
  role === 'OWNER' ? '/owner/dashboard' : '/renter/dashboard';

export const getFirstName = (name = '') => String(name).trim().split(/\s+/)[0] || '';
