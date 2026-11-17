import { describe, expect, it } from 'vitest';
import { notFoundAnswer, savedAnswer } from '../../../testing/chat-fixtures.ts';
import { savedTurn } from './saved-turn.ts';
import { toSources } from './to-sources.ts';

describe('savedTurn', () => {
  it('makes the question bubble and the answer bubble', () => {
    const [question, answer] = savedTurn(savedAnswer);

    expect(question).toMatchObject({
      role: 'user',
      content: 'Can I work from home?',
    });
    expect(answer).toMatchObject({
      role: 'assistant',
      content: 'Yes, up to two days a week [1].',
      sources: toSources(savedAnswer.citations),
    });
  });

  // The kit numbers its own messages 1, 2, 3...
  it("uses negative IDs that don't clash", () => {
    const [question, answer] = savedTurn(savedAnswer);

    expect(question.id).toBeLessThan(0);
    expect(answer.id).toBeLessThan(0);
    expect(question.id).not.toBe(answer.id);
  });

  it('gives each saved answer its own IDs', () => {
    const ids = [...savedTurn(savedAnswer), ...savedTurn(notFoundAnswer)].map(
      (message) => message.id,
    );

    expect(new Set(ids).size).toBe(4);
  });
});
