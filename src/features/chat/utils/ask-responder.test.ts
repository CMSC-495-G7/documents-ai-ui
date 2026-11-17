import { describe, expect, it } from 'vitest';
import { ApiError } from '../../../common/api/http-client.ts';
import { errorMessage } from './ask-responder.ts';

const unavailable = "Chat couldn't answer right now. Try again in a moment.";

describe('errorMessage', () => {
  it('suggests trying again when the answer service is down', () => {
    expect(
      errorMessage(new ApiError(502, 'The answer service is unavailable.')),
    ).toBe(unavailable);
  });

  it('says the same when the dev proxy sends a bare 502', () => {
    // No JSON body, so the message is just the status text
    expect(errorMessage(new ApiError(502, 'Bad Gateway'))).toBe(unavailable);
  });

  it("says so when the server can't be reached", () => {
    const error = new ApiError(0, 'Could not reach the server.');
    expect(errorMessage(error)).toBe('Could not reach the server.');
  });

  it('hides anything else behind a general message', () => {
    expect(errorMessage(new ApiError(500, 'Boom'))).toBe(
      "Couldn't get an answer. Try again.",
    );
    expect(errorMessage(new Error('Boom'))).toBe(
      "Couldn't get an answer. Try again.",
    );
  });
});
