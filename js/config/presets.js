// Platform-specific configurations
// Edit these numbers to tune AI behavior without touching code logic

export const PlatformPresets = {
    youtube: {
        name: 'YouTube (16:9)',
        aspectRatio: '16:9',
        cutInterval: 5,           // Cut every 5 seconds max
        zoomIntensity: 1.3,       // 130% zoom max
        audioTarget: -14,         // LUFS standard
        minSegmentDuration: 0.5,  // Don't keep clips shorter than 0.5s
        paceMultiplier: 1.2
    },
    
    tiktok: {
        name: 'TikTok/Reels (9:16)',
        aspectRatio: '9:16',
        cutInterval: 2,           // Faster cuts
        zoomIntensity: 1.5,       // More aggressive zooms
        audioTarget: -12,
        minSegmentDuration: 0.3,
        paceMultiplier: 1.8,      // Speed up slightly
        verticalCrop: true
    },
    
    cinematic: {
        name: 'Cinematic',
        aspectRatio: '16:9',
        cutInterval: 10,          // Longer takes
        zoomIntensity: 1.1,       // Subtle zooms only
        audioTarget: -16,         // Film standard
        minSegmentDuration: 2.0,  // Preserve flow
        paceMultiplier: 1.0
    },
    
    podcast: {
        name: 'Podcast/Interview',
        aspectRatio: '16:9',
        cutInterval: 30,          // Minimal cuts
        zoomIntensity: 1.0,       // No zooms
        audioTarget: -14,
        minSegmentDuration: 5.0,  // Keep conversation natural
        paceMultiplier: 1.0,
        preserveSilence: true     // Don't cut breaths/pauses
    }
};

// AI Scoring Thresholds
export const AIConfig = {
    silenceThreshold: -30,        // dB level considered silence
    fillerWords: ['um', 'uh', 'like', 'you know', 'sort of'],
    minSilenceDuration: 0.8,      // Seconds of silence before cutting
    highEnergyThreshold: 0.7,     // 0-1 scale for zoom triggers
    
    // Content scoring (0-100)
    scores: {
        GOLD: 85,      // Always keep, add zoom
        SILVER: 65,    // Keep but no effects
        BRONZE: 40,    // Compress if needed
        CUT: 0         // Remove
    }
};
