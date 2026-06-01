/* ==========================================
   消防分隊文章生成器 - Core Application JS
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. App State & Cache Variables
    const state = {
        uploadedPhotos: [], // Array of { id, file, base64, name }
        activeTab: 'fbView',
        activeTone: '專業嚴謹',
        activeLength: '中等 (約500字)',
        generatedData: null // Stores { title, content, photoDescriptions: [] }
    };

    // 2. DOM Elements Selection
    const apiKeyInput = document.getElementById('apiKey');
    const toggleApiShowBtn = document.getElementById('toggleApiShow');
    const postDateInput = document.getElementById('postDate');
    const pubLocationInput = document.getElementById('pubLocation');
    const pubContactInput = document.getElementById('pubContact');
    const pubPhoneInput = document.getElementById('pubPhone');
    const toneGroup = document.getElementById('toneGroup');
    const lengthGroup = document.getElementById('lengthGroup');
    
    // File upload elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const photoGallery = document.getElementById('photoGallery');
    
    // Actions & Previews
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    const tabFb = document.getElementById('tabFb');
    const tabDoc = document.getElementById('tabDoc');
    
    const viewEmpty = document.getElementById('viewEmpty');
    const viewLoading = document.getElementById('viewLoading');
    const viewFb = document.getElementById('viewFb');
    const viewDoc = document.getElementById('viewDoc');
    
    const fbPreviewBody = document.getElementById('fbPreviewBody');
    const fbPreviewPhotos = document.getElementById('fbPreviewPhotos');
    const fbMetaDate = document.getElementById('fbMetaDate');
    
    const docDateCell = document.getElementById('docDateCell');
    const docContactCell = document.getElementById('docContactCell');
    const docPhoneCell = document.getElementById('docPhoneCell');
    const docSubjectCell = document.getElementById('docSubjectCell');
    const docContentCell = document.getElementById('docContentCell');
    const docPhotosCell = document.getElementById('docPhotosCell');
    
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');

    // ==========================================
    // 3. Initialization & LocalStorage Cache
    // ==========================================
    
    // Set postDate default as today's local date
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    postDateInput.value = `${yyyy}-${mm}-${dd}`;

    // Load saved API Key from localStorage
    const savedApiKey = localStorage.getItem('fire_gemini_api_key');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }

    // Save API key on change
    apiKeyInput.addEventListener('input', () => {
        localStorage.setItem('fire_gemini_api_key', apiKeyInput.value.trim());
    });

    // Toggle API Key password visibility
    toggleApiShowBtn.addEventListener('click', () => {
        const isPassword = apiKeyInput.type === 'password';
        apiKeyInput.type = isPassword ? 'text' : 'password';
        toggleApiShowBtn.querySelector('i').className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });

    // Clear API Key button listener
    const clearApiBtn = document.getElementById('clearApiKey');
    if (clearApiBtn) {
        clearApiBtn.addEventListener('click', () => {
            if (confirm('確定要清除儲存在此電腦本機的 Gemini API 金鑰嗎？')) {
                localStorage.removeItem('fire_gemini_api_key');
                apiKeyInput.value = '';
                showToast('已成功清除本機 API 金鑰！', 'success');
            }
        });
    }

    // ==========================================
    // 4. Collapsible Drawer Event Handlers
    // ==========================================
    const subjects = [
        { checkboxId: 'topic-cushion', drawerId: 'drawer-cushion' },
        { checkboxId: 'topic-firstaid', drawerId: 'drawer-firstaid' },
        { checkboxId: 'topic-scba', drawerId: 'drawer-scba' },
        { checkboxId: 'topic-physical', drawerId: 'drawer-physical' },
        { checkboxId: 'topic-custom-training', drawerId: 'drawer-custom-training' },
        { checkboxId: 'topic-detector', drawerId: 'drawer-detector' },
        { checkboxId: 'topic-water', drawerId: 'drawer-water' },
        { checkboxId: 'topic-escape', drawerId: 'drawer-escape' },
        { checkboxId: 'topic-elec', drawerId: 'drawer-elec' },
        { checkboxId: 'topic-disaster', drawerId: 'drawer-disaster' },
        { checkboxId: 'topic-custom-publicity', drawerId: 'drawer-custom-publicity' },
        { checkboxId: 'topic-rescue-fire', drawerId: 'drawer-rescue-fire' },
        { checkboxId: 'topic-rescue-car', drawerId: 'drawer-rescue-car' },
        { checkboxId: 'topic-rescue-rope', drawerId: 'drawer-rescue-rope' },
        { checkboxId: 'topic-rescue-water', drawerId: 'drawer-rescue-water' },
        { checkboxId: 'topic-custom-rescue', drawerId: 'drawer-custom-rescue' },
        { checkboxId: 'topic-event-volunteer', drawerId: 'drawer-event-volunteer' },
        { checkboxId: 'topic-event-maintenance', drawerId: 'drawer-event-maintenance' },
        { checkboxId: 'topic-event-donation', drawerId: 'drawer-event-donation' },
        { checkboxId: 'topic-event-hydrant', drawerId: 'drawer-event-hydrant' },
        { checkboxId: 'topic-custom-event', drawerId: 'drawer-custom-event' }
    ];

    subjects.forEach(({ checkboxId, drawerId }) => {
        const checkbox = document.getElementById(checkboxId);
        const drawer = document.getElementById(drawerId);
        if (checkbox && drawer) {
            checkbox.addEventListener('change', () => {
                drawer.style.display = checkbox.checked ? 'block' : 'none';
            });
        }
    });

    // Dynamic 'Other' input drawer toggle logic
    document.addEventListener('change', (e) => {
        const cb = e.target.closest('.other-cb');
        if (!cb) return;
        const inputId = cb.dataset.inputId;
        const input = document.getElementById(inputId);
        if (input) {
            input.style.display = cb.checked ? 'inline-block' : 'none';
            if (cb.checked) {
                input.focus();
            }
        }
    });

    // ==========================================
    // 5. Selector Groups Logic (Tone & Length)
    // ==========================================
    
    // Tone Selector
    toneGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.select-btn');
        if (!btn) return;
        toneGroup.querySelectorAll('.select-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeTone = btn.dataset.value;
    });

    // Length Selector
    lengthGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.select-btn');
        if (!btn) return;
        lengthGroup.querySelectorAll('.select-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeLength = btn.dataset.value;
    });

    // ==========================================
    // 6. Real Photo Upload & Compression Logic
    // ==========================================
    
    // Drag & Drop event bindings
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });

    // Process and compress files
    function handleFiles(files) {
        if (state.uploadedPhotos.length + files.length > 4) {
            showToast('最多只能上傳 4 張照片！', 'error');
            return;
        }

        Array.from(files).forEach(file => {
            if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
                showToast('不支援的檔案格式，請上傳 JPG 或 PNG 圖片！', 'error');
                return;
            }

            compressImage(file, (base64Data) => {
                const photoId = 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                state.uploadedPhotos.push({
                    id: photoId,
                    file: file,
                    base64: base64Data,
                    name: file.name
                });
                renderPhotoGallery();
            });
        });
    }

    // Canvas-based Image resizing and compression (limits size for Word document integration)
    function compressImage(file, callback) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Max limit size: 800px on the longest edge
                const maxEdge = 800;
                if (width > maxEdge || height > maxEdge) {
                    if (width > height) {
                        height = Math.round((height * maxEdge) / width);
                        width = maxEdge;
                    } else {
                        width = Math.round((width * maxEdge) / height);
                        height = maxEdge;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Export as compressed JPEG format (0.8 quality)
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                callback(compressedBase64);
            };
        };
    }

    // Render photo uploader gallery
    function renderPhotoGallery() {
        photoGallery.innerHTML = '';
        state.uploadedPhotos.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `
                <img src="${photo.base64}" alt="${photo.name}">
                <button type="button" class="remove-btn" data-id="${photo.id}" title="移除照片">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="badge">張數 ${index + 1}</div>
            `;
            
            item.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const idToRemove = photo.id;
                state.uploadedPhotos = state.uploadedPhotos.filter(p => p.id !== idToRemove);
                renderPhotoGallery();
            });

            photoGallery.appendChild(item);
        });
    }

    // ==========================================
    // 7. Preview Switch Tabs Handler
    // ==========================================
    function switchTab(tabId) {
        state.activeTab = tabId;
        
        // Active Styles
        tabFb.classList.toggle('active', tabId === 'fbView');
        tabDoc.classList.toggle('active', tabId === 'docView');
        
        if (state.generatedData) {
            // Render specific tab
            viewEmpty.style.display = 'none';
            viewLoading.style.display = 'none';
            viewFb.style.display = tabId === 'fbView' ? 'block' : 'none';
            viewDoc.style.display = tabId === 'docView' ? 'block' : 'none';
        }
    }

    tabFb.addEventListener('click', () => switchTab('fbView'));
    tabDoc.addEventListener('click', () => switchTab('docView'));

    // ==========================================
    // 8. Gemini API Integration & Text Generation
    // ==========================================
    
    generateBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            showToast('請先填寫頂部的 Gemini API Key！', 'error');
            apiKeyInput.focus();
            return;
        }

        // Collect checked subjects and their outlines
        const promptSubjects = [];
        subjects.forEach(({ checkboxId, drawerId }) => {
            const mainCheckbox = document.getElementById(checkboxId);
            if (mainCheckbox && mainCheckbox.checked) {
                const subOutlines = [];
                const drawer = document.getElementById(drawerId);
                const subCheckboxes = drawer.querySelectorAll('.sub-pill-grid input[type="checkbox"]');
                subCheckboxes.forEach(subCb => {
                    if (subCb.checked) {
                        let text = subCb.dataset.text;
                        if (subCb.classList.contains('other-cb')) {
                            const inputId = subCb.dataset.inputId;
                            const inputVal = document.getElementById(inputId).value.trim();
                            text = inputVal ? inputVal : null;
                        }
                        if (text) {
                            subOutlines.push(text);
                        }
                    }
                });
                
                let title = mainCheckbox.dataset.title;
                if (checkboxId === 'topic-custom-training') {
                    const customTitle = document.getElementById('topic-custom-training-title').value.trim();
                    title = customTitle ? `自訂訓練：${customTitle}` : '自訂訓練項目';
                } else if (checkboxId === 'topic-custom-publicity') {
                    const customTitle = document.getElementById('topic-custom-publicity-title').value.trim();
                    title = customTitle ? `自訂宣導：${customTitle}` : '自訂宣導項目';
                } else if (checkboxId === 'topic-custom-rescue') {
                    const customTitle = document.getElementById('topic-custom-rescue-title').value.trim();
                    title = customTitle ? `自訂搶救：${customTitle}` : '自訂搶救項目';
                } else if (checkboxId === 'topic-custom-event') {
                    const customTitle = document.getElementById('topic-custom-event-title').value.trim();
                    title = customTitle ? `自訂業務：${customTitle}` : '自訂業務項目';
                }

                promptSubjects.push({
                    title: title,
                    type: mainCheckbox.dataset.type,
                    outlines: subOutlines
                });
            }
        });

        if (promptSubjects.length === 0) {
            showToast('請至少勾選一項今日主題與大綱！', 'error');
            return;
        }

        // Show loading screen
        viewEmpty.style.display = 'none';
        viewFb.style.display = 'none';
        viewDoc.style.display = 'none';
        viewLoading.style.display = 'flex';
        
        generateBtn.disabled = true;
        copyBtn.disabled = true;
        downloadBtn.disabled = true;

        try {
            // Build Gemini Structured System instructions and parameters
            const dateStr = postDateInput.value;
            const locationStr = pubLocationInput.value.trim() || '轄區內';
            const unitStr = '第一大隊公館分隊';
            const toneStr = state.activeTone;
            const lengthStr = state.activeLength;
            const photoCount = state.uploadedPhotos.length;

            const promptText = buildPrompt({
                date: dateStr,
                location: locationStr,
                unit: unitStr,
                tone: toneStr,
                length: lengthStr,
                photoCount: photoCount,
                subjects: promptSubjects
            });

            // Build multimodal parts list including both text prompt and base64 images
            const requestParts = [{ text: promptText }];
            state.uploadedPhotos.forEach((photo, idx) => {
                const matches = photo.base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                if (matches) {
                    const mimeType = matches[1];
                    const base64Data = matches[2];
                    requestParts.push({ text: `這是當天第 ${idx + 1} 張現場真實照片，請仔細看圖：` });
                    requestParts.push({
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    });
                }
            });

            // Standard client-side JSON request payload for Gemini 2.5 Flash Lite API
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: requestParts }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1500,
                        responseMimeType: "application/json" // Force Gemini to return standard JSON!
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Gemini API 連線失敗。');
            }

            const resData = await response.json();
            const jsonText = resData.candidates[0].content.parts[0].text;
            
            // Clean up potentially wrapped JSON string
            const cleanedJson = cleanJsonString(jsonText);
            const parsedData = JSON.parse(cleanedJson);
            
            state.generatedData = parsedData;
            
            // Sync generated descriptions back to state uploaded photos
            state.uploadedPhotos.forEach((photo, idx) => {
                if (parsedData.photoDescriptions && parsedData.photoDescriptions[idx]) {
                    photo.description = parsedData.photoDescriptions[idx];
                } else {
                    photo.description = `【照片${idx + 1}】公館消防分隊現場演練情形。`;
                }
            });

            showToast('文章生成成功！', 'success');
            renderGeneratedPreviews();

            // Enable Actions
        function buildPrompt({ date, location, unit, tone, length, photoCount, subjects }) {
        const formattedSubjects = subjects.map(s => {
            let typeStr = '消防宣導';
            if (s.type === 'training') typeStr = '體技能訓練';
            else if (s.type === 'rescue') typeStr = '災害搶救演練';
            else if (s.type === 'event') typeStr = '義消與分隊業務';
            return `【主題：${s.title} (${typeStr})】\n大綱要點：${s.outlines.join('、')}`;
        }).join('\n\n');

        return `你是一位專業的台灣消防局第一大隊公館分隊（位於苗栗縣公館鄉）新聞聯絡官，專門撰寫精美的新聞稿與社群媒體（Facebook）貼文。
請你根據以下提供的資訊，生成一篇完全符合公館分隊歷史發文風格、結構嚴謹且用詞專業的文章。

【基本設定】
- 發稿單位：${unit}
- 地點：${location}
- 發文日期時間：${date}
- 寫作字數要求：${length}
- 指定寫作語氣：${tone}
- 當天真實上傳照片張數：${photoCount} 張

【指定今日發文主題與大綱項目】
${formattedSubjects}

【消防分隊歷史範文風格結構指導（必須嚴格遵守）】
1. 第一段 (時事導入)：公館分隊於 [發文日期]（如：今（21）日、今（18）日等）在 [地點] 辦理 [主題項目]，描述同仁實際演練、操作或宣導情形。
2. 第二段 (專業細節/要領)：詳細敘述該項目的專業細節、操作步驟（例如：救生氣墊操作時的空氣洩壓、跳姿「雙手抱胸、下顎貼緊前胸躺姿自然落下」；住警器能即時警報爭取黃金時間等）。
3. 第三段 (教育宣導/提示)：融合消防專業常識對市民進行溫馨提醒（例如：燒燙傷牢記「沖、脫、泡、蓋、送」，戲水遵循防溺口訣「叫叫伸拋選」，居家用電切忌超載等）。
4. 第四段 (大隊表示/總結語)：以「苗栗縣政府消防局第一大隊表示...」做結，強調消防同仁以良好體能及扎實訓練作為後盾，時刻守護民眾生命財產安全，傳達專業可靠的正面形象。

【多模態現場相片與圖說分析說明】
- 我們已經將當天拍攝的真實相片以 inlineData 方式傳送給您。
- 請你仔細分析每張上傳照片中的真實畫面內容（例如：同仁正在操作的器材、演練情景、講授簡報或裝備等），寫出真實對應的相片圖說。
- 為每張相片撰寫極度簡短（**控制在 15 個字以內**）且精準的黑白公文用圖說（例如：『同仁操作救生氣墊情形。』）。請注意，照片描述必須與照片畫面中實際發生的事情完全對齊，絕不要憑空猜測！

【輸出格式要求】
請一定要返回一個合法的、乾淨的 JSON 物件，不可以包含任何 Markdown 格式標記（如 \`\`\`json ）。JSON 格式如下：
{
  "title": "設計一個吸睛、帶有消防橘亮點與驚嘆號的合適標題",
  "content": "生動流暢的完整新聞內文，分段明確，包含適當的標點符號與首行二字縮排",
  "photoDescriptions": [
    "請看第 1 張真實照片畫面，生成 15 字內精準圖說，例如：同仁操作救生氣墊情形。",
    "請看第 2 張真實照片畫面，生成 15 字內精準圖說（如果照片張數 >= 2）",
    "請看第 3 張真實照片畫面，生成 15 字內精準圖說（如果照片張數 >= 3）",
    "請看第 4 張真實照片畫面，生成 15 字內精準圖說（如果照片張數 >= 4）"
  ]
}

【特別強調】
- JSON 的 "photoDescriptions" 陣列長度必須剛好等於 ${photoCount} (如果張數為 0 則為空陣列 [])。
- 每個照片說明字數**絕對不可超過 15 個字**，不要包含任何 HTML 標記，不要加任何粗體！
- 文章中應使用台灣消防界的常用語彙與習慣用法，不可使用中國大陸用語（如：空氣呼吸器為 SCBA、燒燙傷處置、住警器等）。`;
    }��今（21）日、今（18）日等）在 [地點] 辦理 [主題項目]，描述同仁實際演練、操作或宣導情形。
2. 第二段 (專業細節/要領)：詳細敘述該項目的專業細節、操作步驟（例如：救生氣墊操作時的空氣洩壓、跳姿「雙手抱胸、下顎貼緊前胸躺姿自然落下」；住警器能即時警報爭取黃金時間等）。
3. 第三段 (教育宣導/提示)：融合消防專業常識對市民進行溫馨提醒（例如：燒燙傷牢記「沖、脫、泡、蓋、送」，戲水遵循防溺口訣「叫叫伸拋選」，居家用電切忌超載等）。
4. 第四段 (大隊表示/總結語)：以「苗栗縣政府消防局第一大隊表示...」做結，強調消防同仁以良好體能及扎實訓練作為後盾，時刻守護民眾生命財產安全，傳達專業可靠的正面形象。

【輸出格式要求】
請一定要返回一個合法的、乾淨的 JSON 物件，不可以包含任何 Markdown 格式標記（如 \`\`\`json ）。JSON 格式如下：
{
  "title": "設計一個吸睛、帶有消防橘亮點與驚嘆號的合適標題",
  "content": "生動流暢的完整新聞內文，分段明確，包含適當的標點符號與首行二字縮排",
  "photoDescriptions": [
    "根據生成的新聞稿內容，請為當天第 1 張真實照片生成合適的圖說，如：【照片一】公館分隊同仁進行救生氣墊固定與洩壓流程訓練。",
    "為第 2 張真實照片生成合適的圖說（如果上傳照片張數 >= 2）",
    "為第 3 張真實照片生成合適的圖說（如果上傳照片張數 >= 3）",
    "為第 4 張真實照片生成合適的圖說（如果上傳照片張數 >= 4）"
  ]
}

【特別強調】
- JSON 的 "photoDescriptions" 陣列長度必須剛好等於 ${photoCount} (如果張數為 0 則為空陣列 [])。
- 文章中應使用台灣消防界的常用語彙與習慣用法，不可使用中國大陸用語（如：空氣呼吸器為 SCBA、燒燙傷處置、住警器等）。`;
    }

    // Helper: Strips markdown wrappers around LLM's returned JSON
    function cleanJsonString(str) {
        let cleaned = str.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```json/, '').replace(/^```/, '').trim();
        }
        return cleaned;
    }

    // ==========================================
    // 9. Previews Rendering Engine
    // ==========================================
    
    function renderGeneratedPreviews() {
        if (!state.generatedData) return;
        
        const data = state.generatedData;
        const dateStr = postDateInput.value;
        const formattedDate = formatChineseDate(dateStr);

        // --- A. Facebook Preview Render ---
        fbMetaDate.textContent = formattedDate;
        
        // Formulate typical FB style post: Title + Body
        fbPreviewBody.innerHTML = `<strong>${data.title}</strong><br><br>${data.content.replace(/\n/g, '<br>')}`;
        
        // Render smart FB photo grid
        fbPreviewPhotos.innerHTML = '';
        const count = state.uploadedPhotos.length;
        if (count > 0) {
            fbPreviewPhotos.className = `fb-photo-grid grid-${count}`;
            state.uploadedPhotos.forEach(photo => {
                const img = document.createElement('img');
                img.src = photo.base64;
                img.className = 'grid-img';
                fbPreviewPhotos.appendChild(img);
            });
            fbPreviewPhotos.style.display = 'grid';
        } else {
            fbPreviewPhotos.style.display = 'none';
        }

        // --- B. Official Document Preview Render ---
        docDateCell.textContent = formatRocDate(dateStr);
        docContactCell.innerHTML = `聯絡人：${pubContactInput.value.trim()}`;
        docPhoneCell.innerHTML = `聯絡電話：${pubPhoneInput.value.trim()}`;
        
        docSubjectCell.innerHTML = `標題：${data.title}`;
        docContentCell.innerHTML = data.content.replace(/\n/g, '<br>');
        
        // Render editable doc photos list in a bordered table
        docPhotosCell.innerHTML = '';
        if (count > 0) {
            let tableHtml = `<table style="width:100%; border-collapse:collapse; border:1px solid #000; font-family:'DFKai-SB', '標楷體'; text-align:center; margin-top:15px;">`;
            state.uploadedPhotos.forEach((photo, idx) => {
                const photoIdx = idx + 1;
                tableHtml += `
                    <tr>
                        <td style="width:20%; border:1px solid #000; padding:10px; font-weight:normal; font-size:14px; background:#f9f9f9; color:#000;">照片 ${photoIdx}</td>
                        <td style="width:80%; border:1px solid #000; padding:15px; text-align:center;">
                            <img src="${photo.base64}" style="max-width:350px; max-height:220px; height:auto; display:inline-block; border:1px solid #ccc; padding:2px;">
                        </td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:10px; font-weight:normal; font-size:14px; background:#f9f9f9; color:#000;">說明</td>
                        <td style="border:1px solid #000; padding:10px; text-align:center;">
                            <input type="text" class="text-input doc-photo-input" value="${photo.description || ''}" style="width:90%; text-align:center; font-size:13px; color:#000; padding:6px; background:#fff; border:1px solid #ccc; border-radius:4px; display:inline-block;" data-index="${idx}">
                        </td>
                    </tr>
                `;
            });
            tableHtml += `</table>`;
            docPhotosCell.innerHTML = tableHtml;
            
            // Allow dynamic adjustment of photo descriptions
            docPhotosCell.querySelectorAll('.doc-photo-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    state.uploadedPhotos[index].description = e.target.value;
                    state.generatedData.photoDescriptions[index] = e.target.value;
                });
            });
        }

        // Show Viewport Content
        viewEmpty.style.display = 'none';
        viewLoading.style.display = 'none';
        
        // Toggle based on selected tab
        switchTab(state.activeTab);
    }

    // Helper: Convert YYYY-MM-DD to Republic of China (Taiwan) calendar standard
    function formatRocDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const rocYear = d.getFullYear() - 1911;
        const month = d.getMonth() + 1;
        const date = d.getDate();
        return `${rocYear}年${month}月${date}日`;
    }

    // Helper: Convert YYYY-MM-DD to friendly Chinese Date (e.g. 5月21日)
    function formatChineseDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const month = d.getMonth() + 1;
        const date = d.getDate();
        return `${month} 月 ${date} 日`;
    }

    // ==========================================
    // 10. Secondary Actions (Copy & Word Export)
    // ==========================================
    
    // Copy Text to Clipboard
    copyBtn.addEventListener('click', () => {
        if (!state.generatedData) return;
        
        const data = state.generatedData;
        const fullText = `${data.title}\n\n${data.content}`;
        
        navigator.clipboard.writeText(fullText).then(() => {
            showToast('文章內容已成功複製到剪貼簿！', 'success');
        }).catch((err) => {
            console.error('複製失敗:', err);
            showToast('複製失敗，請手動選取複製！', 'error');
        });
    });

    // Elegant Word File Export (.doc format) with Base64 embedded images
    downloadBtn.addEventListener('click', () => {
        if (!state.generatedData) return;

        const data = state.generatedData;
        const dateStr = postDateInput.value;
        const rocDate = formatRocDate(dateStr);
        const contact = pubContactInput.value.trim();
        const phone = pubPhoneInput.value.trim();

        // 1. Build photo items in Table format for Page 2
        let tableRowsHtml = '';
        state.uploadedPhotos.forEach((photo, idx) => {
            const photoIdx = idx + 1;
            // Word seamlessly renders Base64 embedded source images inside HTML documents!
            tableRowsHtml += `
                <tr style="page-break-inside: avoid;">
                    <td style="width: 20%; border: 1px solid #000000; padding: 12px; font-weight: normal; text-align: center; background-color: #f2f2f2; font-family: DFKai-SB, 標楷體; font-size: 14pt;">照片 ${photoIdx}</td>
                    <td style="width: 80%; border: 1px solid #000000; padding: 15px; text-align: center; vertical-align: middle;">
                        <img src="${photo.base64}" style="width: 350px; height: auto;" />
                    </td>
                </tr>
                <tr style="page-break-inside: avoid;">
                    <td style="border: 1px solid #000000; padding: 12px; font-weight: normal; text-align: center; background-color: #f2f2f2; font-family: DFKai-SB, 標楷體; font-size: 14pt;">說明</td>
                    <td style="border: 1px solid #000000; padding: 12px; text-align: center; font-family: DFKai-SB, 標楷體; font-size: 13pt; color: #000000;">
                        ${photo.description || ''}
                    </td>
                </tr>
            `;
        });

        // 2. Formulate HTML matching standard A4 Word Document margins and styles
        const docHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <title>${data.title}</title>
            <!--[if gte mso 9]>
            <xml>
                <w:WordDocument>
                    <w:View>Print</w:View>
                    <w:Zoom>100</w:Zoom>
                    <w:DoNotOptimizeForBrowser/>
                </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
                @page {
                    size: 595.3pt 841.9pt; /* A4 size standard */
                    margin: 72pt 72pt 72pt 72pt; /* Margins: top/bottom 2.54cm, left/right 2.54cm */
                }
                body {
                    font-family: DFKai-SB, 標楷體, 'Microsoft JhengHei', sans-serif;
                    font-size: 14pt;
                    line-height: 1.8;
                    color: #000000;
                }
                .doc-title {
                    font-size: 20pt;
                    font-weight: normal;
                    text-align: center;
                    margin: 0 0 5px 0;
                }
                .doc-date {
                    font-size: 16pt;
                    text-align: center;
                    margin: 0 0 30px 0;
                }
                .meta-section {
                    margin-bottom: 25px;
                    line-height: 1.8;
                }
                .meta-row {
                    margin-bottom: 8px;
                }
                .meta-label {
                    font-weight: normal;
                }
                .content {
                    font-size: 14pt;
                    line-height: 2.0;
                    text-align: justify;
                    text-indent: 28pt; /* Indent exactly 2 characters (14pt * 2) */
                    margin-bottom: 30px;
                }
                .page-break {
                    page-break-before: always;
                    clear: all;
                }
                .table-title {
                    font-size: 16pt;
                    font-weight: normal;
                    text-align: center;
                    margin: 30px 0 20px 0;
                    letter-spacing: 2px;
                }
                .photos-table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1px solid #000000;
                }
            </style>
        </head>
        <body>
            <!-- Page 1: News Article -->
            <p class="doc-title">苗栗縣政府消防局新聞稿</p>
            <p class="doc-date">${rocDate}</p>
            
            <div class="meta-section">
                <div class="meta-row">標題：${data.title}</div>
                <div class="meta-row">聯絡人：${contact}</div>
                <div class="meta-row">聯絡電話：${phone}</div>
                <div class="meta-row" style="margin-top: 15px;">內容：</div>
            </div>

            <div class="content">
                ${data.content.replace(/\n/g, '<br>')}
            </div>

            <!-- Page 2: Photo Evidence Paper -->
            ${tableRowsHtml ? `
            <br clear="all" class="page-break" />
            <p class="table-title">苗栗縣政府消防局現場照相資料用紙</p>
            <table class="photos-table">
                ${tableRowsHtml}
            </table>
            ` : ''}
        </body>
        </html>
        `;

        // 3. Convert HTML doc to binary Blob
        const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        // 4. Download Trigger
        const a = document.createElement('a');
        a.href = url;
        // Clean Title for filename
        const safeTitle = data.title.replace(/[\\/:*?"<>|]/g, '');
        a.download = `公館分隊新聞稿-${safeTitle}.doc`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup memory
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Word 文件下載成功！可在微軟 Word 中直接開啟。', 'success');
    });

    // ==========================================
    // 11. Toast Float Alert Engine
    // ==========================================
    let toastTimer;
    function showToast(message, type = 'info') {
        clearTimeout(toastTimer);
        
        toastMsg.textContent = message;
        toast.className = `toast show ${type}`;
        
        // Setup Icon based on type
        const icon = toast.querySelector('i');
        if (type === 'success') {
            icon.className = 'fa-solid fa-circle-check';
        } else if (type === 'error') {
            icon.className = 'fa-solid fa-triangle-exclamation';
        } else {
            icon.className = 'fa-solid fa-circle-info';
        }

        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
});
