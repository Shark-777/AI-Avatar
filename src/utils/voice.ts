type SpeechRecognitionCtor = new () => any;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakText(text: string) {
  if (!canSpeak() || !text.trim()) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  const preferredVoice = window.speechSynthesis
    .getVoices()
    .find(voice => /samantha|alex|victoria|zira|google/i.test(voice.name));
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (canSpeak()) {
    window.speechSynthesis.cancel();
  }
}

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function canDictate() {
  return getSpeechRecognitionCtor() !== null;
}
