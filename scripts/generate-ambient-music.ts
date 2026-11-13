/**
 * Synthesizes the ambient track in public/audio/ambient.mp3: a warm pad under a sparse kalimba, in
 * D major, slow. Run with `pnpm audio:ambient` (needs ffmpeg).
 *
 * The file is periodic: it renders the same 48 s three times through the reverb and keeps from the
 * start of the second pass, so tails wrap around exactly. Any window one period long then loops
 * without a seam, which is what AUDIO.music.loopStart/loopEnd rely on; the mp3 encoder's delay at
 * the start only shifts the content and does not break that.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { AUDIO } from '../src/config/constants';
import { mulberry32 } from '../src/layout/random';

const RATE = 44_100;
const PERIOD = AUDIO.music.loopEnd - AUDIO.music.loopStart;
/** Seconds kept after the period, so the loop window can start past the encoder's delay. */
const TAIL = AUDIO.music.loopStart + 2;
const PASSES = 3;
const CHORD_SECONDS = PERIOD / 4;

/** Dmaj9, Bm7(add11), Gmaj7(9), Asus2: open voicings, nothing that pulls hard. */
const CHORDS: readonly (readonly number[])[] = [
  [50, 57, 64, 66, 69],
  [47, 54, 62, 64, 69],
  [43, 50, 59, 66, 69],
  [45, 52, 59, 64, 69],
];
/** D major pentatonic, upper register: every note sits well over every chord. */
const MELODY_NOTES = [74, 76, 78, 81, 83, 86, 88] as const;

const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

const length = Math.round(PERIOD * PASSES * RATE);
const left = new Float32Array(length);
const right = new Float32Array(length);

function smoothstep(x: number): number {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/** One pad note: two slightly detuned sines and a soft octave, swelling in and out. */
function addPadNote(midi: number, start: number, duration: number, gain: number, pan: number) {
  const attack = 3.5;
  const release = 4.5;
  const first = Math.floor(start * RATE);
  const last = Math.min(length, Math.floor((start + duration + release) * RATE));
  const f = frequency(midi);
  const detune = 2 ** (4 / 1200);
  const leftGain = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const rightGain = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = Math.max(0, first); i < last; i++) {
    const t = i / RATE - start;
    const envelope = smoothstep(t / attack) * (1 - smoothstep((t - duration) / release));
    const phase = 2 * Math.PI * f * t;
    const breath = 1 + 0.12 * Math.sin(2 * Math.PI * 0.11 * t + midi);
    const value =
      (Math.sin(phase / detune) +
        Math.sin(phase * detune) +
        0.22 * Math.sin(2 * phase) +
        0.06 * Math.sin(3 * phase)) *
      envelope *
      breath;
    left[i] = (left[i] ?? 0) + value * leftGain;
    right[i] = (right[i] ?? 0) + value * rightGain;
  }
}

/** A kalimba tine: a quick bright partial over a sine that rings and fades. */
function addPluck(midi: number, start: number, gain: number, pan: number) {
  const first = Math.floor(start * RATE);
  const last = Math.min(length, first + Math.floor(4 * RATE));
  const f = frequency(midi);
  const leftGain = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const rightGain = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = Math.max(0, first); i < last; i++) {
    const t = i / RATE - start;
    const attack = Math.min(1, t / 0.004);
    const value =
      attack *
      (Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 1.1) +
        0.25 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t / 0.35) +
        0.08 * Math.sin(2 * Math.PI * f * 5.4 * t) * Math.exp(-t / 0.06));
    left[i] = (left[i] ?? 0) + value * leftGain;
    right[i] = (right[i] ?? 0) + value * rightGain;
  }
}

