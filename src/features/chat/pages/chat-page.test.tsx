import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { paths } from '../../../common/config/paths.ts';
import {
  askAnswer,
  history,
  makeCitation,
  notFoundAnswer,
  savedAnswer,
} from '../../../testing/chat-fixtures.ts';
import { employeeUser, signedInAs } from '../../../testing/auth-fixtures.ts';
import { fileResponse, headersOf } from '../../../testing/mock-api.ts';
import { PageShell } from '../../../testing/page-shell.tsx';
import { renderWithRouter } from '../../../testing/render-with-router.tsx';
import type { AskAnswer } from '../types.ts';
import { chatRoutes } from '../chat-routes.tsx';

// jsdom can't draw a PDF
vi.mock('@radixp0int/ai-chat-kit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@radixp0int/ai-chat-kit')>()),
  DocumentPreview: (await import('../../../testing/fake-document-preview.tsx'))
    .FakeDocumentPreview,
}));
// Sets up pdf.js for the real preview, not needed here
vi.mock('../../../common/lib/pdf-worker.ts', () => ({}));

const unavailable = "Chat couldn't answer right now. Try again in a moment.";
const question = 'How much leave do I get?';

// The history list is empty unless a test says otherwise
function renderChat(
  routes: Parameters<typeof signedInAs>[1],
  path: string = paths.chat,
) {
  const fetchMock = signedInAs(employeeUser, {
    'GET /api/ask/history': { status: 200, body: [] },
    ...routes,
  });
  const router = renderWithRouter(
    [
      {
        element: <PageShell />,
        children: [{ path: paths.chat, children: chatRoutes }],
      },
    ],
    path,
  );
  return { fetchMock, router };
}

function historyList() {
  return screen.findByRole('list', { name: 'Recent questions' });
}

function askCalls(fetchMock: ReturnType<typeof signedInAs>) {
  return fetchMock.mock.calls.filter(([url]) => String(url) === '/api/ask');
}

function questionBox() {
  return screen.getByRole('textbox', { name: 'Message DocumentsAI' });
}

async function ask(text: string) {
  await userEvent.type(questionBox(), text);
  await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
}

describe('ChatPage', () => {
  it('starts with a greeting and the question box', () => {
    renderChat({});

    expect(
      screen.getByRole('heading', { level: 1, name: /your documents/ }),
    ).toBeInTheDocument();
    expect(questionBox()).toBeInTheDocument();
  });

  it('shows the answer with links to its sources', async () => {
    const { fetchMock } = renderChat({
      'POST /api/ask': { status: 200, body: askAnswer },
    });

    await ask(question);

    expect(await screen.findByText(/You get 20 days/)).toBeInTheDocument();
    expect(screen.getByText(question)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open reference 1' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open reference 2' }),
    ).toBeInTheDocument();
    const [, init] = askCalls(fetchMock)[0];
    expect(JSON.parse(init?.body as string)).toEqual({ question });
  });

  it('shows that chat is searching while it waits for an answer', async () => {
    let reply: (body: AskAnswer) => void = () => {};
    renderChat({
      'POST /api/ask': () =>
        new Promise((resolve) => {
          reply = (body) => resolve({ status: 200, body });
        }),
    });

    await ask(question);

    expect(
      await screen.findByText('Running document search…'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Stop response' }),
    ).toBeInTheDocument();

    reply(askAnswer);
    expect(await screen.findByText(/You get 20 days/)).toBeInTheDocument();
    expect(screen.queryByText('Running document search…')).toBeNull();
  });

  it('shows the excerpt and page when you open a source', async () => {
    renderChat({ 'POST /api/ask': { status: 200, body: askAnswer } });
    await ask(question);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Open reference 1' }),
    );

    const panel = screen.getByLabelText('Reference 1: Employee Handbook');
    expect(
      within(panel).getByText('Employees get 20 days of paid leave per year.'),
    ).toBeInTheDocument();
    // The pop-out dialog repeats the label, so there are two
    expect(within(panel).getAllByText('Page 3')[0]).toBeInTheDocument();
  });

  it('shows the section for a Word document', async () => {
    renderChat({ 'POST /api/ask': { status: 200, body: askAnswer } });
    await ask(question);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Open reference 2' }),
    );

    const panel = screen.getByLabelText('Reference 2: Leave Policy');
    expect(within(panel).getAllByText('Carry over')[0]).toBeInTheDocument();
  });

  it('shows "not found" with no citations', async () => {
    renderChat({ 'POST /api/ask': { status: 200, body: notFoundAnswer } });

    await ask('What is the wifi password?');

    expect(
      await screen.findByText("I couldn't find this in the documents"),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Open reference/ })).toBeNull();
  });

  it('explains when chat is unavailable and lets you retry', async () => {
    let calls = 0;
    const { fetchMock } = renderChat({
      'POST /api/ask': () => {
        calls += 1;
        return calls === 1
          ? {
              status: 502,
              body: { detail: 'The answer service is unavailable.' },
            }
          : { status: 200, body: askAnswer };
      },
    });

    await ask(question);

    expect(await screen.findByRole('alert')).toHaveTextContent(unavailable);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText(/You get 20 days/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(askCalls(fetchMock)).toHaveLength(2);
    // Retrying keeps a single copy of the question in the chat.
    expect(screen.getAllByText(question)).toHaveLength(1);
  });

  it("says so when the server can't be reached", async () => {
    // No route, so fetch fails like when the API is down
    renderChat({});

    await ask(question);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not reach the server.',
    );
  });

  it('shows a general error for anything else', async () => {
    renderChat({ 'POST /api/ask': { status: 500, body: { detail: 'Boom' } } });

    await ask(question);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't get an answer. Try again.",
    );
  });

  it("doesn't send a blank question", async () => {
    const { fetchMock } = renderChat({});

    await userEvent.type(questionBox(), '   ');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    await userEvent.type(questionBox(), '{Enter}');

    expect(askCalls(fetchMock)).toHaveLength(0);
    expect(
      screen.getByRole('heading', { level: 1, name: /your documents/ }),
    ).toBeInTheDocument();
  });
});

