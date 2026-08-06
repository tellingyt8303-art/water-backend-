require('dotenv').config();
const app = require('./src/app');
const { sequelize, connectDB } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Sync all models with database (creates tables if not exist)
  // Use { alter: true } in dev, migrations in production
  await sequelize.sync({ alter: true });
  console.log('✅ Database models synced');

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();
