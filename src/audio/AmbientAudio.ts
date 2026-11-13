import { AUDIO } from '@/config/constants';
import type { MixTargets } from './audioMix';

/** Seconds of noise looped for the wind; long enough that no pattern is heard. */
const NOISE_SECONDS = 4;

/**
 * Every sound of the site on one Web Audio graph:
 *
 *   music ─┐
 *          ├─ ambience (ducks under a voice note) ─┐
 *   wind ──┘                                       ├─ master (fades in and out) ─ speakers
 *   pops ──────────────────────────────────────────┘
 *
 * Nothing is created before `unlock()`, which must run inside a click or key press: that is when
 * browsers let a page make sound, and the only moment this one ever starts to.
 */
export class AmbientAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: GainNode | null = null;
  private sourcesStarted = false;
  private suspendTimer: number | undefined;
  private targets: MixTargets = { master: 0, ambience: 1 };
  private disposed = false;

  get unlocked(): boolean {
    return this.context !== null;
  }

  unlock(): void {
    if (this.disposed) return;
    if (!this.context) {
      const context = new AudioContext();
      this.context = context;
      this.master = new GainNode(context, { gain: 0 });
      this.master.connect(context.destination);
      this.ambience = new GainNode(context, { gain: this.targets.ambience });
      this.ambience.connect(this.master);
    }
    void this.context.resume();
    this.apply(this.targets);
  }

  /** Moves toward the new levels with fades; once silent, the whole graph sleeps. */
  apply(targets: MixTargets): void {
    this.targets = targets;
    const { context, master, ambience } = this;
    if (!context || !master || !ambience) return;

    window.clearTimeout(this.suspendTimer);
    const now = context.currentTime;
    ramp(ambience.gain, targets.ambience, now, AUDIO.duckTime);
    if (targets.master > 0) {
      void context.resume();
      this.startSources(context, ambience);
      ramp(master.gain, targets.master, now, AUDIO.fadeIn);
    } else {
      ramp(master.gain, 0, now, AUDIO.fadeOut);
      this.suspendTimer = window.setTimeout(() => {
        void context.suspend();
      }, AUDIO.fadeOut * 1000);
    }
  }

  /** A soft round "pop", like a bubble: a sine that leaps up and fades. */
  pop(frequency: number): void {
    const { context, master } = this;
    if (!context || !master || this.targets.master === 0 || context.state !== 'running') return;
    const { volume, rise, decay } = AUDIO.pop;
    const now = context.currentTime;
    const envelope = new GainNode(context, { gain: 0 });
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(volume, now + rise);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + rise + decay);
    envelope.connect(master);
    const tone = new OscillatorNode(context, { type: 'sine', frequency: frequency * 0.6 });
    tone.frequency.exponentialRampToValueAtTime(frequency, now + rise);
    tone.connect(envelope);
    tone.start(now);
    tone.stop(now + rise + decay + 0.05);
    tone.addEventListener('ended', () => {
      tone.disconnect();
      envelope.disconnect();
    });
  }

  dispose(): void {
    this.disposed = true;
    window.clearTimeout(this.suspendTimer);
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.ambience = null;
  }

  private startSources(context: AudioContext, ambience: GainNode): void {
    if (this.sourcesStarted) return;
    this.sourcesStarted = true;
    startWind(context, ambience);
    void loadMusic(context).then(
      (buffer) => {
        if (this.disposed || this.context !== context) return;
        const music = new GainNode(context, { gain: AUDIO.music.volume });
        music.connect(ambience);
        const source = new AudioBufferSourceNode(context, {
          buffer,
          loop: true,
          loopStart: AUDIO.music.loopStart,
          loopEnd: AUDIO.music.loopEnd,
        });
        source.connect(music);
        source.start();
      },
      // Without the file (offline, blocked), the wind alone keeps the place alive.
      () => undefined,
    );
  }
}

/** A smooth approach rather than a line: reaches about 95 % of the way in `seconds`. */
function ramp(param: AudioParam, target: number, now: number, seconds: number): void {
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.setTargetAtTime(target, now, seconds / 3);
}

async function loadMusic(context: AudioContext): Promise<AudioBuffer> {
  const response = await fetch(`${import.meta.env.BASE_URL}${AUDIO.music.src}`);
  if (!response.ok) throw new Error(`Ambient music: HTTP ${response.status}`);
  return context.decodeAudioData(await response.arrayBuffer());
}

/**
 * Wind through leaves: brown noise through a band-pass that sways slowly, with gusts that swell
 * its volume now and then.
 */
function startWind(context: AudioContext, destination: AudioNode): void {
  const { volume, frequency, sway, swayRate, gustRate, gustDepth } = AUDIO.wind;
  const length = NOISE_SECONDS * context.sampleRate;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    // Brown noise: white noise integrated, which keeps the rumble and loses the hiss.
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }

  const noise = new AudioBufferSourceNode(context, { buffer, loop: true });
  const band = new BiquadFilterNode(context, { type: 'bandpass', frequency, Q: 0.6 });
  const level = new GainNode(context, { gain: volume });
  noise.connect(band).connect(level).connect(destination);

  const swayLfo = new OscillatorNode(context, { frequency: swayRate });
  swayLfo.connect(new GainNode(context, { gain: sway })).connect(band.frequency);
  const gustLfo = new OscillatorNode(context, { frequency: gustRate });
  gustLfo.connect(new GainNode(context, { gain: volume * gustDepth })).connect(level.gain);

  noise.start();
  swayLfo.start();
  gustLfo.start();
}
