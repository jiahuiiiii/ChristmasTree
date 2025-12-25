export class ChristmasSynth {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private nextNoteTime: number = 0;
  private currentNoteIndex: number = 0;
  private tempo: number = 120;
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // s
  private timerID: number | undefined;

  // We Wish You a Merry Christmas Melody (approximate)
  // G4, C5, C5, D5, C5, B4, A4, A4
  // A4, D5, D5, E5, D5, C5, B4, G4
  // G4, E5, E5, F5, E5, D5, C5, A4
  // G4, G4, A4, D5, B4, C5
  private melody: { note: string; duration: number }[] = [
    { note: 'G4', duration: 1 },
    { note: 'C5', duration: 1 }, { note: 'C5', duration: 0.5 }, { note: 'D5', duration: 0.5 }, { note: 'C5', duration: 0.5 }, { note: 'B4', duration: 0.5 }, { note: 'A4', duration: 1 }, { note: 'A4', duration: 1 },
    { note: 'A4', duration: 1 },
    { note: 'D5', duration: 1 }, { note: 'D5', duration: 0.5 }, { note: 'E5', duration: 0.5 }, { note: 'D5', duration: 0.5 }, { note: 'C5', duration: 0.5 }, { note: 'B4', duration: 1 }, { note: 'G4', duration: 1 },
    { note: 'G4', duration: 1 },
    { note: 'E5', duration: 1 }, { note: 'E5', duration: 0.5 }, { note: 'F5', duration: 0.5 }, { note: 'E5', duration: 0.5 }, { note: 'D5', duration: 0.5 }, { note: 'C5', duration: 1 }, { note: 'A4', duration: 1 },
    { note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
    { note: 'A4', duration: 1 }, { note: 'D5', duration: 1 }, { note: 'B4', duration: 1 }, { note: 'C5', duration: 2 }
  ];

  private noteFreqs: { [key: string]: number } = {
    'G4': 392.00,
    'A4': 440.00,
    'B4': 493.88,
    'C5': 523.25,
    'D5': 587.33,
    'E5': 659.25,
    'F5': 698.46,
  };

  constructor() {
    // AudioContext will be initialized on user interaction
  }

  public async init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public play() {
    this.init().then(() => {
      if (this.isPlaying) return;
      this.isPlaying = true;
      this.currentNoteIndex = 0;
      if (this.ctx) {
          this.nextNoteTime = this.ctx.currentTime;
          this.scheduler();
      }
    });
  }

  public stop() {
    this.isPlaying = false;
    window.clearTimeout(this.timerID);
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  private scheduler() {
    if (!this.ctx || !this.isPlaying) return;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentNoteIndex, this.nextNoteTime);
      this.nextNote();
    }
    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  private scheduleNote(index: number, time: number) {
     if (!this.ctx) return;
     const noteData = this.melody[index % this.melody.length];
     const freq = this.noteFreqs[noteData.note];

     if (!freq) return;

     // Oscillator (Sine + Triangle for a soft bell-like tone)
     const osc = this.ctx.createOscillator();
     osc.type = 'triangle';
     osc.frequency.value = freq;

     const osc2 = this.ctx.createOscillator();
     osc2.type = 'sine';
     osc2.frequency.value = freq;

     // Envelope
     const gain = this.ctx.createGain();
     const gain2 = this.ctx.createGain();
     
     // Soft attack, long release
     gain.gain.setValueAtTime(0, time);
     gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
     gain.gain.exponentialRampToValueAtTime(0.001, time + (noteData.duration * 60 / this.tempo));

     gain2.gain.setValueAtTime(0, time);
     gain2.gain.linearRampToValueAtTime(0.3, time + 0.05);
     gain2.gain.exponentialRampToValueAtTime(0.001, time + (noteData.duration * 60 / this.tempo));


     osc.connect(gain);
     osc2.connect(gain2);
     gain.connect(this.ctx.destination);
     gain2.connect(this.ctx.destination);

     osc.start(time);
     osc.stop(time + (noteData.duration * 60 / this.tempo) + 0.5); // stop a bit after
     osc2.start(time);
     osc2.stop(time + (noteData.duration * 60 / this.tempo) + 0.5);
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    const note = this.melody[this.currentNoteIndex % this.melody.length];
    this.nextNoteTime += note.duration * secondsPerBeat;
    this.currentNoteIndex++;
  }
}

export const christmasSynth = new ChristmasSynth();
