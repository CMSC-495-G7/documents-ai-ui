import {
  Button,
  FieldLabel,
  Notice,
  RadioGroup,
  RadioGroupItem,
} from '@radixp0int/ai-chat-kit';
import { useEffect, useId, useState } from 'react';
import { ApiError } from '../../../common/api/http-client.ts';
import { getAskSettings } from '../api/get-ask-settings.ts';
import { updateAskSettings } from '../api/update-ask-settings.ts';
import type { AskSettings } from '../types.ts';

type Save =
  | { state: 'idle' }
  | { state: 'saving' }
  | { state: 'saved'; label: string }
  | { state: 'error'; message: string };

export function AnswerProviderSettings() {
  const headingId = useId();
  const [settings, setSettings] = useState<AskSettings | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [draftProvider, setDraftProvider] = useState<string | null>(null);
  const [save, setSave] = useState<Save>({ state: 'idle' });

  // Load the settings when the panel opens or the user clicks Retry.
  useEffect(() => {
    if (loadFailed) return;
    let cancelled = false;
    getAskSettings().then(
      (loaded) => {
        if (cancelled) return;
        setSettings(loaded);
      },
      () => {
        if (!cancelled) setLoadFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [loadFailed]);

  async function handleSave(answerProvider: string) {
    setSave({ state: 'saving' });
    try {
      const saved = await updateAskSettings(answerProvider);
      setSettings(saved);
      setDraftProvider(null);
      const provider = saved.providers.find(
        (p) => p.id === saved.answer_provider,
      );
      setSave({
        state: 'saved',
        label: provider?.label ?? saved.answer_provider,
      });
    } catch (error) {
      // "Gemini has no API key on the server."
      const message =
        error instanceof ApiError && error.status === 422
          ? error.message
          : "Couldn't save your settings. Try again.";
      setSave({ state: 'error', message });
    }
  }

  if (loadFailed) {
    return (
      <Notice
        tone="error"
        action={{ label: 'Retry', onClick: () => setLoadFailed(false) }}
      >
        Couldn't load the settings.
      </Notice>
    );
  }
  if (!settings) {
    return (
      <p role="status" className="text-sm text-ink-soft">
        Loading settings…
      </p>
    );
  }

  const saving = save.state === 'saving';
  const selectedProvider = draftProvider ?? settings.answer_provider;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div>
        <h3 id={headingId} className="text-sm font-semibold text-ink-strong">
          Answers
        </h3>
        <p className="text-[13px] text-ink-soft">
          Choose which AI writes chat answers. OpenAI helps find relevant
          passages in your documents.
        </p>
      </div>

      <RadioGroup
        name="answer-provider"
        aria-labelledby={headingId}
        orientation="vertical"
        value={selectedProvider}
        onValueChange={(value) => {
          setDraftProvider(value);
          setSave({ state: 'idle' });
        }}
        disabled={saving}
      >
        {settings.providers.map((provider) => {
          const id = `answer-provider-${provider.id}`;
          return (
            <div key={provider.id} className="flex items-center gap-2.5">
              <RadioGroupItem
                id={id}
                value={provider.id}
                disabled={!provider.available}
                aria-describedby={provider.available ? undefined : `${id}-hint`}
              />
              <FieldLabel htmlFor={id}>{provider.label}</FieldLabel>
              {!provider.available && (
                <span id={`${id}-hint`} className="text-[13px] text-ink-soft">
                  Needs an API key
                </span>
              )}
            </div>
          );
        })}
      </RadioGroup>

      <div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleSave(selectedProvider)}
          disabled={saving || selectedProvider === settings.answer_provider}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <NoticeMessage save={save} />
    </section>
  );
}

function NoticeMessage({ save }: { save: Save }) {
  if (save.state === 'saved') {
    return <Notice tone="success">Answers now come from {save.label}.</Notice>;
  }
  if (save.state === 'error') {
    return <Notice tone="error">{save.message}</Notice>;
  }
  return null;
}
