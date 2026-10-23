export interface Utterance {
  speaker: string;
  text: string;
  at?: string;
}

export interface Conversation {
  id: string;
  title: string;
  summary: string;
  startTime?: string;
  utterances: Utterance[];
}

const BASE = (process.env.BEE_API_BASE ?? "http://127.0.0.1:8787").replace(/\/$/, "");
let debugEnabled = false;
let rawPayloadLogged = false;

export function configureBee(options: { debug: boolean }): void {
  debugEnabled = options.debug;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/json" };
  if (process.env.BEE_TOKEN) h.Authorization = `Bearer ${process.env.BEE_TOKEN}`;
  return h;
}

function logRawOnce(label: string, raw: unknown): void {
  if (!debugEnabled || rawPayloadLogged) return;
  rawPayloadLogged = true;
  console.error(`[bee:debug] raw ${label} payload:`);
  console.error(JSON.stringify(raw, null, 2));
}

async function get(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}/v1${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`Bee ${path} -> ${res.status} ${await res.text()}`);
  const raw: unknown = await res.json();
  logRawOnce(path, raw);
  return raw;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function firstRecord(value: unknown): Record<string, unknown> {
  return Array.isArray(value) ? record(value[0]) : {};
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === "string");
}

export function normalizeConversation(raw: unknown): Conversation {
  const root = record(raw);
  const nestedData = record(root.data);
  const c = record(
    root.conversation ?? nestedData.conversation ?? root.data ?? raw,
  );
  const transcriptValue = c.transcript;
  const transcriptObject = record(transcriptValue);
  const firstTranscription = firstRecord(c.transcriptions);
  const rawUtts =
    c.utterances ??
    transcriptObject.utterances ??
    firstTranscription.utterances ??
    (Array.isArray(transcriptValue) ? transcriptValue : []);
  const utterances = (Array.isArray(rawUtts) ? rawUtts : [])
    .map((value): Utterance => {
      const utterance = record(value);
      const speakerObject = record(utterance.speaker);
      return {
        speaker:
          firstString(
            utterance.speaker,
            utterance.speaker_name,
            utterance.speakerName,
            speakerObject.name,
          ) ?? "Unknown",
        text: String(
          utterance.text ?? utterance.content ?? utterance.transcript ?? "",
        ).trim(),
        at: firstString(
          utterance.spoken_at,
          utterance.start,
          utterance.timestamp,
          utterance.created_at,
        ),
      };
    })
    .filter((u) => u.text.length > 0);
  const id =
    c.id ??
    c.conversation_id ??
    c.conversationId ??
    c.uuid ??
    root.conversation_id;
  if (id === undefined || id === null || String(id).trim() === "") {
    throw new Error("Bee conversation payload has no recognizable ID.");
  }
  return {
    id: String(id),
    title:
      firstString(c.title, c.short_summary, c.shortSummary, c.name) ?? "",
    summary:
      firstString(
        c.summary,
        c.detailed_summary,
        c.detailedSummary,
        c.short_summary,
      ) ?? "",
    startTime: firstString(
      c.start_time,
      c.startTime,
      c.started_at,
      c.created_at,
    ),
    utterances,
  };
}

export async function listConversationIds(limit = 10): Promise<string[]> {
  const data = await get(`/conversations?limit=${limit}`);
  const container = record(data);
  const nestedData = record(container.data);
  const items = Array.isArray(data)
    ? data
    : container.conversations ??
      container.items ??
      (Array.isArray(container.data)
        ? container.data
        : nestedData.conversations ?? []);
  if (!Array.isArray(items)) {
    throw new Error("Bee conversation list has an unrecognized shape.");
  }
  return items
    .map((item) => {
      const candidate = record(item);
      return candidate.id ?? candidate.conversation_id ?? candidate.uuid;
    })
    .filter((id): id is string | number => id !== undefined && id !== null)
    .map(String);
}

export async function getConversation(id: string): Promise<Conversation> {
  return normalizeConversation(
    await get(`/conversations/${encodeURIComponent(id)}`),
  );
}

export async function watchConversations(onDone: (id: string) => Promise<void>): Promise<never> {
  const types = "update-conversation,update-conversation-summary";
  const recentlyHandled = new Map<string, number>();
  let lastEventId = "";
  let reconnectDelay = 5000;

  for (;;) {
    try {
      const res = await fetch(`${BASE}/v1/stream?types=${types}`, {
        headers: {
          ...headers(),
          Accept: "text/event-stream",
          ...(lastEventId ? { "Last-Event-ID": lastEventId } : {}),
        },
      });
      if (!res.ok || !res.body) {
        throw new Error(`stream ${res.status} ${await res.text()}`);
      }
      console.log("[bee] stream connected");
      const decoder = new TextDecoder();
      let buf = "";
      let event = "";
      let eventId = "";
      let dataLines: string[] = [];

      const dispatch = async (): Promise<void> => {
        if (dataLines.length === 0) {
          event = "";
          eventId = "";
          return;
        }
        const rawData = dataLines.join("\n");
        dataLines = [];
        let payload: unknown;
        try {
          payload = JSON.parse(rawData);
        } catch {
          event = "";
          eventId = "";
          return;
        }
        const root = record(payload);
        const nestedData = record(root.data);
        const conv = record(
          root.conversation ?? nestedData.conversation ?? root.data ?? root,
        );
        const id =
          conv.id ??
          conv.conversation_id ??
          root.conversation_id ??
          nestedData.conversation_id;
        const state = String(
          conv.state ?? conv.status ?? root.state ?? "",
        ).toUpperCase();
        const finished =
          event === "update-conversation-summary" ||
          state === "COMPLETED" ||
          state === "COMPLETE" ||
          state === "FINISHED";
        if (eventId) lastEventId = eventId;
        if (id !== undefined && id !== null && finished) {
          const updated =
            conv.updated_at ??
            conv.updatedAt ??
            conv.summary_updated_at ??
            root.updated_at ??
            "";
          const key = eventId || `${String(id)}:${event}:${String(updated)}:${state}`;
          const now = Date.now();
          for (const [seenKey, seenAt] of recentlyHandled) {
            if (now - seenAt > 60_000) recentlyHandled.delete(seenKey);
          }
          if (!recentlyHandled.has(key)) {
            recentlyHandled.set(key, now);
            await onDone(String(id)).catch((error) =>
              console.error("[bee]", error),
            );
          }
        }
        event = "";
        eventId = "";
      };

      for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
        buf += decoder.decode(chunk, { stream: true });
        let newline: number;
        while ((newline = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, newline).replace(/\r$/, "");
          buf = buf.slice(newline + 1);
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
          else if (line.startsWith("id:")) eventId = line.slice(3).trim();
          else if (line.startsWith("retry:")) {
            const requested = Number(line.slice(6).trim());
            if (Number.isFinite(requested)) {
              reconnectDelay = Math.max(1000, Math.min(requested, 60_000));
            }
          } else if (line === "") {
            await dispatch();
          }
        }
      }
      buf += decoder.decode();
      if (buf.trim()) dataLines.push(buf.trim());
      await dispatch();
    } catch (error) {
      console.error(
        `[bee] stream dropped, retrying in ${Math.round(reconnectDelay / 1000)}s:`,
        (error as Error).message,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, reconnectDelay));
  }
}
