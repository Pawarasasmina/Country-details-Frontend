export const formatNumber = (number) => {
  if (number === null || number === undefined) return '';
  return number.toLocaleString();
};

export const extractLanguages = (languages) => {
  if (!languages) return '';
  return Object.values(languages).join(', ');
};

export const convertTimeZone = (date, timezone) => {
  if (!date) return date;
  try {
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  } catch (error) {
    return date;
  }
};
