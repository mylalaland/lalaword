// ============================================
// LalaWord Camera / Scan Page
// ============================================

const CameraPage = (() => {
  let stream = null;
  let capturedImages = [];
  const MAX_IMAGES = 10;

  async function render() {
    const page = document.getElementById('page-camera');
    if (!page) return;

    // Check API key first
    if (!Store.get('apiKey')) {
      page.innerHTML = `
        <div class="page-content" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;">
          <div style="font-size:48px;margin-bottom:16px;">🔑</div>
          <div style="font-size:18px;font-weight:700;margin-bottom:8px;">API Key가 필요해요</div>
          <div style="font-size:14px;color:var(--color-text-muted);text-align:center;margin-bottom:24px;">
            책을 스캔하려면 먼저<br>Gemini API Key를 입력해주세요
          </div>
          <button class="btn btn-primary" onclick="Router.navigate('/settings')">설정으로 이동</button>
          <button class="btn btn-ghost mt-sm" onclick="Router.navigate('/home')">돌아가기</button>
        </div>
      `;
      return;
    }

    capturedImages = [];

    page.innerHTML = `
      <div style="position:relative;height:100vh;background:#000;overflow:hidden;">
        <!-- Camera view -->
        <video id="camera-video" autoplay playsinline style="width:100%;height:100%;object-fit:cover;"></video>

        <!-- Top bar -->
        <div style="position:absolute;top:0;left:0;right:0;padding:16px;display:flex;justify-content:space-between;align-items:center;z-index:5;">
          <button onclick="CameraPage.stopCamera();Router.navigate('/home')"
            style="width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,0.4);color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;">
            ✕
          </button>
          <div id="capture-count" style="background:rgba(0,0,0,0.4);color:#fff;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;">
            0 / ${MAX_IMAGES}
          </div>
        </div>

        <!-- Tips -->
        <div id="camera-tips" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          color:rgba(255,255,255,0.7);text-align:center;font-size:14px;z-index:3;pointer-events:none;">
          <div style="font-size:36px;margin-bottom:12px;">📖</div>
          <div>영어 책 페이지를 화면에 맞춰주세요</div>
          <div style="font-size:12px;margin-top:8px;opacity:0.7;">밝은 곳에서 그림자 없이 촬영하면 좋아요</div>
        </div>

        <!-- Guide frame -->
        <div style="position:absolute;inset:60px 24px 180px;border:2px dashed rgba(255,255,255,0.3);border-radius:12px;z-index:2;pointer-events:none;"></div>

        <!-- Thumbnails -->
        <div id="capture-thumbnails" style="position:absolute;bottom:120px;left:0;right:0;padding:0 16px;
          display:flex;gap:8px;overflow-x:auto;z-index:5;"></div>

        <!-- Bottom controls -->
        <div style="position:absolute;bottom:0;left:0;right:0;padding:24px;
          background:linear-gradient(transparent,rgba(0,0,0,0.6));
          display:flex;align-items:center;justify-content:space-around;z-index:5;">

          <!-- Gallery -->
          <label style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.2);
            display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;">
            🖼️
            <input type="file" accept="image/*" multiple id="gallery-input" style="display:none;" onchange="CameraPage.handleGallery(event)">
          </label>

          <!-- Capture button -->
          <button id="capture-btn" onclick="CameraPage.capture()"
            style="width:72px;height:72px;border-radius:50%;background:#fff;border:4px solid rgba(255,255,255,0.5);
            display:flex;align-items:center;justify-content:center;transition:transform 100ms;">
            <div style="width:60px;height:60px;border-radius:50%;background:#fff;"></div>
          </button>

          <!-- Analyze button -->
          <button id="analyze-btn" onclick="CameraPage.analyze()"
            style="width:44px;height:44px;border-radius:12px;background:var(--color-coral);
            display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;
            opacity:0.3;pointer-events:none;transition:opacity 200ms;">
            ✓
          </button>
        </div>
      </div>
    `;

    startCamera();
  }

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      const video = document.getElementById('camera-video');
      if (video) {
        video.srcObject = stream;
        // Hide tips after first interaction
        setTimeout(() => {
          const tips = document.getElementById('camera-tips');
          if (tips) tips.style.opacity = '0';
        }, 3000);
      }
    } catch (err) {
      console.error('Camera error:', err);
      Toast.error('카메라를 사용하려면 권한이 필요해요. 설정에서 허용해주세요');
      setTimeout(() => Router.navigate('/home'), 2000);
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
  }

  async function capture() {
    if (capturedImages.length >= MAX_IMAGES) {
      Toast.warning(`최대 ${MAX_IMAGES}장까지 촬영할 수 있어요`);
      return;
    }

    const video = document.getElementById('camera-video');
    if (!video) return;

    // Flash effect
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:10;animation:fadeOut 300ms ease both;';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
    Utils.vibrate(20);

    // Capture frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];

    capturedImages.push(base64);
    updateUI();
  }

  async function handleGallery(event) {
    const files = Array.from(event.target.files);
    for (const file of files) {
      if (capturedImages.length >= MAX_IMAGES) break;
      try {
        const base64 = await Utils.compressImage(file);
        capturedImages.push(base64);
      } catch (e) {
        console.error('Image compress error:', e);
      }
    }
    updateUI();
    event.target.value = '';
  }

  function removeImage(index) {
    capturedImages.splice(index, 1);
    updateUI();
  }

  function updateUI() {
    // Update count
    const countEl = document.getElementById('capture-count');
    if (countEl) countEl.textContent = `${capturedImages.length} / ${MAX_IMAGES}`;

    // Update thumbnails
    const thumbs = document.getElementById('capture-thumbnails');
    if (thumbs) {
      thumbs.innerHTML = capturedImages.map((img, i) => `
        <div style="position:relative;flex-shrink:0;width:56px;height:56px;border-radius:8px;overflow:hidden;border:2px solid #fff;">
          <img src="data:image/jpeg;base64,${img}" style="width:100%;height:100%;object-fit:cover;">
          <button onclick="event.stopPropagation();CameraPage.removeImage(${i})"
            style="position:absolute;top:-2px;right:-2px;width:20px;height:20px;border-radius:50%;
            background:rgba(0,0,0,0.6);color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center;">
            ✕
          </button>
        </div>
      `).join('');
    }

    // Enable/disable analyze button
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) {
      if (capturedImages.length > 0) {
        analyzeBtn.style.opacity = '1';
        analyzeBtn.style.pointerEvents = 'auto';
      } else {
        analyzeBtn.style.opacity = '0.3';
        analyzeBtn.style.pointerEvents = 'none';
      }
    }
  }

  async function analyze() {
    if (capturedImages.length === 0) return;

    stopCamera();
    Loading.show('📖 텍스트를 인식하고 있어요...');

    try {
      // Step 1: OCR
      Loading.updateMessage('📷 이미지에서 텍스트 추출 중...');
      let ocrResult;
      if (capturedImages.length === 1) {
        ocrResult = await GeminiAPI.extractText(capturedImages[0]);
      } else {
        ocrResult = await GeminiAPI.extractTextBatch(capturedImages);
      }

      if (!ocrResult?.text) {
        Loading.hide();
        Toast.error('글자를 찾지 못했어요. 더 밝은 곳에서 다시 찍어보세요 📷');
        startCamera();
        return;
      }

      // Step 2: Word Analysis
      Loading.updateMessage('📝 단어를 분석하고 있어요...');
      const level = Store.get('level');
      const wordResult = await GeminiAPI.analyzeWords(ocrResult.text, level);

      // Step 3: Save scan
      const scanId = await DB.addScan({
        images: capturedImages.length,
        extractedText: ocrResult.text,
        paragraphs: ocrResult.paragraphs || [],
        wordCount: wordResult?.words?.length || 0,
        bookTitle: '',
      });

      // Step 4: Save words
      if (wordResult?.words?.length > 0) {
        const wordsToSave = wordResult.words.map(w => ({
          word: w.word,
          meaning: w.meaning,
          pos: w.pos,
          pronunciation: w.pronunciation || '',
          level: w.level || level,
          example: w.example || '',
          exampleMeaning: w.exampleMeaning || '',
          scanId: scanId,
        }));
        const newCount = await DB.addWords(wordsToSave);
        await DB.updateTodayStats({ wordsLearned: newCount, scanCount: 1 });
      }

      Loading.hide();
      capturedImages = [];

      // Navigate to result
      Store.set('currentScan', {
        id: scanId,
        text: ocrResult.text,
        paragraphs: ocrResult.paragraphs || [],
        words: wordResult?.words || [],
      });

      Router.navigate('/scan-result', { id: scanId });

    } catch (err) {
      Loading.hide();
      console.error('Analyze error:', err);

      if (err.message === 'NO_API_KEY') {
        Toast.error('먼저 Gemini API Key를 입력해주세요');
        Router.navigate('/settings');
      } else if (err.message === 'QUOTA_EXCEEDED') {
        Toast.error('오늘 무료 사용량을 다 썼어요. 내일 다시 시도해주세요 😊');
      } else if (err.message === 'INVALID_API_KEY') {
        Toast.error('API Key가 유효하지 않아요. 다시 확인해주세요');
      } else if (err.message === 'RATE_LIMIT') {
        Toast.warning('잠시 후 다시 시도해주세요 (분당 요청 한도)');
      } else {
        Toast.error('잠깐 문제가 생겼어요. 다시 시도해주세요');
      }
      startCamera();
    }
  }

  return { render, capture, handleGallery, removeImage, analyze, stopCamera };
})();
