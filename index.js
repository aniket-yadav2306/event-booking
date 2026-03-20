require('dotenv').config();

const { initDB } = require('./src/config/db');

(async () => {
  await initDB(); // VERY IMPORTANT

  // start your server AFTER DB is ready
  const app = require('./src/app');

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();