import type { Help } from './game/types';
import type { View } from './game/views';

/** What a student's device sends the teacher's tab. */
export type StudentMessage =
  | { type: 'hello'; nickname: string; playerId?: string; secret?: string }
  | { type: 'answer'; attemptId: string; choice: number }
  | { type: 'one-answer'; attemptId: string; choice: number }
  | { type: 'help'; help: Help; choice?: number }
  | { type: 'leave' }
  | { type: 'ping' };

/** What the teacher's tab sends a student's device. */
export type HostMessage =
  | { type: 'welcome'; playerId: string; secret: string; nickname: string }
  /** The device can't join; `forget` means its saved seat is no good. */
  | { type: 'denied'; message: string; forget: boolean }
  | { type: 'view'; view: View }
  | { type: 'notice'; message: string }
  | { type: 'removed' }
  | { type: 'ping' };

/** Between the teacher's tab and a projector window on the same computer. */
export type ShowMessage = { type: 'hello' } | { type: 'view'; view: View; joinUrl: string } | { type: 'closed' };

export const showChannelName = 'review1v100-show';

/** Six characters that are hard to misread on a projector: no 0/O, 1/I/L. */
const codeAlphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function newRoomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((b) => codeAlphabet[b % codeAlphabet.length]).join('');
}

export function cleanRoomCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}

export function joinUrl(origin: string, code: string): string {
  return `${origin}/join?code=${code}`;
}
