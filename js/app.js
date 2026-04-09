import { VideoAnalyzer } from './modules/VideoAnalyzer.js';
import { FFmpegEngine } from './modules/FFmpegEngine.js';
import { UIManager } from './modules/UIManager.js';

/**
 * Main Application Controller
 * Coordinates between UI, AI Analysis, and Video Processing
 * Does NOT contain business logic - just orchestration
 */
class StyleSyncApp {
    constructor() {
        this.ui = new UIManager('main-container');
        this.analyzer = new VideoAnalyzer();
        this.engine = new FFmpegEngine();
        
        this.currentFile = null;
        this.currentAnalysis = null;
        this.videoElement = document.createElement('video');
        
        this.bindEvents();
    }

    bindEvents() {
        this.ui.onFileSelect((file) => this.handleUpload(file));
        this.ui.onProcess((settings) => this.handleProcess(settings));
    }

    async handleUpload(file) {
        this.currentFile = file;
        const url = URL.createObjectURL(file);
        this.videoElement.src = url;
        
        // Wait for metadata
        await new Promise(resolve => {
            this.videoElement.onloadedmetadata = resolve;
        });
        
        // Phase 1: Analysis
        this.ui.showAnalysisProgress('Analyzing content structure...', 20);
        
        // Simulate progressive analysis
        const steps = [
            { msg: 'Detecting scene changes...', progress: 40 },
            { msg: 'Scoring content value...', progress: 60 },
            { msg: 'Planning dynamic zooms...', progress: 80 },
            { msg: 'Finalizing edit plan...', progress: 100 }
        ];
        
        for (const step of steps) {
            await new Promise(r => setTimeout(r, 400));
            this.ui.showAnalysisProgress(step.msg, step.progress);
        }
        
        // Run actual analysis
        this.currentAnalysis = await this.analyzer.analyze(file, this.videoElement);
        
        // Phase 2: Show Editor
        this.ui.showEditor(url, this.currentAnalysis);
    }

    async handleProcess(settings) {
        this.ui.showExportProgress(0, 'Initializing video engine...');
        
        try {
            // Simulate progress updates during processing
            const updateProgress = (percent, status) => {
                this.ui.showExportProgress(percent, status);
            };
            
            updateProgress(10, 'Loading FFmpeg...');
            await this.engine.init();
            
            updateProgress(30, 'Analyzing video stream...');
            
            // Actual processing
            const result = await this.engine.process(
                this.currentFile,
                this.currentAnalysis,
                settings
            );
            
            updateProgress(90, 'Finalizing output...');
            await new Promise(r => setTimeout(r, 500)); // Small delay for UI
            
            updateProgress(100, 'Complete!');
            this.ui.showCompleteDownload(result.url, result.filename);
            
        } catch (error) {
            console.error('Processing failed:', error);
            alert('Error processing video. Please try again.');
            this.ui.showEditor(URL.createObjectURL(this.currentFile), this.currentAnalysis);
        }
    }
}

// Start app when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new StyleSyncApp();
});
