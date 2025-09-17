/**
 * 音频管理器
 * 处理游戏音效和背景音乐
 */

class AudioManager {
    /**
     * 构造函数
     */
    constructor() {
        this.enabled = true;
        this.volume = 0.7;
        this.audioContext = null;
        this.sounds = new Map();
        
        this.initializeAudioContext();
        this.createSounds();
    }

    /**
     * 初始化音频上下文
     */
    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API 不支持');
            this.enabled = false;
        }
    }

    /**
     * 创建音效
     */
    createSounds() {
        if (!this.enabled) return;

        // 创建各种音效
        this.sounds.set('drop', this.createTone(220, 0.1, 'square'));
        this.sounds.set('lineClear', this.createTone(440, 0.3, 'sine'));
        this.sounds.set('tetris', this.createTone(880, 0.5, 'sine'));
        this.sounds.set('gameOver', this.createTone(110, 1.0, 'sawtooth'));
        this.sounds.set('move', this.createTone(330, 0.05, 'square'));
        this.sounds.set('rotate', this.createTone(550, 0.08, 'triangle'));
        this.sounds.set('hold', this.createTone(660, 0.1, 'sine'));
        this.sounds.set('attack', this.createTone(150, 0.2, 'sawtooth'));
    }

    /**
     * 创建音调
     * @param {number} frequency - 频率
     * @param {number} duration - 持续时间
     * @param {string} type - 波形类型
     * @returns {Function} 播放函数
     */
    createTone(frequency, duration, type = 'sine') {
        return () => {
            if (!this.enabled || !this.audioContext) return;

            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                oscillator.type = type;

                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + duration);
            } catch (e) {
                console.log('音效播放失败:', e);
            }
        };
    }

    /**
     * 播放音效
     * @param {string} soundName - 音效名称
     */
    playSound(soundName) {
        if (!this.enabled) return;

        const sound = this.sounds.get(soundName);
        if (sound) {
            sound();
        }
    }

    /**
     * 播放行消除音效
     * @param {number} lines - 消除行数
     */
    playLineClearSound(lines) {
        if (!this.enabled) return;

        switch (lines) {
            case 1:
                this.playSound('lineClear');
                break;
            case 2:
                this.playSound('lineClear');
                setTimeout(() => this.playSound('lineClear'), 100);
                break;
            case 3:
                this.playSound('lineClear');
                setTimeout(() => this.playSound('lineClear'), 100);
                setTimeout(() => this.playSound('lineClear'), 200);
                break;
            case 4:
                this.playSound('tetris');
                break;
        }
    }

    /**
     * 播放背景音乐
     */
    playBackgroundMusic() {
        if (!this.enabled) return;
        
        // 简单的背景音乐循环
        this.playMelody();
    }

    /**
     * 播放旋律
     */
    playMelody() {
        if (!this.enabled || !this.audioContext) return;

        const notes = [
            { freq: 659.25, duration: 0.5 }, // E
            { freq: 493.88, duration: 0.25 }, // B
            { freq: 523.25, duration: 0.25 }, // C
            { freq: 587.33, duration: 0.5 }, // D
            { freq: 523.25, duration: 0.25 }, // C
            { freq: 493.88, duration: 0.25 }, // B
            { freq: 440.00, duration: 0.5 }, // A
        ];

        let currentTime = this.audioContext.currentTime;

        notes.forEach(note => {
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.setValueAtTime(note.freq, currentTime);
                oscillator.type = 'square';

                gainNode.gain.setValueAtTime(0, currentTime);
                gainNode.gain.linearRampToValueAtTime(this.volume * 0.1, currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);

                oscillator.start(currentTime);
                oscillator.stop(currentTime + note.duration);

                currentTime += note.duration;
            } catch (e) {
                console.log('旋律播放失败:', e);
            }
        });

        // 循环播放
        setTimeout(() => {
            if (this.enabled) {
                this.playMelody();
            }
        }, currentTime * 1000 + 2000);
    }

    /**
     * 设置音量
     * @param {number} volume - 音量 (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 启用/禁用音频
     * @param {boolean} enabled - 是否启用
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (enabled && !this.audioContext) {
            this.initializeAudioContext();
        }
    }

    /**
     * 恢复音频上下文（用户交互后）
     */
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// 创建全局音频管理器实例
window.audioManager = new AudioManager();

// 用户首次交互时恢复音频上下文
document.addEventListener('click', () => {
    window.audioManager.resumeAudioContext();
}, { once: true });

document.addEventListener('keydown', () => {
    window.audioManager.resumeAudioContext();
}, { once: true });