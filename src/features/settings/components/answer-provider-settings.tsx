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

// Who writes the answers in Chat. Works in the Settings panel or on a page.
export function AnswerProviderSettings() {
  const headingId = useId();
  const [settings, setSettings] = useState<AskSettings | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [choice, setChoice] = useState('');
  const [save, setSave] = useState<Save>({ state: 'idle' });

  // Loads on open, and again when Retry clears loadFailed
  useEffect(() => {
    if (loadFailed) return;
    let cancelled = false;
    getAskSettings().then(
      (loaded) => {
        if (cancelled) return;
        setSettings(loaded);
        setChoice(loaded.answer_provider);
      },
      () => {
        if (!cancelled) setLoadFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [loadFailed]);

  async function handleSave() {
    setSave({ state: 'saving' });
    try {
      const saved = await updateAskSettings(choice);
      setSettings(saved);
      setChoice(saved.answer_provider);
      const provider = saved.providers.find(
        (p) => p.id === saved.answer_provider,
      );
      setSave({ state: 'saved', label: provider?.label ?? choice });
    } catch (error) {
      // "Gemini has no API key on the server."
      const message =
        error instanceof ApiError && error.status === 422
          ? error.message
          : "Couldn't save. Try again.";
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

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div>
        <h3 id={headingId} className="text-sm font-semibold text-ink-strong">
          Answers
        </h3>
        <p className="text-[13px] text-ink-soft">
          Who writes the answers in Chat. Search always uses OpenAI.
        </p>
      </div>

      <RadioGroup
        name="answer-provider"
        aria-labelledby={headingId}
        orientation="vertical"
        value={choice}
        onValueChange={(value) => {
          setChoice(value);
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
                  No API key on the server
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
          onClick={handleSave}
          disabled={saving || choice === settings.answer_provider}
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
