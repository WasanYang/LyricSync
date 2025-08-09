class Metronome {
  private audioContext: AudioContext | null = null;
  private isRunning = false;
  private bpm = 120;
  private timeSignatureBeats = 4;
  private lookahead = 25.0; // How frequently to call scheduling function (in ms)
  private scheduleAheadTime = 0.1; // How far ahead to schedule audio (in s)
  private nextNoteTime = 0.0; // When the next note is due
  private currentBeatInMeasure = 0;
  private timerID: number | undefined;
  private volume = 0.5;
  private gainNode: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      if (this.audioContext) {
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
      }
    }
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
  }

  public setTimeSignature(beats: number) {
    this.timeSignatureBeats = beats;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(
        this.volume,
        this.audioContext!.currentTime
      );
    }
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat; // Add beat length to last beat time

    this.currentBeatInMeasure =
      (this.currentBeatInMeasure + 1) % this.timeSignatureBeats;
  }

  private scheduleNote(beatNumber: number, time: number) {
    if (!this.audioContext || !this.gainNode) return;

    // Create an oscillator and a gain node for each note to control its volume envelope independently.
    const osc = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    // Set frequencies for "tok" (downbeat) and "tik" (off-beat)
    osc.frequency.value = beatNumber === 0 ? 440.0 : 330.0;
    envelope.gain.value = 0;

    // Create the percussive sound envelope
    envelope.gain.setValueAtTime(1, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(envelope);
    envelope.connect(this.gainNode); // Connect to the main volume control

    osc.start(time);
    osc.stop(time + 0.1);
  }

  private scheduler() {
    if (!this.audioContext) return;
    // while there are notes that will need to play before the next interval,
    // schedule them and advance the pointer.
    while (
      this.nextNoteTime <
      this.audioContext.currentTime + this.scheduleAheadTime
    ) {
      this.scheduleNote(this.currentBeatInMeasure, this.nextNoteTime);
      this.nextNote();
    }
    this.timerID = window.setTimeout(this.scheduler.bind(this), this.lookahead);
  }

  public start() {
    if (this.isRunning || !this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isRunning = true;
    this.currentBeatInMeasure = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.1; // Start with a small delay
    this.scheduler();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerID) {
      window.clearTimeout(this.timerID);
    }
  }
}

export { Metronome };