describe('ChatPage history', () => {
  it('lists your recent questions, newest first', async () => {
    renderChat({ 'GET /api/ask/history': { status: 200, body: history } });

    const rows = within(await historyList()).getAllByRole('link');
    expect(rows[0]).toHaveTextContent('Can I work from home?');
    expect(rows[1]).toHaveTextContent('When is payday?');
  });

  it('says when there are no questions yet', async () => {
    renderChat({});

    expect(
      await screen.findByText('Questions you ask show up here.'),
    ).toBeInTheDocument();
  });

  it('shows an error with Retry when the list fails', async () => {
    let calls = 0;
    renderChat({
      'GET /api/ask/history': () => {
        calls += 1;
        return calls === 1
          ? { status: 500, body: { detail: 'Boom' } }
          : { status: 200, body: history };
      },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't load your questions.",
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await historyList()).toHaveTextContent('Can I work from home?');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the saved answer when you pick a question', async () => {
    const { router } = renderChat({
      'GET /api/ask/history': { status: 200, body: history },
      'GET /api/ask/5': { status: 200, body: savedAnswer },
    });

    await userEvent.click(
      within(await historyList()).getByRole('link', {
        name: /Can I work from home/,
      }),
    );

    expect(
      await screen.findByText(/up to two days a week/),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/chat/5');
    // The question bubble, plus the row in the list
    expect(screen.getAllByText('Can I work from home?')).toHaveLength(2);
    expect(
      within(await historyList()).getByRole('link', {
        name: /Can I work from home/,
      }),
    ).toHaveAttribute('aria-current', 'page');

    await userEvent.click(
      screen.getByRole('button', { name: 'Open reference 1' }),
    );
    expect(
      screen.getByLabelText('Reference 1: Remote Work Policy'),
    ).toBeInTheDocument();
  });

  it('opens a saved answer from its address, so a reload keeps it', async () => {
    renderChat(
      { 'GET /api/ask/5': { status: 200, body: savedAnswer } },
      '/chat/5',
    );

    expect(screen.getByText('Loading this answer…')).toBeInTheDocument();
    expect(
      await screen.findByText(/up to two days a week/),
    ).toBeInTheDocument();
    expect(screen.getByText('Can I work from home?')).toBeInTheDocument();
  });

  it("says when the answer isn't in your history", async () => {
    renderChat(
      {
        'GET /api/ask/99': {
          status: 404,
          body: { detail: 'Answer not found.' },
        },
      },
      '/chat/99',
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "This answer isn't in your history.",
    );
  });

  it('keeps asking after a saved answer', async () => {
    renderChat(
      {
        'GET /api/ask/5': { status: 200, body: savedAnswer },
        'POST /api/ask': { status: 200, body: askAnswer },
      },
      '/chat/5',
    );
    await screen.findByText(/up to two days a week/);

    await ask(question);

    expect(await screen.findByText(/You get 20 days/)).toBeInTheDocument();
    expect(screen.getByText(/up to two days a week/)).toBeInTheDocument();
  });

  it('shows a new answer in the list without a reload', async () => {
    let asked = false;
    renderChat({
      'GET /api/ask/history': () => ({
        status: 200,
        body: asked
          ? [
              { id: 7, question, created_at: '2026-11-16T15:30:00Z' },
              ...history,
            ]
          : history,
      }),
      'POST /api/ask': () => {
        asked = true;
        return { status: 200, body: askAnswer };
      },
    });
    await historyList();

    await ask(question);

    await screen.findByText(/You get 20 days/);
    const newest = await within(await historyList()).findByRole('link', {
      name: new RegExp(question),
    });
    expect(newest).toHaveAttribute('href', '/chat/7');
  });

  it('New chat clears a conversation on /chat too', async () => {
    const { router } = renderChat({
      'POST /api/ask': { status: 200, body: askAnswer },
    });
    await ask(question);
    await screen.findByText(/You get 20 days/);

    await userEvent.click(screen.getByRole('button', { name: 'New chat' }));

    expect(router.state.location.pathname).toBe('/chat');
    expect(
      await screen.findByRole('heading', { level: 1, name: /your documents/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/You get 20 days/)).toBeNull();
  });

  it('New chat leaves a saved answer for an empty chat', async () => {
    const { router } = renderChat(
      { 'GET /api/ask/5': { status: 200, body: savedAnswer } },
      '/chat/5',
    );
    await screen.findByText(/up to two days a week/);

    await userEvent.click(screen.getByRole('button', { name: 'New chat' }));

    expect(router.state.location.pathname).toBe('/chat');
    expect(
      await screen.findByRole('heading', { level: 1, name: /your documents/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/up to two days a week/)).toBeNull();
  });
});

describe('ChatPage original file', () => {
  async function openOriginal() {
    await userEvent.click(
      await screen.findByRole('button', { name: 'Open reference 1' }),
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Original' }));
  }

  it('fetches the cited file with your token and shows it', async () => {
    const { fetchMock } = renderChat({
      'POST /api/ask': { status: 200, body: askAnswer },
      'GET /api/documents/1/file': () =>
        fileResponse('%PDF-1.7', 'application/pdf'),
    });
    await ask(question);

    await openOriginal();

    expect(
      await screen.findByRole('group', {
        name: 'Original document: Employee Handbook',
      }),
    ).toHaveTextContent('pdf preview of application/pdf');
    const call = fetchMock.mock.calls.findIndex(
      ([url]) => String(url) === '/api/documents/1/file',
    );
    expect(headersOf(fetchMock, call).Authorization).toBe(
      'Bearer access-token',
    );
  });

  it('shows only the excerpt for a deleted document', async () => {
    renderChat({
      'POST /api/ask': {
        status: 200,
        body: {
          ...askAnswer,
          answer: 'You get 20 days of paid leave [1].',
          citations: [makeCitation({ chunk_id: null, document_id: null })],
        },
      },
    });
    await ask(question);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Open reference 1' }),
    );

    const panel = screen.getByLabelText('Reference 1: Employee Handbook');
    expect(
      within(panel).getByText('Employees get 20 days of paid leave per year.'),
    ).toBeInTheDocument();
    expect(within(panel).queryByRole('tab', { name: 'Original' })).toBeNull();
  });

  it("explains when the file can't be found", async () => {
    renderChat({
      'POST /api/ask': { status: 200, body: askAnswer },
      'GET /api/documents/1/file': {
        status: 404,
        body: { detail: 'Document not found.' },
      },
    });
    await ask(question);

    await openOriginal();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "This document isn't available anymore.",
    );
  });
});