function renderPass(offset: number) {
  CHORDS.forEach((chord, index) => {
    const start = offset + index * CHORD_SECONDS;
    chord.forEach((midi, voice) => {
      const pan = (voice / (chord.length - 1)) * 1.2 - 0.6;
      addPadNote(midi, start, CHORD_SECONDS, voice === 0 ? 0.05 : 0.032, pan);
    });
  });

  // The same melody every pass, so the passes are identical.
  const random = mulberry32(2026);
  let time = 1.5;
  while (time < PERIOD - 1) {
    const phrase = 3 + Math.floor(random() * 3);
    let note = Math.floor(random() * MELODY_NOTES.length);
    for (let i = 0; i < phrase && time < PERIOD - 1; i++) {
      note = Math.min(MELODY_NOTES.length - 1, Math.max(0, note + Math.floor(random() * 5) - 2));
      const midi = MELODY_NOTES[note] ?? 74;
      addPluck(midi, offset + time, 0.07 + random() * 0.03, random() * 1.2 - 0.6);
      time += [0.75, 0.75, 1.5, 1][Math.floor(random() * 4)] ?? 1;
    }
    time += 3 + random() * 4;
  }
}

/** Freeverb-style: parallel damped combs into series allpasses, a little different per side. */
function reverb(input: Float32Array, spread: number): Float32Array {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116].map((n) => n + spread);
  const allpasses = [225, 556, 441, 341].map((n) => n + spread);
  const output = new Float32Array(input.length);
  const feedback = 0.86;
  const damp = 0.3;
  for (const size of combs) {
    const buffer = new Float32Array(size);
    let index = 0;
    let filtered = 0;
    for (let i = 0; i < input.length; i++) {
      const delayed = buffer[index] ?? 0;
      filtered = delayed * (1 - damp) + filtered * damp;
      buffer[index] = (input[i] ?? 0) + filtered * feedback;
      output[i] = (output[i] ?? 0) + delayed / combs.length;
      index = (index + 1) % size;
    }
  }
  for (const size of allpasses) {
    const buffer = new Float32Array(size);
    let index = 0;
    for (let i = 0; i < output.length; i++) {
      const delayed = buffer[index] ?? 0;
      const value = output[i] ?? 0;
      buffer[index] = value + delayed * 0.5;
      output[i] = delayed - value;
      index = (index + 1) % size;
    }
  }
  return output;
}

for (let pass = 0; pass < PASSES; pass++) renderPass(pass * PERIOD);

const wetLeft = reverb(left, 0);
const wetRight = reverb(right, 23);
const from = Math.round(PERIOD * RATE);
const frames = Math.round((PERIOD + TAIL) * RATE);
const mix = (dry: Float32Array, wet: Float32Array, i: number) =>
  0.7 * (dry[from + i] ?? 0) + 0.9 * (wet[from + i] ?? 0);

let peak = 0;
for (let i = 0; i < frames; i++) {
  peak = Math.max(peak, Math.abs(mix(left, wetLeft, i)), Math.abs(mix(right, wetRight, i)));
}
const normalize = 0.7 / peak;

const wav = Buffer.alloc(44 + frames * 4);
wav.write('RIFF', 0);
wav.writeUInt32LE(36 + frames * 4, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(RATE, 24);
wav.writeUInt32LE(RATE * 4, 28);
wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(frames * 4, 40);
const sample = (value: number) => Math.round(Math.tanh(value * normalize) * 32_767);
for (let i = 0; i < frames; i++) {
  wav.writeInt16LE(sample(mix(left, wetLeft, i)), 44 + i * 4);
  wav.writeInt16LE(sample(mix(right, wetRight, i)), 46 + i * 4);
}

const workDir = mkdtempSync(join(tmpdir(), 'ambient-'));
const wavPath = join(workDir, 'ambient.wav');
const output = resolve(import.meta.dirname, '..', 'public', AUDIO.music.src);
try {
  writeFileSync(wavPath, wav);
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-i',
    wavPath,
    '-codec:a',
    'libmp3lame',
    '-b:a',
    '96k',
    output,
  ]);
  console.log(`✓ ${output} (${(PERIOD + TAIL).toFixed(0)} s, bucle de ${PERIOD} s)`);
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
