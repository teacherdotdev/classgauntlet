import type { DataConnection, Peer } from 'peerjs';
import { createPeer, keepAlive, roomPrefix } from './peer';
import { createSession, Engine, type Result } from './game/engine';
import type { Question, Session, Settings } from './game/types';
import { buildView, type View } from './game/views';
import {
  joinUrl,
  newRoomCode,
  showChannelName,
  type HostMessage,
  type ShowMessage,
  type StudentMessage,
} from './protocol';

/**
 * The teacher's tab is the game. It holds a room address on the matchmaking
 * server, accepts a direct connection from each student, runs the rules, and
 * sends every device the view it is allowed to see. The whole game is saved to
 * local storage after every change, so reloading the tab picks up where it was.
 */

const savedKey = 'review1v100:host';

type Saved = { session: Session; kicked: string[] };

export function savedGame(): Saved | null {
  try {
    const raw = localStorage.getItem(savedKey);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    return saved?.session?.version === 1 ? saved : null;
  } catch {
    return null;
  }
}

export function forgetSavedGame() {
  try {
    localStorage.removeItem(savedKey);
  } catch {
    /* storage blocked */
  }
}

export type RoomStatus =
  /** Registering the room code with the matchmaking server. */
  | 'opening'
  /** Students can join. */
  | 'open'
  /** After a reload the server still holds the old address for a short while. */
  | 'reclaiming'
  /** Lost the matchmaking server; students already connected keep playing. */
  | 'reconnecting'
  | 'failed'
  /** The teacher ended the game; the room is gone but the final standings stay up. */
  | 'closed';

class HostRoom {
  engine: Engine | null = null;
  /** A copy of the session for the teacher's screens; replaced on every change. */
  session = $state.raw<Session | null>(null);
  /** The public view, as the projector sees it. */
  view = $state.raw<View | null>(null);
  status = $state<RoomStatus>('opening');
  problem = $state('');
  /** Last command the teacher tried that was not allowed. */
  notice = $state('');

  #peer: Peer | null = null;
  #connections = new Map<string, DataConnection>();
  #channel: BroadcastChannel | null = null;
  #ticker = 0;
  #reclaimTries = 0;
  #broadcastQueued = false;

  get joinUrl() {
    return this.session ? joinUrl(location.origin, this.session.code) : '';
  }

  /** Starts a new game room with the chosen questions. */
  create(input: { setTitle: string; questions: Question[]; settings: Partial<Settings> }) {
    const session = createSession({ code: newRoomCode(), ...input });
    this.#start(new Engine(session));
  }

  resume(saved: Saved) {
    const engine = new Engine(saved.session);
    for (const id of saved.kicked) engine.kicked.add(id);
    this.#start(engine);
  }

