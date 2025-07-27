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

  test('rewindAndPlayAudio defaults volume to 1 when no options provided', () => {
    const audioElement = document.createElement('audio');
    audioElement.play = jest.fn();
    const ref: RefObject<HTMLAudioElement> = { current: audioElement };

    rewindAndPlayAudio(ref);

    expect(audioElement.volume).toBe(1);
    expect(audioElement.play).toHaveBeenCalled();
  });

  test('rewindAndPlayAudio applies loop option and defaults volume', () => {
    const audioElement = document.createElement('audio');
    audioElement.play = jest.fn();
    const ref: RefObject<HTMLAudioElement> = { current: audioElement };

    rewindAndPlayAudio(ref, { loop: true });

    expect(audioElement.loop).toBe(true);
    expect(audioElement.volume).toBe(1);
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

  test('pauseAudio safely handles missing elements', () => {
    const nullRef: RefObject<HTMLAudioElement> = { current: null };
    expect(() => pauseAudio(nullRef)).not.toThrow();
    expect(() => pauseAudio(undefined)).not.toThrow();
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

  test('rewindAndPlayAudio switches to mp3 when ogg unsupported', () => {
    const audioElement = document.createElement('audio');
    audioElement.play = jest.fn();
    audioElement.canPlayType = jest.fn((type: string) => {
      if (type === 'audio/ogg') return '';
      if (type === 'audio/mpeg') return 'maybe';
      return '';
    });
    const ref: RefObject<HTMLAudioElement> = { current: audioElement };

    rewindAndPlayAudio(ref, '/sound.ogg');

    expect(audioElement.src.endsWith('/sound.mp3')).toBe(true);
  });
});
