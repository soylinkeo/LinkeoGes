import { equal } from './syncModel.js';

// One authoritative snapshot; remote reads never produce writes. Requests are
// idempotent and use a revision to reject edits based on outdated information.
export class SyncEngine {
  constructor({ initial, transport, backup = () => {}, delay = 350 }) {
    this.transport = transport;
    this.backup = backup;
    this.delay = delay;
    this.listeners = new Set();
    this.confirmed = initial;
    this.view = { data: initial, status: 'loading', error: '', revision: null, lastSaved: null };
    this.callbacks = [];
    this.epoch = 0;
    this.disposed = false;
  }
  subscribe = listener => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  snapshot = () => this.view;
  emit(patch) { this.view = { ...this.view, ...patch }; this.listeners.forEach(fn => fn()); }
  set(key, update) {
    if (this.disposed || ['loading', 'error'].includes(this.view.status)) return false;
    const value = typeof update === 'function' ? update(this.view.data[key]) : update;
    if (equal(value, this.view.data[key])) return true;
    this.epoch++;
    this.emit({ data: { ...this.view.data, [key]: value }, status: 'saving', error: '' });
    this.backup(this.view.data);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.delay);
    return true;
  }
  async refresh() {
    if (this.disposed || this.reading || this.sending || !equal(this.confirmed, this.view.data)) return;
    this.reading = true;
    const token = this.readToken = Symbol();
    const epoch = this.epoch;
    try {
      const snapshot = await this.transport.read();
      if (this.disposed || epoch !== this.epoch || this.sending) return;
      this.confirmed = snapshot.data;
      this.emit({ ...snapshot, status: 'ready', error: '', lastSaved: new Date().toISOString() });
    } catch (error) {
      if (!this.disposed && epoch === this.epoch) this.emit({ status: 'error', error: error.message });
    } finally { if (this.readToken === token) this.reading = false; }
  }
  async flush() {
    if (this.disposed || this.sending || this.view.revision === null) return;
    if (equal(this.confirmed, this.view.data)) return;
    this.sending = true;
    // Keep precisely this request on transport errors, including its idempotency key.
    const request = this.request ||= {
      before: this.confirmed, after: this.view.data,
      revision: this.view.revision, requestId: crypto.randomUUID(),
    };
    this.emit({ status: 'saving', error: '' });
    try {
      const result = await this.transport.commit(request);
      if (this.disposed) return;
      const newer = !equal(request.after, this.view.data);
      // Preserve edits made while awaiting the server; the server only adds audit metadata.
      const next = newer ? { ...this.view.data, auditLogs: mergeAudit(result.data.auditLogs, request.after.auditLogs, this.view.data.auditLogs) } : result.data;
      this.confirmed = result.data;
      this.request = null;
      this.emit({ data: next, revision: result.revision, status: newer ? 'saving' : 'ready', error: '', lastSaved: new Date().toISOString() });
      if (!newer) {
        this.backup(null);
        this.callbacks.splice(0).forEach(fn => fn());
      } else this.backup(next);
    } catch (error) {
      if (!this.disposed) {
        this.callbacks = [];
        this.emit({ status: 'error', error: error.message });
        this.backup(this.view.data);
      }
    } finally {
      this.sending = false;
      if (!this.disposed && this.view.status === 'saving') this.timer = setTimeout(() => this.flush(), this.delay);
    }
  }
  afterSaved(fn) {
    if (this.view.status === 'ready') fn();
    else if (this.view.status === 'saving') this.callbacks.push(fn);
  }
  retry = () => this.request || !equal(this.confirmed, this.view.data) ? this.flush() : this.refresh();
  async reload() {
    if (this.sending) return;
    clearTimeout(this.timer);
    this.epoch++;
    this.request = null;
    this.callbacks = [];
    this.emit({ data: this.confirmed, status: 'loading' });
    await this.refresh();
  }
  dispose() { this.disposed = true; this.epoch++; this.reading = false; clearTimeout(this.timer); this.listeners.clear(); }
}

function mergeAudit(server, submitted, current) {
  const submittedMap = new Map(submitted.map(row => [row.id, row]));
  const changed = current.filter(row => !equal(row, submittedMap.get(row.id)));
  const changedIds = new Set(changed.map(row => row.id));
  return [...changed, ...server.filter(row => !changedIds.has(row.id))];
}
