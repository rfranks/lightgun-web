import { pauseAudio, rewindAndPlayAudio } from '../audio';
import type { RefObject } from 'react';

describe('audio utils', () => {
  test('rewindAndPlayAudio sets options and resets time', () => {
    const audioElement = document.createElement('audio');
    audioElement.play = jest.fn();
    const ref: RefObject<HTMLAudioElement> = { current: audioElement };

    rewindAndPlayAudio(ref, { loop: true, volume: 0.5 });

    expect(audioElement.loop).toBe(true);
    expect(audioElement.volume).toBe(0.5);
    expect(audioElement.currentTime).toBe(0);
    expect(audioElement.play).toHaveBeenCalled();
  });

  test('pauseAudio calls pause on existing element', () => {
    const audioElement = document.createElement('audio');
    audioElement.pause = jest.fn();
    const ref: RefObject<HTMLAudioElement> = { current: audioElement };

    pauseAudio(ref);

    expect(audioElement.pause).toHaveBeenCalled();
  });

  test('rewindAndPlayAudio uses defaults when options omitted', () => {
    const audioElement = document.createElement('audio');
    audioElement.play = jest.fn();
    const ref: RefObject<HTMLAudioElement> = { current: audioElement };

    rewindAndPlayAudio(ref);

    expect(audioElement.loop).toBe(false);
    expect(audioElement.volume).toBe(1);
    expect(audioElement.currentTime).toBe(0);
    expect(audioElement.play).toHaveBeenCalled();
  });

  test('audio functions ignore undefined refs', () => {
    expect(() => pauseAudio(undefined)).not.toThrow();
    expect(() => rewindAndPlayAudio(undefined)).not.toThrow();
  });
});
