// An error whose message is safe to show to the client, with the HTTP
// status to send. Any other error is reported with a generic message.
const httpError = (message, status = 400) =>
  Object.assign(new Error(message), { expose: true, status });

module.exports = httpError;
