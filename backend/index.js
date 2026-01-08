require("dotenv").config();
const { start } = require("./src/server");

async function startServer() {
  try {
    const app = await start();
    const PORT = process.env.PORT || 3001;
    
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("✗ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