  #start(engine: Engine) {
    this.close();
    this.engine = engine;
    this.#reclaimTries = 0;
    this.#channel = new BroadcastChannel(showChannelName);
    this.#channel.onmessage = (event: MessageEvent<ShowMessage>) => {
      if (event.data.type === 'hello') this.#postShow();
    };
    this.#ticker = window.setInterval(() => {
      if (this.engine?.tick()) this.#commit();
    }, 200);
    this.#commit();
    void this.#open();
  }

  async #open() {
    if (!this.engine) return;
    const engine = this.engine;
    this.status = this.#reclaimTries > 0 ? 'reclaiming' : 'opening';
    const peer = await createPeer(roomPrefix + engine.session.code);
    if (this.engine !== engine) {
      peer.destroy();
      return;
    }
    this.#peer = peer;
    peer.on('open', () => {
      this.status = 'open';
      this.problem = '';
      this.#reclaimTries = 0;
    });
    peer.on('disconnected', () => {
      if (this.#peer === peer) this.status = 'reconnecting';
    });
    peer.on('connection', (connection) => this.#accept(connection));
    peer.on('error', (error) => {
      if (this.#peer !== peer) return;
      if (error.type === 'unavailable-id') {
        // The server still remembers this tab from before a reload. It lets go
        // within a minute, so keep trying for the same code.
        peer.destroy();
        this.#peer = null;
        this.#reclaimTries++;
        this.status = 'reclaiming';
        if (this.#reclaimTries > 40) {
          this.status = 'failed';
          this.problem = 'This room code is still in use by another tab. Close other copies of this page, or start a new room.';
          return;
        }
        setTimeout(() => void this.#open(), 3000);
      } else if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(error.type)) {
        this.status = 'reconnecting';
        this.problem = 'Can’t reach the matchmaking server. Students already playing can keep going; new students can join once it’s back.';
      } else if (error.type === 'browser-incompatible') {
        this.status = 'failed';
        this.problem = 'This browser can’t host the game. Try Chrome, Edge, Firefox or Safari.';
      }
    });
  }

  #accept(connection: DataConnection) {
    let playerId: string | null = null;
    connection.on('open', () => keepAlive(connection));
    connection.on('data', (data) => {
      const message = data as StudentMessage;
      const engine = this.engine;
      if (!engine || !message || typeof message !== 'object') return;
      if (message.type === 'ping') return;
      if (message.type === 'hello') {
        const joined = engine.join({
          playerId: message.playerId,
          secret: message.secret,
          nickname: String(message.nickname ?? ''),
        });
        if (!joined.ok) {
          const forget = !!message.playerId && !engine.player(message.playerId);
          this.#send(connection, { type: 'denied', message: joined.message, forget });
          return;
        }
        playerId = joined.player.id;
        // One device per seat: a newer connection replaces an older one.
        const previous = this.#connections.get(playerId);
        this.#connections.set(playerId, connection);
        if (previous && previous !== connection) previous.close();
        this.#send(connection, {
          type: 'welcome',
          playerId,
          secret: joined.player.secret,
          nickname: joined.player.nickname,
        });
        this.#commit();
        return;
      }
      if (!playerId) return;
      if (message.type === 'leave') {
        engine.kick(playerId);
        this.#connections.delete(playerId);
        connection.close();
        this.#commit();
        return;
      }
      let result: Result;
      if (message.type === 'answer') result = engine.answer(playerId, message.attemptId, message.choice);
      else if (message.type === 'one-answer') result = engine.oneAnswer(playerId, message.attemptId, message.choice);
      else if (message.type === 'help')
        result =
          message.help === 'poll'
            ? engine.helpPoll(playerId, Number(message.choice))
            : message.help === 'ask'
              ? engine.helpAsk(playerId)
              : engine.helpTrust(playerId);
      else return;
      if (result.ok) this.#commit();
      else this.#send(connection, { type: 'notice', message: result.message });
    });
    connection.on('close', () => {
      if (!playerId || this.#connections.get(playerId) !== connection) return;
      this.#connections.delete(playerId);
      this.engine?.setConnected(playerId, false);
      this.#commit();
    });
    connection.on('error', () => connection.close());
  }

  #send(connection: DataConnection, message: HostMessage) {
    if (connection.open) connection.send(message);
  }

  /** Saves the game and, on the next tick, sends every screen its view. */
  #commit() {
    const engine = this.engine;
    if (!engine) return;
    this.session = structuredClone(engine.session);
    this.view = buildView(engine.session, { now: Date.now(), pauseReason: engine.pauseReason });
    try {
      localStorage.setItem(savedKey, JSON.stringify({ session: engine.session, kicked: [...engine.kicked] } satisfies Saved));
    } catch {
      /* storage full or blocked: the game still runs */
    }
    if (this.#broadcastQueued) return;
    this.#broadcastQueued = true;
    queueMicrotask(() => {
      this.#broadcastQueued = false;
      this.#broadcast();
    });
  }

  #broadcast() {
    const engine = this.engine;
    if (!engine) return;
    const now = Date.now();
    for (const [playerId, connection] of this.#connections) {
      this.#send(connection, {
        type: 'view',
        view: buildView(engine.session, { now, pauseReason: engine.pauseReason, viewerId: playerId }),
      });
    }
    this.#postShow();
  }

  #postShow() {
    if (this.view && this.#channel) this.#channel.postMessage({ type: 'view', view: this.view, joinUrl: this.joinUrl } satisfies ShowMessage);
  }

  /** Runs a teacher command; shows its message if it wasn't allowed. */
  run(command: (engine: Engine) => Result): boolean {
    if (!this.engine) return false;
    const result = command(this.engine);
    this.notice = result.ok ? '' : result.message;
    if (result.ok) this.#commit();
    return result.ok;
  }

  kick(playerId: string) {
    const connection = this.#connections.get(playerId);
    if (this.run((engine) => engine.kick(playerId)) && connection) {
      this.#connections.delete(playerId);
      this.#send(connection, { type: 'removed' });
      setTimeout(() => connection.close(), 300);
    }
  }

  /** Ends the room for good and lets the matchmaking server forget it. */
  finish() {
    this.run((engine) => engine.endSession());
    // Give the final standings a moment to reach every screen, then hang up.
    setTimeout(() => {
      forgetSavedGame();
      this.#hangUp();
      this.status = 'closed';
      this.problem = '';
    }, 1500);
  }

  #hangUp() {
    clearInterval(this.#ticker);
    for (const connection of this.#connections.values()) connection.close();
    this.#connections.clear();
    this.#peer?.destroy();
    this.#peer = null;
  }

  close() {
    this.#hangUp();
    this.#channel?.postMessage({ type: 'closed' } satisfies ShowMessage);
    this.#channel?.close();
    this.#channel = null;
    this.engine = null;
    this.session = null;
    this.view = null;
  }
}

export const host = new HostRoom();
