import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { adminUser, signedInAs } from '../../../testing/auth-fixtures.ts';
import {
  askSettings,
  withProvider,
} from '../../../testing/settings-fixtures.ts';
import { AnswerProviderSettings } from './answer-provider-settings.tsx';

function renderSettings(routes: Parameters<typeof signedInAs>[1]) {
  const fetchMock = signedInAs(adminUser, routes);
  render(<AnswerProviderSettings />);
  return fetchMock;
}

function saveButton() {
  return screen.getByRole('button', { name: 'Save' });
}

describe('AnswerProviderSettings', () => {
  it('shows the current provider', async () => {
    renderSettings({
      'GET /api/ask/settings': { status: 200, body: withProvider('gemini') },
    });

    expect(screen.getByRole('status')).toHaveTextContent('Loading settings…');
    expect(await screen.findByRole('radio', { name: 'Gemini' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'OpenAI' })).not.toBeChecked();
  });

  it("can't pick a provider with no API key", async () => {
    renderSettings({
      'GET /api/ask/settings': {
        status: 200,
        body: {
          ...askSettings,
          providers: [
            { id: 'openai', label: 'OpenAI', available: true },
            { id: 'gemini', label: 'Gemini', available: false },
          ],
        },
      },
    });

    const gemini = await screen.findByRole('radio', { name: 'Gemini' });
    expect(gemini).toBeDisabled();
    expect(gemini).toHaveAccessibleDescription('Needs an API key');
  });

  it('only saves once something changed', async () => {
    renderSettings({
      'GET /api/ask/settings': { status: 200, body: askSettings },
    });

    await userEvent.click(await screen.findByRole('radio', { name: 'Gemini' }));
    expect(saveButton()).toBeEnabled();

    await userEvent.click(screen.getByRole('radio', { name: 'OpenAI' }));
    expect(saveButton()).toBeDisabled();
  });

  it('saves the new provider', async () => {
    const fetchMock = renderSettings({
      'GET /api/ask/settings': { status: 200, body: askSettings },
      'PATCH /api/ask/settings': { status: 200, body: withProvider('gemini') },
    });

    await userEvent.click(await screen.findByRole('radio', { name: 'Gemini' }));
    await userEvent.click(saveButton());

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Answers now come from Gemini.',
    );
    expect(saveButton()).toBeDisabled();
    const [, init] = fetchMock.mock.calls[1];
    expect(JSON.parse(init?.body as string)).toEqual({
      answer_provider: 'gemini',
    });
  });

  it("shows the API's reason when it refuses", async () => {
    renderSettings({
      'GET /api/ask/settings': { status: 200, body: askSettings },
      'PATCH /api/ask/settings': {
        status: 422,
        body: { detail: 'Gemini has no API key on the server.' },
      },
    });

    await userEvent.click(await screen.findByRole('radio', { name: 'Gemini' }));
    await userEvent.click(saveButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Gemini has no API key on the server.',
    );
    // Still picked, so they can try again
    expect(screen.getByRole('radio', { name: 'Gemini' })).toBeChecked();
  });

  it('shows a general error for anything else', async () => {
    renderSettings({
      'GET /api/ask/settings': { status: 200, body: askSettings },
      'PATCH /api/ask/settings': { status: 500, body: { detail: 'Boom' } },
    });

    await userEvent.click(await screen.findByRole('radio', { name: 'Gemini' }));
    await userEvent.click(saveButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't save your settings. Try again.",
    );
  });

  it('can retry when loading fails', async () => {
    let calls = 0;
    renderSettings({
      'GET /api/ask/settings': () => {
        calls += 1;
        return calls === 1
          ? { status: 500, body: { detail: 'Boom' } }
          : { status: 200, body: askSettings };
      },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't load the settings.",
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('radio', { name: 'OpenAI' })).toBeChecked();
  });
});
