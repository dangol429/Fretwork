/* ---------------------------------------------------------------------------
   Making the diagrams audible.

   Karplus-Strong: a burst of noise trapped in a delay loop exactly one
   wavelength long, averaged with its neighbour each time round. The averaging
   is a low-pass filter, so the high frequencies die first and a bright attack
   settles into a warm tone — which is what a plucked string does. It costs a
   few lines of arithmetic and sounds like a guitar, where an oscillator would
   sound like a test tone.

   Buffers are rendered once per pitch and reused, so repeated playing of the
   same chord costs nothing after the first strum.
--------------------------------------------------------------------------- */

const A4_MIDI = 69;
const BUFFER_SECONDS = 3.2;

const frequency = (midi: number) => 440 * 2 ** ((midi - A4_MIDI) / 12);

let context: AudioContext | null = null;
let ringing: GainNode | null = null;
const buffers = new Map<number, AudioBuffer>();

/**
 * iOS hands a page that has only ever used Web Audio the "ambient" audio
 * session, and the ambient session is silenced by the ring/silent switch on
 * the side of the phone. Nothing is wrong with the graph in that case — the
 * notes are rendered and then thrown away, which is why the desktop and a
 * narrowed desktop window both sound fine and the phone does not. Asking for
 * the playback session says these are notes the user pressed a button to hear,
 * and they play with the switch either way. Safari 16.4 and up; everything
 * else ignores the property.
 */
function claimPlaybackSession() {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (!session) return;
  try {
    session.type = "playback";
  } catch {
    /* Locked down, or a shape of the API we do not know. Play anyway. */
  }
}

/**
 * Browsers refuse to start audio until the user has interacted with the page,
 * so the context is built on the first strum rather than at import time.
 */
function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    claimPlaybackSession();
    context = new Ctor();
    // Locking the phone, taking a call or letting another app take the output
    // parks the context. WebKit parks it in "interrupted", which no spec
    // mentions and no amount of resuming on the next tap recovers from if the
    // tap happens before the page is visible again.
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) void context?.resume();
    });
  }
  // Anything but "running" wants resuming — "suspended" everywhere, and
  // "interrupted" on iOS, which a === "suspended" test walks straight past.
  if (context.state !== "running") void context.resume();
  return context;
}

function pluck(ctx: AudioContext, midi: number): AudioBuffer {
  const cached = buffers.get(midi);
  if (cached) return cached;

  const rate = ctx.sampleRate;
  // The two-point average that damps the loop is itself half a sample of
  // delay, so the delay line is shortened to match or every note rings sharp.
  const period = Math.max(2, Math.round(rate / frequency(midi) - 0.5));
  const length = Math.ceil(rate * BUFFER_SECONDS);
  const buffer = ctx.createBuffer(1, length, rate);
  const wave = buffer.getChannelData(0);

  for (let i = 0; i < period; i += 1) wave[i] = Math.random() * 2 - 1;
  // Round off the initial burst: a fingertip, not a spark.
  for (let i = 1; i < period; i += 1) wave[i] = (wave[i] + wave[i - 1]) * 0.5;

  // A plain per-sample loss would make the top string die while the bottom one
  // was still ringing, because it loops through the delay far more often per
  // second. Scaling the loss by the period holds the decay time steady, and
  // then the wound strings are given a little extra sustain on purpose.
  const sustain = 1.55 - ((midi - 40) / 30) * 0.6;
  const loss = Math.exp(-period / (rate * sustain));
  for (let i = period; i < length; i += 1) {
    wave[i] = (wave[i - period] + wave[i - period + 1]) * 0.5 * loss;
  }

  // Fade the tail so stopping the buffer can never click.
  const fade = Math.min(3000, Math.floor(length * 0.08));
  for (let i = 0; i < fade; i += 1) {
    wave[length - fade + i] *= 1 - i / fade;
  }

  buffers.set(midi, buffer);
  return buffer;
}

export type StrumOptions = {
  /** Seconds between strings — how fast the hand crosses them. */
  spread?: number;
  /** Low to high, or high to low. */
  direction?: "down" | "up";
};

/**
 * Plays a set of sounding notes, low to high, as one stroke.
 *
 * Anything still ringing from the last chord is faded rather than cut, so
 * clicking through voicings sounds like a player trying them one after another.
 */
export function strum(midi: number[], { spread = 0.028, direction = "down" }: StrumOptions = {}) {
  const ctx = audio();
  if (!ctx || midi.length === 0) return;

  if (ringing) {
    ringing.gain.cancelScheduledValues(ctx.currentTime);
    ringing.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  }

  const master = ctx.createGain();
  master.gain.value = 0.34;
  // Takes the fizz off the top without muffling it — the body of the guitar.
  const body = ctx.createBiquadFilter();
  body.type = "lowpass";
  body.frequency.value = 3600;
  body.Q.value = 0.5;
  master.connect(body).connect(ctx.destination);
  ringing = master;

  const order = direction === "down" ? midi : [...midi].reverse();
  const start = ctx.currentTime + 0.02;

  order.forEach((note, i) => {
    const source = ctx.createBufferSource();
    source.buffer = pluck(ctx, note);
    const voice = ctx.createGain();
    // The stroke lands hardest on the string it starts from.
    voice.gain.value = 0.9 - i * 0.05;
    source.connect(voice).connect(master);
    source.start(start + i * spread);
  });
}

/** Silences anything ringing — used when the results view goes away. */
export function hush() {
  if (!context || !ringing) return;
  ringing.gain.cancelScheduledValues(context.currentTime);
  ringing.gain.setTargetAtTime(0, context.currentTime, 0.04);
  ringing = null;
}
