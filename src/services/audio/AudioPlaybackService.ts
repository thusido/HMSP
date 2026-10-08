import type { PlaybackSpeed } from '../../types';

interface AudioPlaybackCallbacks {
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onLoadedMetadata?: (duration: number) => void;
}

/** Thin wrapper over HTMLAudioElement. Owns object-URL lifecycle; never throws. */
export class AudioPlaybackService {
  private audio: HTMLAudioElement;
  private callbacks: AudioPlaybackCallbacks = {};
  private currentUrl: string | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.addEventListener('timeupdate', () => {
      this.callbacks.onTimeUpdate?.(this.audio.currentTime || 0, this.audio.duration || 0);
    });
    this.audio.addEventListener('play', () => this.callbacks.onPlayStateChange?.(true));
    this.audio.addEventListener('pause', () => this.callbacks.onPlayStateChange?.(false));
    this.audio.addEventListener('ended', () => {
      this.callbacks.onPlayStateChange?.(false);
      this.callbacks.onEnded?.();
    });
    this.audio.addEventListener('loadedmetadata', () => {
      this.callbacks.onLoadedMetadata?.(this.audio.duration || 0);
    });
    this.audio.addEventListener('error', () => {
      this.callbacks.onError?.(this.audio.error?.message || 'Audio playback error.');
    });
  }

  public setCallbacks(callbacks: AudioPlaybackCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public load(src: string | File): void {
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
    if (typeof src === 'string') {
      this.audio.src = src;
    } else {
      this.currentUrl = URL.createObjectURL(src);
      this.audio.src = this.currentUrl;
    }
    this.audio.load();
    this.audio.currentTime = 0;
  }

  public async play(): Promise<void> {
    try {
      await this.audio.play();
    } catch (err) {
      console.warn('Playback play() was rejected:', err);
      this.callbacks.onPlayStateChange?.(false);
    }
  }

  public pause(): void {
    this.audio.pause();
  }

  public togglePlay(): void {
    if (this.audio.paused) this.play();
    else this.pause();
  }

  public seek(timeInSeconds: number): void {
    if (Number.isNaN(timeInSeconds)) return;
    this.audio.currentTime = Math.max(0, Math.min(timeInSeconds, this.audio.duration || 0));
  }

  public setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  public setPlaybackRate(rate: PlaybackSpeed): void {
    this.audio.playbackRate = rate;
  }

  public destroy(): void {
    this.audio.pause();
    this.audio.removeAttribute('src');
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
  }
}
