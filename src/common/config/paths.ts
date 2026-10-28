// Base path of every feature. The main router mounts each feature here, and
// features use these to link to one another without importing each other.
export const paths = {
  login: '/login',
  chat: '/chat',
  ingestion: '/ingestion',
} as const
