const getPageInfo = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { limit, offset };
};

const formatResponse = (success, data = null, message = null, error = null) => {
  return {
    success,
    ...(data && { data }),
    ...(message && { message }),
    ...(error && { error }),
  };
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

module.exports = {
  getPageInfo,
  formatResponse,
  validateEmail,
  validateDate,
};
