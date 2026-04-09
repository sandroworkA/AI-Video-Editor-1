/**
 * Handles all video processing using FFmpeg.wasm
 * Isolated so you can swap in cloud processing later without changing UI
 */
export class FFmpegEngine {
    constructor() {
        this.ffmpeg = null;
        this.ready = false;
        this.onProgress = null; // Callback for progress updates
    }

    async init() {
        if (this.ready) return;
        
        const { FFmpeg } = window.FFmpeg;
        this.ffmpeg = new FFmpeg();
        
        await this.ffmpeg.load({
            coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.js',
            wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.wasm',
        });
        
        this.ready = true;
    }

    /**
     * Main processing pipeline
     * @param {File} inputFile - Source video
     * @param {Object} analysis - From VideoAnalyzer
     * @param {Object} options - User settings (platform, intensity, etc)
     */
    async process(inputFile, analysis, options) {
        await this.init();
        
        const inputName = 'input.mp4';
        const outputName = `output_${Date.now()}.mp4`;
        
        // Write input
        await this.ffmpeg.writeFile(inputName, await window.FFmpeg.fetchFile(inputFile));
        
        // Build complex filter command
        const filterComplex = this.buildFilterComplex(analysis, options);
        
        // Execute
        await this.ffmpeg.exec([
            '-i', inputName,
            '-filter_complex', filterComplex,
            '-map', '[v]',
            '-map', '[a]',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-movflags', '+faststart',
            '-pix_fmt', 'yuv420p',
            '-y',
            outputName
        ]);
        
        // Read result
        const data = await this.ffmpeg.readFile(outputName);
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        
        // Cleanup
        await this.ffmpeg.deleteFile(inputName);
        await this.ffmpeg.deleteFile(outputName);
        
        return {
            blob,
            url: URL.createObjectURL(blob),
            filename: outputName
        };
    }

    buildFilterComplex(analysis, options) {
        const { segments } = analysis;
        const { platform, intensity } = options;
        
        const keepSegments = segments.filter(s => s.action !== 'cut');
        const videoTrims = [];
        const audioTrims = [];
        let filterIndex = 0;
        
        // Build trim filters for each kept segment
        keepSegments.forEach((seg, i) => {
            let speed = seg.action === 'compress' ? 2.0 : 1.0;
            const duration = (seg.end - seg.start) / speed;
            
            // Video trim
            let vFilter = `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS`;
            
            // Apply zoom if needed
            if (seg.effects.includes('zoom') && intensity > 0.5) {
                const zoomLevel = 1 + (0.2 * intensity);
                vFilter += `,zoompan=z='if(lte(in,30),${zoomLevel},1)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`;
            }
            
            // Speed up if compressed
            if (speed > 1) {
                vFilter += `,setpts=PTS/${speed}`;
            }
            
            // Platform crop (TikTok vertical)
            if (platform === 'tiktok') {
                vFilter += `,crop=ih*9/16:ih:(iw-ih*9/16)/2:0`;
            }
            
            vFilter += `[v${i}];`;
            videoTrims.push(vFilter);
            
            // Audio trim with processing
            let aFilter = `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS`;
            
            if (speed > 1) aFilter += `,atempo=${speed}`;
            if (seg.effects.includes('audio_boost')) aFilter += `,volume=2.0`;
            if (options.normalizeAudio) aFilter += `,loudnorm=I=-14:TP=-1.5:LRA=11`;
            
            aFilter += `[a${i}];`;
            audioTrims.push(aFilter);
        });
        
        // Concatenate all segments
        const vConcat = keepSegments.map((_, i) => `[v${i}]`).join('') + 
                       `concat=n=${keepSegments.length}:v=1:a=0[v];`;
        const aConcat = keepSegments.map((_, i) => `[a${i}]`).join('') + 
                       `concat=n=${keepSegments.length}:v=0:a=1[a]`;
        
        return [...videoTrims, ...audioTrims, vConcat, aConcat].join('');
    }
}
