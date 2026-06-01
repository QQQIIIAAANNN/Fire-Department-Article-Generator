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
        { checkboxId: 'topic-custom-publicity', drawerId: 'drawer-custom-publicity' }
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

            // Standard client-side JSON request payload for Gemini 2.5 Flash Lite API
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }],
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
            copyBtn.disabled = false;
            downloadBtn.disabled = false;
        } catch (error) {
            console.error(error);
            showToast(`生成失敗：${error.message}`, 'error');
            viewEmpty.style.display = 'flex';
            viewLoading.style.display = 'none';
        } finally {
            generateBtn.disabled = false;
        }
    });

    // Helper: Build the optimal Prompt for Taiwanese Fire Department article style
    function buildPrompt({ date, location, unit, tone, length, photoCount, subjects }) {
        const formattedSubjects = subjects.map(s => {
            return `【主題：${s.title} (${s.type === 'training' ? '體技能訓練' : '消防宣導'})】\n大綱要點：${s.outlines.join('、')}`;
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
        docContactCell.textContent = pubContactInput.value.trim();
        docPhoneCell.textContent = pubPhoneInput.value.trim();
        
        docSubjectCell.innerHTML = `<b>主題：</b>${data.title}`;
        docContentCell.innerHTML = data.content.replace(/\n/g, '<br>');
        
        // Render editable doc photos list
        docPhotosCell.innerHTML = '';
        if (count > 0) {
            state.uploadedPhotos.forEach((photo, idx) => {
                const item = document.createElement('div');
                item.className = 'doc-photo-item';
                item.innerHTML = `
                    <div class="doc-photo-img-wrapper">
                        <img src="${photo.base64}">
                    </div>
                    <div style="max-width: 400px; margin: 5px auto;">
                        <input type="text" class="text-input doc-photo-input" value="${photo.description || ''}" style="width: 100%; text-align: center; font-size: 12px; padding: 6px;" data-index="${idx}">
                    </div>
                `;
                
                // Allow dynamic adjustment of photo descriptions
                item.querySelector('.doc-photo-input').addEventListener('input', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    state.uploadedPhotos[index].description = e.target.value;
                    state.generatedData.photoDescriptions[index] = e.target.value;
                });

                docPhotosCell.appendChild(item);
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
        return `中華民國 ${rocYear} 年 ${month} 月 ${date} 日`;
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

        // 1. Build photo items in HTML format
        let photosHtml = '';
        state.uploadedPhotos.forEach((photo) => {
            // Word seamlessly renders Base64 embedded source images inside HTML documents!
            photosHtml += `
                <div style="margin-bottom: 25px; text-align: center;">
                    <div style="max-width: 450px; margin: 0 auto 8px; border: 1px solid #d3d3d3; padding: 4px; display: inline-block;">
                        <img src="${photo.base64}" style="width: 450px; max-width: 100%; height: auto;" />
                    </div>
                    <div style="font-size: 12pt; font-family: DFKai-SB, 標楷體; font-weight: bold; margin-top: 5px; color: #333;">
                        ${photo.description}
                    </div>
                </div>
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
                    margin: 72pt 90pt 72pt 90pt; /* Margins: top/bottom 2.54cm, left/right 3.17cm */
                }
                body {
                    font-family: DFKai-SB, 標楷體, 'Microsoft JhengHei', sans-serif;
                    font-size: 14pt;
                    line-height: 1.8;
                    color: #000000;
                }
                .doc-title {
                    color: #ff0000;
                    font-size: 24pt;
                    font-weight: bold;
                    text-align: center;
                    letter-spacing: 4px;
                    margin: 0;
                }
                .doc-subtitle {
                    color: #ff0000;
                    font-size: 18pt;
                    font-weight: bold;
                    text-align: center;
                    letter-spacing: 12px;
                    text-indent: 12px;
                    margin: 0 0 15px 0;
                }
                .doc-line {
                    border-top: 3px double #ff0000;
                    margin-bottom: 20px;
                }
                .meta-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 25px;
                    font-size: 12pt;
                }
                .meta-table td {
                    border: 1px solid #7f7f7f;
                    padding: 8px 12px;
                }
                .meta-table td.lbl {
                    font-weight: bold;
                    background: #f2f2f2;
                    text-align: center;
                    width: 15%;
                }
                .meta-table td.val {
                    width: 35%;
                }
                .subject {
                    font-size: 16pt;
                    font-weight: bold;
                    margin: 20px 0;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #d3d3d3;
                }
                .content {
                    font-size: 14pt;
                    line-height: 2.0;
                    text-align: justify;
                    text-indent: 28pt; /* Indent exactly 2 characters (14pt * 2) */
                    margin-bottom: 30px;
                }
                .photos-section {
                    margin-top: 30px;
                    border-top: 1px dashed #7f7f7f;
                    padding-top: 20px;
                }
            </style>
        </head>
        <body>
            <p class="doc-title">苗栗縣政府消防局第一大隊公館分隊</p>
            <p class="doc-subtitle">新聞稿</p>
            <div class="doc-line"></div>
            
            <table class="meta-table">
                <tr>
                    <td class="lbl">發稿日期</td>
                    <td class="val">${rocDate}</td>
                    <td class="lbl">聯 絡 人</td>
                    <td class="val">${contact}</td>
                </tr>
                <tr>
                    <td class="lbl">聯絡電話</td>
                    <td class="val" colspan="3">${phone}</td>
                </tr>
            </table>

            <p class="subject"><b>主題：</b>${data.title}</p>

            <div class="content">
                ${data.content.replace(/\n/g, '<br>')}
            </div>

            <div class="photos-section">
                ${photosHtml}
            </div>
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
