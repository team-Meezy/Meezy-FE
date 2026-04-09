'use client';

type LameJsGlobal = {
  Mp3Encoder: new (
    channels: number,
    sampleRate: number,
    kbps: number
  ) => {
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
    flush(): Int8Array;
  };
};

declare global {
  interface Window {
    lamejs?: LameJsGlobal;
    __MEEZY_LAMEJS_LOADING__?: Promise<LameJsGlobal>;
  }
}

function interleaveChannels(left: Float32Array, right: Float32Array) {
  const length = left.length + right.length;
  const interleaved = new Float32Array(length);

  let index = 0;
  let inputIndex = 0;

  while (index < length) {
    interleaved[index++] = left[inputIndex];
    interleaved[index++] = right[inputIndex];
    inputIndex += 1;
  }

  return interleaved;
}

function floatTo16BitPCM(input: Float32Array) {
  const output = new Int16Array(input.length);

  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return output;
}

function mergeFloat32Chunks(chunks: Float32Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.length;
  });

  return merged;
}

async function loadLameJs() {
  if (typeof window === 'undefined') {
    throw new Error('lamejs can only be loaded in the browser');
  }

  if (window.lamejs?.Mp3Encoder) {
    return window.lamejs;
  }

  if (window.__MEEZY_LAMEJS_LOADING__) {
    return window.__MEEZY_LAMEJS_LOADING__;
  }

  window.__MEEZY_LAMEJS_LOADING__ = new Promise<LameJsGlobal>(
    (resolve, reject) => {
      const existingScript = document.querySelector(
        'script[data-meezy-lamejs="true"]'
      ) as HTMLScriptElement | null;

      const finalize = () => {
        if (window.lamejs?.Mp3Encoder) {
          resolve(window.lamejs);
          return;
        }

        reject(new Error('lamejs global was not initialized'));
      };

      if (existingScript) {
        if (existingScript.dataset.loaded === 'true') {
          finalize();
          return;
        }

        existingScript.addEventListener('load', finalize, { once: true });
        existingScript.addEventListener(
          'error',
          () => reject(new Error('Failed to load lamejs script')),
          { once: true }
        );
        return;
      }

      const script = document.createElement('script');
      script.src = '/lamejs/lame.all.js';
      script.async = true;
      script.dataset.meezyLamejs = 'true';
      script.onload = () => {
        script.dataset.loaded = 'true';
        finalize();
      };
      script.onerror = () => reject(new Error('Failed to load lamejs script'));
      document.head.appendChild(script);
    }
  );

  try {
    return await window.__MEEZY_LAMEJS_LOADING__;
  } finally {
    if (!window.lamejs?.Mp3Encoder) {
      window.__MEEZY_LAMEJS_LOADING__ = undefined;
    }
  }
}

export async function encodePcmChunksToMp3(params: {
  leftChunks: Float32Array[];
  rightChunks?: Float32Array[];
  sampleRate: number;
}) {
  const { leftChunks, rightChunks = [], sampleRate } = params;

  if (leftChunks.length === 0) {
    throw new Error('No PCM chunks available for MP3 encoding');
  }

  const lamejs = await loadLameJs();
  const channelCount = rightChunks.length > 0 ? 2 : 1;
  const mp3Encoder = new lamejs.Mp3Encoder(channelCount, sampleRate, 128);
  const blockSize = 1152;
  const mp3Chunks: Uint8Array[] = [];

  if (channelCount === 2) {
    const leftPcm = floatTo16BitPCM(mergeFloat32Chunks(leftChunks));
    const rightPcm = floatTo16BitPCM(mergeFloat32Chunks(rightChunks));
    const totalSamples = Math.min(leftPcm.length, rightPcm.length);

    for (let i = 0; i < totalSamples; i += blockSize) {
      const leftChunk = leftPcm.subarray(i, Math.min(i + blockSize, totalSamples));
      const rightChunk = rightPcm.subarray(i, Math.min(i + blockSize, totalSamples));
      const mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Chunks.push(new Uint8Array(mp3buf));
      }
    }
  } else {
    const monoPcm = floatTo16BitPCM(mergeFloat32Chunks(leftChunks));

    for (let i = 0; i < monoPcm.length; i += blockSize) {
      const monoChunk = monoPcm.subarray(i, Math.min(i + blockSize, monoPcm.length));
      const mp3buf = mp3Encoder.encodeBuffer(monoChunk);
      if (mp3buf.length > 0) {
        mp3Chunks.push(new Uint8Array(mp3buf));
      }
    }
  }

  const flushData = mp3Encoder.flush();
  if (flushData.length > 0) {
    mp3Chunks.push(new Uint8Array(flushData));
  }

  return new Blob(mp3Chunks, { type: 'audio/mpeg' });
}

export async function convertRecordingBlobToMp3(recordingBlob: Blob) {
  if (
    recordingBlob.type.toLowerCase().includes('audio/mpeg') ||
    recordingBlob.type.toLowerCase().includes('audio/mp3')
  ) {
    return new Blob([await recordingBlob.arrayBuffer()], { type: 'audio/mpeg' });
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error('AudioContext is not supported in this browser');
  }

  const audioContext = new AudioContextClass();

  try {
    const arrayBuffer = await recordingBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const channelCount = Math.min(2, audioBuffer.numberOfChannels);
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel =
      channelCount > 1 ? audioBuffer.getChannelData(1) : leftChannel;
    const pcmSamples =
      channelCount > 1
        ? interleaveChannels(leftChannel, rightChannel)
        : new Float32Array(leftChannel);

    return encodePcmChunksToMp3({
      leftChunks: [channelCount > 1 ? leftChannel : pcmSamples],
      rightChunks: channelCount > 1 ? [rightChannel] : [],
      sampleRate: audioBuffer.sampleRate,
    });
  } finally {
    void audioContext.close().catch(() => {});
  }
}
