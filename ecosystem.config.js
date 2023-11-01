module.exports = {
  apps: [{
    name: "backend",
    script: "./server.js",
    env_production: {
      NODE_ENV: "production",
      PORT: "8000",
      MONGODB_URL: "mongodb://localhost:27017/EDeliveryProductCleanDB2",
      ACTIVITY_MONGODB_URL: "mongodb://localhost:27017/activity_log"
    },
    env_development: {
      NODE_ENV: "development",
      PORT: "8000",
      MONGODB_URL: "mongodb://localhost:27017/EDeliveryProductCleanDB2",
      ACTIVITY_MONGODB_URL: "mongodb://localhost:27017/activity_log"
    }
  }]
}