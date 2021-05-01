module.exports = ({ env }) => ({
  defaultConnection: "default",
  connections: {
    default: {
      connector: "bookshelf",
      settings: {
        client: "postgres",
        host: env("DATABASE_HOST", "localhost"),
        port: env.int("DATABASE_PORT", 5111),
        database: env("DATABASE_NAME", "strafeek"),
        username: env("DATABASE_USERNAME", "strafeek"),
        password: env("DATABASE_PASSWORD", "strafeek"),
        ssl: env.bool("DATABASE_SSL", false),
        rejectUnauthorized: false
      },
      options: {} ,
    },
  },
});
