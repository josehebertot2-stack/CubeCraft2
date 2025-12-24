
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

class GeminiLiveService {
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();

  constructor() {}

  async connect(onTranscription: (text: string) => void, voiceName: string = 'Zephyr') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = this.createBlob(inputData);
              this.sessionPromise?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              onTranscription(message.serverContent.outputTranscription.text);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              await this.playAudio(base64Audio);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              this.sources.forEach(s => {
                try { s.stop(); } catch (err) {}
              });
              this.sources.clear();
              this.nextStartTime = 0;
            }
          },
          onerror: (e) => console.error('Gemini error:', e),
          onclose: (e) => console.log('Gemini closed:', e),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } }
          },
          outputAudioTranscription: {},
          systemInstruction: 'Você é o guia do CubeCraft, um assistente amigável. Suas respostas devem ser curtas e diretas ao ponto.',
        }
      });
    } catch (err) {
      console.error('Mic access denied:', err);
    }
  }

  private createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: this.encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private encode(bytes: Uint8Array) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private decode(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async playAudio(base64: string) {
    if (!this.audioContext) return;
    const bytes = this.decode(base64);
    const audioBuffer = await this.decodeAudioData(bytes, this.audioContext, 24000, 1);
    
    this.nextStartTime = Math.max(this.nextStartTime, this.audioContext.currentTime);
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let ch = 0; ch < numChannels; ch++) {
      const chData = buffer.getChannelData(ch);
      for (let i = 0; i < frameCount; i++) {
        chData[i] = dataInt16[i * numChannels + ch] / 32768.0;
      }
    }
    return buffer;
  }
}

export const geminiLive = new GeminiLiveService();
