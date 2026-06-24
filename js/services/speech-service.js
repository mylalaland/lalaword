// ============================================
// LalaWord Speech Service (TTS)
// ============================================

const SpeechService = (() => {
  let synth = null;
  let voices = [];

  function init() {
    synth = window.speechSynthesis;
    loadVoices();
    synth.onvoiceschanged = loadVoices;
  }

  function loadVoices() {
    voices = synth.getVoices();
  }

  function getEnglishVoice() {
    // Prefer natural-sounding English voices
    const preferred = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    );
    return preferred || voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));
  }

  function speak(text, options = {}) {
    if (!synth) init();
    synth.cancel(); // Stop any current speech

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getEnglishVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = 'en-US';
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    return new Promise((resolve, reject) => {
      utterance.onend = resolve;
      utterance.onerror = reject;
      synth.speak(utterance);
    });
  }

  function speakSlow(text) {
    return speak(text, { rate: 0.6 });
  }

  function stop() {
    if (synth) synth.cancel();
  }

  function isSupported() {
    return 'speechSynthesis' in window;
  }

  return { init, speak, speakSlow, stop, isSupported };
})();
