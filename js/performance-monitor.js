/**
 * 性能监控器
 * 监控游戏性能，防止卡死和优化帧率
 */

class PerformanceMonitor {
    /**
     * 构造函数
     */
    constructor() {
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.fps = 60;
        this.frameTime = 0;
        this.maxFrameTime = 16.67; // 60fps对应的最大帧时间
        
        // 性能统计
        this.stats = {
            averageFrameTime: 0,
            maxFrameTime: 0,
            minFrameTime: Infinity,
            totalFrames: 0,
            droppedFrames: 0,
            aiUpdateTime: 0,
            renderTime: 0,
            uiUpdateTime: 0
        };
        
        // 性能阈值
        this.thresholds = {
            maxFrameTime: 33.33, // 30fps
            maxAIUpdateTime: 5, // AI更新最大时间
            maxRenderTime: 10, // 渲染最大时间
            maxUIUpdateTime: 2 // UI更新最大时间
        };
        
        // 优化标志
        this.optimizations = {
            reduceAIFrequency: false,
            skipNonEssentialRendering: false,
            limitOpponentUpdates: false,
            useSimplifiedPhysics: false
        };
        
        this.isMonitoring = true;
    }

    /**
     * 初始化性能监控器
     */
    initialize() {
        this.isMonitoring = true;
        console.log('性能监控器已初始化');
    }

    /**
     * 开始帧测量
     */
    startFrame() {
        this.frameStartTime = performance.now();
    }

    /**
     * 开始特定操作的性能测量
     * @param {string} operation - 操作名称
     */
    startMeasure(operation) {
        if (!this.isMonitoring) return;
        this.measureStartTimes = this.measureStartTimes || {};
        this.measureStartTimes[operation] = performance.now();
    }

    /**
     * 结束特定操作的性能测量
     * @param {string} operation - 操作名称
     */
    endMeasure(operation) {
        if (!this.isMonitoring || !this.measureStartTimes || !this.measureStartTimes[operation]) return;
        
        const endTime = performance.now();
        const duration = endTime - this.measureStartTimes[operation];
        
        // 记录测量结果
        this.stats[operation + 'Time'] = duration;
        
        // 清理
        delete this.measureStartTimes[operation];
    }

    /**
     * 结束帧测量
     */
    endFrame() {
        if (!this.isMonitoring) return;
        
        const frameEndTime = performance.now();
        this.frameTime = frameEndTime - this.frameStartTime;
        
        // 更新统计
        this.updateStats();
        
        // 检查性能问题
        this.checkPerformance();
        
        // 更新FPS
        this.updateFPS();
    }

    /**
     * 更新统计信息
     */
    updateStats() {
        this.stats.totalFrames++;
        this.stats.averageFrameTime = 
            (this.stats.averageFrameTime * (this.stats.totalFrames - 1) + this.frameTime) / this.stats.totalFrames;
        
        if (this.frameTime > this.stats.maxFrameTime) {
            this.stats.maxFrameTime = this.frameTime;
        }
        
        if (this.frameTime < this.stats.minFrameTime) {
            this.stats.minFrameTime = this.frameTime;
        }
        
        // 检测掉帧
        if (this.frameTime > this.thresholds.maxFrameTime) {
            this.stats.droppedFrames++;
        }
    }

    /**
     * 检查性能并应用优化
     */
    checkPerformance() {
        const dropRate = this.stats.droppedFrames / this.stats.totalFrames;
        
        // 如果掉帧率超过10%，启用优化
        if (dropRate > 0.1) {
            this.enableOptimizations();
        } else if (dropRate < 0.02) {
            // 如果性能良好，可以禁用一些优化
            this.disableOptimizations();
        }
    }

