/**
 * Handles all DOM manipulation and user interactions
 * Can be completely rewritten (e.g., switch to React) without touching AI logic
 */
export class UIManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.elements = {};
        this.callbacks = {};
        
        this.cacheElements();
        this.bindEvents();
    }

    cacheElements() {
        this.elements = {
            uploadZone: document.getElementById('upload-zone'),
            fileInput: document.getElementById('file-input'),
            analysisPanel: document.getElementById('analysis-panel'),
            analysisBar: document.getElementById('analysis-bar'),
            analysisText: document.getElementById('analysis-text'),
            editorPanel: document.getElementById('editor-panel'),
            previewVideo: document.getElementById('preview-video'),
            timelineContainer: document.getElementById('timeline-container'),
            controlsSection: document.getElementById('controls'),
            exportPanel: document.getElementById('export-panel'),
            exportBar: document.getElementById('export-bar'),
            exportText: document.getElementById('export-status-text'),
            downloadLink: document.getElementById('download-link'),
            exportSpinner: document.getElementById('export-spinner')
        };
    }

    bindEvents() {
        const { uploadZone, fileInput } = this.elements;
        
        // Drag and drop
        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.querySelector('.drop-area').classList.add('dragover');
        });
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.querySelector('.drop-area').classList.remove('dragover');
        });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.querySelector('.drop-area').classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
    }

    handleFileSelect(file) {
        if (this.callbacks.onFileSelect) {
            this.callbacks.onFileSelect(file);
        }
    }

    showPanel(panelName) {
        ['uploadZone', 'analysisPanel', 'editorPanel', 'exportPanel'].forEach(name => {
            this.elements[name].classList.add('hidden');
        });
        this.elements[`${panelName}Panel`].classList.remove('hidden');
    }

    // Analysis Phase
    showAnalysisProgress(step, percent) {
        this.showPanel('analysis');
        this.elements.analysisBar.style.width = `${percent}%`;
        this.elements.analysisText.textContent = step;
    }

    // Editor Phase
    showEditor(videoUrl, analysis) {
        this.showPanel('editor');
        this.elements.previewVideo.src = videoUrl;
        this.renderTimeline(analysis.segments);
        this.renderControls(analysis);
    }

    renderTimeline(segments) {
        const container = this.elements.timelineContainer;
        container.innerHTML = '';
        
        const totalDuration = segments[segments.length - 1]?.end || 0;
        
        segments.forEach(seg => {
            const div = document.createElement('div');
            div.className = `timeline-segment segment-${seg.action}`;
            div.style.width = `${(seg.duration / totalDuration) * 100}%`;
            div.title = `${seg.start.toFixed(1)}s - Score: ${Math.round(seg.score)}`;
            
            if (seg.effects.includes('zoom')) {
                div.style.border = '2px solid #6366f1';
            }
            
            container.appendChild(div);
        });
    }

    renderControls(analysis) {
        const container = this.elements.controlsSection;
        
        container.innerHTML = `
            <div class="control-group">
                <label>Edit Intensity</label>
                <input type="range" id="intensity" min="0" max="100" value="75">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">
                    <span>Subtle</span>
                    <span>Aggressive</span>
                </div>
            </div>
            
            <div class="control-group">
                <label>Platform Preset</label>
                <select id="platform">
                    <option value="youtube">YouTube Standard</option>
                    <option value="tiktok">TikTok/Reels</option>
                    <option value="cinematic">Cinematic</option>
                    <option value="podcast">Podcast</option>
                </select>
            </div>
            
            <div class="control-group">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                    <input type="checkbox" id="normalize-audio" checked style="width: auto;">
                    <span>Normalize Audio (-14 LUFS)</span>
                </label>
            </div>
            
            <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.875rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: #94a3b8;">Original:</span>
                    <span>${this.formatTime(analysis.totalDuration)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; color: #10b981;">
                    <span>Estimated:</span>
                    <span>${this.formatTime(analysis.estimatedDuration)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: #94a3b8;">Cuts:</span>
                    <span style="color: #6366f1;">${analysis.cutsPlanned}</span>
                </div>
            </div>
            
            <button id="process-btn" class="btn-primary">Generate Perfect Edit</button>
        `;
        
        document.getElementById('process-btn').addEventListener('click', () => {
            const settings = {
                intensity: document.getElementById('intensity').value / 100,
                platform: document.getElementById('platform').value,
                normalizeAudio: document.getElementById('normalize-audio').checked
            };
            
            if (this.callbacks.onProcess) {
                this.callbacks.onProcess(settings);
            }
        });
    }

    // Export Phase
    showExportProgress(percent, status) {
        this.showPanel('export');
        this.elements.exportBar.querySelector('.progress-fill')?.remove();
        
        if (!this.elements.exportBar.querySelector('.progress-fill')) {
            const fill = document.createElement('div');
            fill.className = 'progress-fill';
            this.elements.exportBar.appendChild(fill);
        }
        
        this.elements.exportBar.querySelector('.progress-fill').style.width = `${percent}%`;
        this.elements.exportText.textContent = status;
    }

    showCompleteDownload(url, filename) {
        this.elements.exportSpinner.style.display = 'none';
        this.elements.exportText.textContent = 'Edit Complete!';
        this.elements.downloadLink.href = url;
        this.elements.downloadLink.download = filename;
        this.elements.downloadLink.classList.remove('hidden');
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // Event registration
    onFileSelect(callback) { this.callbacks.onFileSelect = callback; }
    onProcess(callback) { this.callbacks.onProcess = callback; }
}
