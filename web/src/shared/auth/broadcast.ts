/**
 * Tab sync — এক tab-এ logout হলে সব tab logout (docs/05-frontend-plan.md §6.1)।
 * Shared chamber PC-তে এটি নিরাপত্তার প্রশ্ন, সুবিধার নয়।
 */

export type AuthBroadcastMessage = { type: 'logout'; reason: 'user' | 'expired' | 'reuse' };

const CHANNEL_NAME = 'caseflow-auth';

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  channel ??= new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export function broadcastLogout(reason: AuthBroadcastMessage['reason']): void {
  getChannel()?.postMessage({ type: 'logout', reason } satisfies AuthBroadcastMessage);
}

export function onAuthBroadcast(handler: (message: AuthBroadcastMessage) => void): () => void {
  const ch = getChannel();
  if (!ch) return () => undefined;

  const listener = (event: MessageEvent<AuthBroadcastMessage>) => handler(event.data);
  ch.addEventListener('message', listener);
  return () => ch.removeEventListener('message', listener);
}

/** শুধু test-এর জন্য — channel বন্ধ করে state reset করে। */
export function resetAuthBroadcast(): void {
  channel?.close();
  channel = null;
}