    /**
     * 启用性能优化
     */
    enableOptimizations() {
        if (this.stats.aiUpdateTime > this.thresholds.maxAIUpdateTime) {
            this.optimizations.reduceAIFrequency = true;
            this.optimizations.limitOpponentUpdates = true;
        }
        
        if (this.stats.renderTime > this.thresholds.maxRenderTime) {
            this.optimizations.skipNonEssentialRendering = true;
        }
        
        if (this.frameTime > this.thresholds.maxFrameTime * 2) {
            this.optimizations.useSimplifiedPhysics = true;
        }
        
        console.log('性能优化已启用:', this.optimizations);
    }

    /**
     * 禁用性能优化
     */
    disableOptimizations() {
        // 逐步禁用优化
        if (this.optimizations.useSimplifiedPhysics) {
            this.optimizations.useSimplifiedPhysics = false;
        } else if (this.optimizations.skipNonEssentialRendering) {
            this.optimizations.skipNonEssentialRendering = false;
        } else if (this.optimizations.reduceAIFrequency) {
            this.optimizations.reduceAIFrequency = false;
            this.optimizations.limitOpponentUpdates = false;
        }
    }

    /**
     * 更新FPS
     */
    updateFPS() {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastFPSUpdate >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }
    }

    /**
     * 测量AI更新时间
     * @param {Function} aiUpdateFunction - AI更新函数
     */
    measureAIUpdate(aiUpdateFunction) {
        const startTime = performance.now();
        const result = aiUpdateFunction();
        this.stats.aiUpdateTime = performance.now() - startTime;
        return result;
    }

    /**
     * 测量渲染时间
     * @param {Function} renderFunction - 渲染函数
     */
    measureRender(renderFunction) {
        const startTime = performance.now();
        const result = renderFunction();
        this.stats.renderTime = performance.now() - startTime;
        return result;
    }

    /**
     * 测量UI更新时间
     * @param {Function} uiUpdateFunction - UI更新函数
     */
    measureUIUpdate(uiUpdateFunction) {
        const startTime = performance.now();
        const result = uiUpdateFunction();
        this.stats.uiUpdateTime = performance.now() - startTime;
        return result;
    }

    /**
     * 获取性能报告
     * @returns {Object} 性能报告
     */
    getPerformanceReport() {
        return {
            fps: this.fps,
            frameTime: this.frameTime,
            averageFrameTime: this.stats.averageFrameTime,
            dropRate: (this.stats.droppedFrames / this.stats.totalFrames * 100).toFixed(2) + '%',
            optimizations: this.optimizations,
            stats: this.stats
        };
    }

    /**
     * 重置统计
     */
    reset() {
        this.frameCount = 0;
        this.lastFPSUpdate = performance.now();
        this.stats = {
            averageFrameTime: 0,
            maxFrameTime: 0,
            minFrameTime: Infinity,
            totalFrames: 0,
            droppedFrames: 0,
            aiUpdateTime: 0,
            renderTime: 0,
            uiUpdateTime: 0
        };
    }

    /**
     * 启用/禁用监控
     * @param {boolean} enabled - 是否启用
     */
    setMonitoring(enabled) {
        this.isMonitoring = enabled;
    }

    /**
     * 检查是否应该跳过AI更新
     * @returns {boolean} 是否跳过
     */
    shouldSkipAIUpdate() {
        return this.optimizations.reduceAIFrequency && Math.random() < 0.5;
    }

    /**
     * 检查是否应该限制对手更新
     * @returns {boolean} 是否限制
     */
    shouldLimitOpponentUpdates() {
        return this.optimizations.limitOpponentUpdates;
    }

    /**
     * 检查是否应该跳过非必要渲染
     * @returns {boolean} 是否跳过
     */
    shouldSkipNonEssentialRendering() {
        return this.optimizations.skipNonEssentialRendering;
    }

    /**
     * 检查是否使用简化物理
     * @returns {boolean} 是否使用
     */
    shouldUseSimplifiedPhysics() {
        return this.optimizations.useSimplifiedPhysics;
    }
}

// 创建全局性能监控器
window.performanceMonitor = new PerformanceMonitor();