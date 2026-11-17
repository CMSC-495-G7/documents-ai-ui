// Same shape as GET /api/ask/settings.
export type AnswerProvider = {
  id: string;
  label: string;
  // false when the server has no API key for it
  available: boolean;
};

export type AskSettings = {
  answer_provider: string;
  providers: AnswerProvider[];
};
