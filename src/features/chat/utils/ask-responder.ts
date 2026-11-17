import type { Responder, ToolCall } from '@radixp0int/ai-chat-kit/chat';
import { askQuestion } from '../api/ask-question.ts';
import { toSources } from './to-sources.ts';
import { ApiError } from '../../../common/api/http-client.ts';

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 502)
      return "Chat couldn't answer right now. Try again in a moment.";
    if (error.status === 0) return error.message;
  }
  return "Couldn't get an answer. Try again.";
}

function search(status: ToolCall['status']) {
  return {
    type: 'tool',
    toolCall: { toolCallId: 'search', name: 'document search', status },
  } as const;
}

// Let the chat stop waiting as soon as the user clicks Stop.
function untilStopped<T>(promise: Promise<T>, signal: AbortSignal) {
  return new Promise<T>((resolve, reject) => {
    const stop = () => reject(new DOMException('Aborted', 'AbortError'));
    if (signal.aborted) return stop();
    signal.addEventListener('abort', stop, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', stop));
  });
}

// The API sends the whole answer at once. Send it to the chat as events.
export const askResponder: Responder = async function* (question, signal) {
  yield search('started');

  let reply;
  try {
    reply = await untilStopped(askQuestion(question), signal);
  } catch (error) {
    // Let useChat handle Stop without showing an error.
    if (signal.aborted) throw error;
    yield search('failed');
    yield {
      type: 'error',
      fault: { message: errorMessage(error), source: 'ask' },
      recoverable: false,
    };
    return;
  }

  yield search('completed');
  // Send the sources first so the chat can turn [1] into a source button.
  if (reply.citations.length > 0) {
    yield { type: 'sources', sources: toSources(reply.citations) };
  }
  yield { type: 'content', delta: reply.answer };
  yield { type: 'done', model: reply.model || undefined };
};
