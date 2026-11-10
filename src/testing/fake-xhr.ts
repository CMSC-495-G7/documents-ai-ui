type Handler = ((event: ProgressEvent) => void) | null;

// Stands in for XMLHttpRequest in tests (setup.ts puts it in place).
// It sends through fetch, so mockApi routes work for uploads too.
// Progress goes to 50% right away and 100% when fetch answers.
export class FakeXhr {
  status = 0;
  statusText = '';
  responseText = '';
  upload: { onprogress: Handler } = { onprogress: null };
  onload: Handler = null;
  onerror: Handler = null;
  onabort: Handler = null;

  private method = 'GET';
  private url = '';
  private headers: Record<string, string> = {};

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  send(body: BodyInit | null = null) {
    this.progress(1, 2);
    fetch(this.url, { method: this.method, headers: this.headers, body }).then(
      async (response) => {
        this.progress(2, 2);
        this.status = response.status;
        this.statusText = response.statusText;
        this.responseText = await response.text();
        this.onload?.(new ProgressEvent('load'));
      },
      () => this.onerror?.(new ProgressEvent('error')),
    );
  }

  private progress(loaded: number, total: number) {
    this.upload.onprogress?.(
      new ProgressEvent('progress', { lengthComputable: true, loaded, total }),
    );
  }
}
