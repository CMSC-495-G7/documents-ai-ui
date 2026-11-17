import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { paths } from '../../../common/config/paths.ts';
import { askAnswer, notFoundAnswer } from '../../../testing/chat-fixtures.ts';
import { employeeUser, signedInAs } from '../../../testing/auth-fixtures.ts';
import { renderWithRouter } from '../../../testing/render-with-router.tsx';
import type { AskAnswer } from '../types.ts';
import { chatRoutes } from '../chat-routes.tsx';

const unavailable = "Chat couldn't answer right now. Try again in a moment.";
const question = 'How much leave do I get?';

function renderChat(routes: Parameters<typeof signedInAs>[1]) {
  const fetchMock = signedInAs(employeeUser, routes);
  renderWithRouter([{ path: paths.chat, children: chatRoutes }], paths.chat);
  return fetchMock;
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
    const fetchMock = renderChat({
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
    expect(within(panel).getByText('Page 3')).toBeInTheDocument();
  });

  it('shows the section for a Word document', async () => {
    renderChat({ 'POST /api/ask': { status: 200, body: askAnswer } });
    await ask(question);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Open reference 2' }),
    );

    const panel = screen.getByLabelText('Reference 2: Leave Policy');
    expect(within(panel).getByText('Carry over')).toBeInTheDocument();
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
    const fetchMock = renderChat({
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
    const fetchMock = renderChat({});

    await userEvent.type(questionBox(), '   ');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    await userEvent.type(questionBox(), '{Enter}');

    expect(askCalls(fetchMock)).toHaveLength(0);
    expect(
      screen.getByRole('heading', { level: 1, name: /your documents/ }),
    ).toBeInTheDocument();
  });
});
