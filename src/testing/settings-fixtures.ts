import type { AskSettings } from '../features/settings/types.ts';

// OpenAI picked, both have a key.
export const askSettings: AskSettings = {
  answer_provider: 'openai',
  providers: [
    { id: 'openai', label: 'OpenAI', available: true },
    { id: 'gemini', label: 'Gemini', available: true },
  ],
};

export function withProvider(
  answerProvider: string,
  settings: AskSettings = askSettings,
): AskSettings {
  return { ...settings, answer_provider: answerProvider };
}
