/**
 * AI测试环境
 * 用于模拟99人对战场景并进行全面测试
 */

class TestEnvironment {
    /**
     * 构造函数
     */
    constructor() {
        // 测试配置
        this.config = {
            totalPlayers: 99,
            humanPlayers: 1,
            aiPlayers: 98,
            testDuration: 300000, // 5分钟测试
            performanceCheckInterval: 1000, // 每秒检查性能
            maxFrameTime: 16.67, // 60fps = 16.67ms per frame
            maxMemoryUsage: 500 * 1024 * 1024, // 500MB
            aiUpdateBatchSize: 10, // 每帧更新的AI数量
            renderBatchSize: 25 // 每帧渲染的玩家数量
        };

        // 测试状态
        this.testState = {
            isRunning: false,
            startTime: 0,
            frameCount: 0,
            totalFrameTime: 0,
            maxFrameTime: 0,
            minFrameTime: Infinity,
            memoryUsage: [],
            performanceIssues: [],
            crashCount: 0,
            gameEndCount: 0
        };

        // 性能监控
        this.performanceMonitor = {
            frameTimeHistory: [],
            memoryHistory: [],
            aiUpdateTimes: [],
            renderTimes: [],
            maxHistoryLength: 100
        };

        // 测试结果
        this.testResults = {
            passed: false,
            issues: [],
            recommendations: [],
            performanceMetrics: {}
        };

        // AI行为配置
        this.aiConfigs = [
            { difficulty: 'easy', errorRate: 0.3, thinkTime: 800 },
            { difficulty: 'medium', errorRate: 0.2, thinkTime: 500 },
            { difficulty: 'hard', errorRate: 0.1, thinkTime: 300 },
            { difficulty: 'expert', errorRate: 0.05, thinkTime: 150 }
        ];

        // 事件回调
        this.onTestProgress = null;
        this.onTestComplete = null;
        this.onPerformanceIssue = null;
    }

    /**
     * 开始测试
     * @param {Object} gameInstance - 游戏实例
     * @returns {Promise} 测试结果
     */
    async startTest(gameInstance) {
        console.log('开始AI测试环境...');
        
        this.gameInstance = gameInstance;
        this.resetTestState();
        
        try {
            // 初始化测试环境
            await this.initializeTestEnvironment();
            
            // 开始性能监控
            this.startPerformanceMonitoring();
            
            // 运行测试
            await this.runTest();
            
            // 分析结果
            this.analyzeResults();
            
            console.log('测试完成:', this.testResults);
            return this.testResults;
            
        } catch (error) {
            console.error('测试过程中发生错误:', error);
            this.testResults.passed = false;
            this.testResults.issues.push(`测试异常: ${error.message}`);
            return this.testResults;
        }
    }

    /**
     * 重置测试状态
     */
    resetTestState() {
        this.testState = {
            isRunning: false,
            startTime: 0,
            frameCount: 0,
            totalFrameTime: 0,
            maxFrameTime: 0,
            minFrameTime: Infinity,
            memoryUsage: [],
            performanceIssues: [],
            crashCount: 0,
            gameEndCount: 0
        };

        this.performanceMonitor = {
            frameTimeHistory: [],
            memoryHistory: [],
            aiUpdateTimes: [],
            renderTimes: [],
            maxHistoryLength: 100
        };

        this.testResults = {
            passed: false,
            issues: [],
            recommendations: [],
            performanceMetrics: {}
        };
    }

    /**
     * 初始化测试环境
     */
    async initializeTestEnvironment() {
        console.log('初始化测试环境...');
        
        // 创建测试用的battle system
        if (!this.gameInstance.battleSystem) {
            throw new Error('Battle system not found');
        }

        // 配置AI玩家
        await this.setupAIPlayers();
        
        // 配置性能监控
        this.setupPerformanceMonitoring();
        
        // 配置测试事件
        this.setupTestEvents();
        
        console.log(`测试环境初始化完成: ${this.config.totalPlayers}个玩家`);
    }

    /**
     * 设置AI玩家
     */
    async setupAIPlayers() {
        const battleSystem = this.gameInstance.battleSystem;
        
        // 清除现有玩家
        battleSystem.players = [];
        battleSystem.alivePlayers = 0;
        
        // 创建人类玩家
        const humanPlayer = {
            id: 'human',
            name: '测试玩家',
            isAI: false,
            gameEngine: new TetrisGameEngine(10, 20, (soundType) => {
                if (window.audioManager) {
                    window.audioManager.playSound(soundType);
                }
            }),
            gameOver: false,
            position: { x: 0, y: 0 }
        };
        
        battleSystem.players.push(humanPlayer);
        
        // 创建AI玩家
        for (let i = 1; i < this.config.totalPlayers; i++) {
            const configIndex = i % this.aiConfigs.length;
            const aiConfig = this.aiConfigs[configIndex];
            
            const aiPlayer = {
                id: `ai_${i}`,
                name: `AI玩家${i}`,
                isAI: true,
                gameEngine: new TetrisGameEngine(10, 20),
                aiPlayer: new AIPlayer(aiConfig.difficulty, aiConfig.errorRate, aiConfig.thinkTime),
                gameOver: false,
                position: this.calculatePlayerPosition(i),
                config: aiConfig
            };
            
            // 初始化AI玩家的游戏引擎
            aiPlayer.aiPlayer.gameEngine = aiPlayer.gameEngine;
            
            battleSystem.players.push(aiPlayer);
        }
        
        battleSystem.alivePlayers = this.config.totalPlayers;
        console.log(`创建了${this.config.totalPlayers}个玩家 (1个人类, ${this.config.aiPlayers}个AI)`);
    }

    /**
     * 计算玩家位置
     * @param {number} index - 玩家索引
     * @returns {Object} 位置坐标
     */
    calculatePlayerPosition(index) {
        const gridSize = Math.ceil(Math.sqrt(this.config.totalPlayers));
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        
        return {
            x: col * 120 + 50,
            y: row * 120 + 50
        };
    }

    /**
     * 设置性能监控
     */
    setupPerformanceMonitoring() {
        // 重写游戏循环以添加性能监控
        const originalGameLoop = this.gameInstance.gameLoop.bind(this.gameInstance);
        
        this.gameInstance.gameLoop = (currentTime) => {
            const frameStart = performance.now();
            
            try {
                // 执行原始游戏循环
                originalGameLoop(currentTime);
                
                // 记录性能数据
                const frameTime = performance.now() - frameStart;
                this.recordFramePerformance(frameTime);
                
            } catch (error) {
                console.error('游戏循环错误:', error);
                this.testState.crashCount++;
                this.testResults.issues.push(`游戏循环崩溃: ${error.message}`);
            }
        };
    }

    /**
     * 设置测试事件
     */
    setupTestEvents() {
        // 监听游戏结束事件
        const originalEndGame = this.gameInstance.endGame.bind(this.gameInstance);
        this.gameInstance.endGame = () => {
            this.testState.gameEndCount++;
            originalEndGame();
        };
        
        // 监听玩家淘汰事件
        if (this.gameInstance.battleSystem) {
            const originalEliminatePlayer = this.gameInstance.battleSystem.eliminatePlayer.bind(this.gameInstance.battleSystem);
            this.gameInstance.battleSystem.eliminatePlayer = (playerId) => {
                originalEliminatePlayer(playerId);
                this.checkTestCompletion();
            };
        }
    }

    /**
     * 开始性能监控
     */
    startPerformanceMonitoring() {
        this.performanceInterval = setInterval(() => {
            this.checkPerformance();
        }, this.config.performanceCheckInterval);
    }

    /**
     * 运行测试
     */
    async runTest() {
        console.log('开始运行测试...');
        
        this.testState.isRunning = true;
        this.testState.startTime = Date.now();
        
        // 启动游戏
        this.gameInstance.startGame();
        
        // 等待测试完成
        return new Promise((resolve) => {
            const checkCompletion = () => {
                if (this.isTestComplete()) {
                    this.stopTest();
                    resolve();
                } else {
                    setTimeout(checkCompletion, 100);
                }
            };
            
            checkCompletion();
        });
    }

    /**
     * 记录帧性能
     * @param {number} frameTime - 帧时间
     */
    recordFramePerformance(frameTime) {
        this.testState.frameCount++;
        this.testState.totalFrameTime += frameTime;
        this.testState.maxFrameTime = Math.max(this.testState.maxFrameTime, frameTime);
        this.testState.minFrameTime = Math.min(this.testState.minFrameTime, frameTime);
        
        // 记录到历史
        this.performanceMonitor.frameTimeHistory.push(frameTime);
        if (this.performanceMonitor.frameTimeHistory.length > this.performanceMonitor.maxHistoryLength) {
            this.performanceMonitor.frameTimeHistory.shift();
        }
        
        // 检查性能问题
        if (frameTime > this.config.maxFrameTime) {
            this.testState.performanceIssues.push({
                type: 'frame_time',
                value: frameTime,
                threshold: this.config.maxFrameTime,
                timestamp: Date.now()
            });
            
            if (this.onPerformanceIssue) {
                this.onPerformanceIssue('frame_time', frameTime);
            }
        }
    }

    /**
     * 检查性能
     */
    checkPerformance() {
        // 检查内存使用
        if (performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize;
            this.testState.memoryUsage.push(memoryUsage);
            
            this.performanceMonitor.memoryHistory.push(memoryUsage);
            if (this.performanceMonitor.memoryHistory.length > this.performanceMonitor.maxHistoryLength) {
                this.performanceMonitor.memoryHistory.shift();
            }
            
            if (memoryUsage > this.config.maxMemoryUsage) {
                this.testState.performanceIssues.push({
                    type: 'memory',
                    value: memoryUsage,
                    threshold: this.config.maxMemoryUsage,
                    timestamp: Date.now()
                });
                
                if (this.onPerformanceIssue) {
                    this.onPerformanceIssue('memory', memoryUsage);
                }
            }
        }
        
        // 检查AI更新性能
        this.checkAIPerformance();
        
        // 触发进度回调
        if (this.onTestProgress) {
            this.onTestProgress(this.getTestProgress());
        }
    }

    /**
     * 检查AI性能
     */
    checkAIPerformance() {
        if (!this.gameInstance.battleSystem) return;
        
        const aiPlayers = this.gameInstance.battleSystem.players.filter(p => p.isAI && !p.gameOver);
        let totalAIUpdateTime = 0;
        
        aiPlayers.forEach(player => {
            if (player.aiPlayer && player.aiPlayer.lastUpdateTime) {
                totalAIUpdateTime += player.aiPlayer.lastUpdateTime;
            }
        });
        
        this.performanceMonitor.aiUpdateTimes.push(totalAIUpdateTime);
        if (this.performanceMonitor.aiUpdateTimes.length > this.performanceMonitor.maxHistoryLength) {
            this.performanceMonitor.aiUpdateTimes.shift();
        }
    }

    /**
     * 检查测试完成条件
     */
    checkTestCompletion() {
        const elapsed = Date.now() - this.testState.startTime;
        const alivePlayers = this.gameInstance.battleSystem ? 
            this.gameInstance.battleSystem.alivePlayers : 0;
        
        // 检查是否应该结束测试
        if (elapsed >= this.config.testDuration || alivePlayers <= 1) {
            return true;
        }
        
        return false;
    }

    /**
     * 测试是否完成
     * @returns {boolean} 是否完成
     */
    isTestComplete() {
        return this.checkTestCompletion() || !this.testState.isRunning;
    }

    /**
     * 停止测试
     */
    stopTest() {
        console.log('停止测试...');
        
        this.testState.isRunning = false;
        
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
        }
        
        // 停止游戏
        if (this.gameInstance.gameState === 'playing') {
            this.gameInstance.endGame();
        }
    }

    /**
     * 分析测试结果
     */
    analyzeResults() {
        console.log('分析测试结果...');
        
        const elapsed = Date.now() - this.testState.startTime;
        const avgFrameTime = this.testState.totalFrameTime / this.testState.frameCount;
        const fps = 1000 / avgFrameTime;
        
        // 计算性能指标
        this.testResults.performanceMetrics = {
            testDuration: elapsed,
            totalFrames: this.testState.frameCount,
            averageFrameTime: avgFrameTime,
            maxFrameTime: this.testState.maxFrameTime,
            minFrameTime: this.testState.minFrameTime,
            averageFPS: fps,
            crashCount: this.testState.crashCount,
            performanceIssueCount: this.testState.performanceIssues.length,
            memoryPeakUsage: Math.max(...this.testState.memoryUsage, 0)
        };
        
        // 判断测试是否通过
        this.testResults.passed = this.evaluateTestSuccess();
        
        // 生成问题报告
        this.generateIssueReport();
        
        // 生成建议
        this.generateRecommendations();
        
        if (this.onTestComplete) {
            this.onTestComplete(this.testResults);
        }
    }

    /**
     * 评估测试是否成功
     * @returns {boolean} 是否成功
     */
    evaluateTestSuccess() {
        const metrics = this.testResults.performanceMetrics;
        
        // 检查关键指标
        if (metrics.crashCount > 0) {
            this.testResults.issues.push('游戏发生崩溃');
            return false;
        }
        
        if (metrics.averageFPS < 30) {
            this.testResults.issues.push('平均帧率过低 (< 30 FPS)');
            return false;
        }
        
        if (metrics.maxFrameTime > 100) {
            this.testResults.issues.push('最大帧时间过长 (> 100ms)');
            return false;
        }
        
        if (this.testState.performanceIssues.length > 50) {
            this.testResults.issues.push('性能问题过多');
            return false;
        }
        
        return true;
    }

    /**
     * 生成问题报告
     */
    generateIssueReport() {
        const issues = this.testState.performanceIssues;
        
        // 按类型分组问题
        const issuesByType = {};
        issues.forEach(issue => {
            if (!issuesByType[issue.type]) {
                issuesByType[issue.type] = [];
            }
            issuesByType[issue.type].push(issue);
        });
        
        // 生成报告
        Object.keys(issuesByType).forEach(type => {
            const typeIssues = issuesByType[type];
            this.testResults.issues.push(
                `${type}问题: ${typeIssues.length}次, 最大值: ${Math.max(...typeIssues.map(i => i.value))}`
            );
        });
    }

    /**
     * 生成优化建议
     */
    generateRecommendations() {
        const metrics = this.testResults.performanceMetrics;
        
        if (metrics.averageFPS < 60) {
            this.testResults.recommendations.push('考虑优化渲染性能，减少绘制调用');
        }
        
        if (metrics.maxFrameTime > 50) {
            this.testResults.recommendations.push('优化AI更新逻辑，考虑分帧处理');
        }
        
        if (metrics.memoryPeakUsage > this.config.maxMemoryUsage * 0.8) {
            this.testResults.recommendations.push('优化内存使用，及时清理不需要的对象');
        }
        
        if (this.testState.performanceIssues.length > 20) {
            this.testResults.recommendations.push('增加性能监控和优化机制');
        }
        
        // AI相关建议
        const avgAITime = this.performanceMonitor.aiUpdateTimes.length > 0 ?
            this.performanceMonitor.aiUpdateTimes.reduce((a, b) => a + b, 0) / this.performanceMonitor.aiUpdateTimes.length : 0;
        
        if (avgAITime > 10) {
            this.testResults.recommendations.push('优化AI决策算法，减少计算复杂度');
        }
    }

    /**
     * 获取测试进度
     * @returns {Object} 进度信息
     */
    getTestProgress() {
        const elapsed = Date.now() - this.testState.startTime;
        const progress = Math.min(elapsed / this.config.testDuration, 1);
        
        return {
            progress: progress,
            elapsed: elapsed,
            frameCount: this.testState.frameCount,
            averageFPS: this.testState.frameCount > 0 ? 
                1000 / (this.testState.totalFrameTime / this.testState.frameCount) : 0,
            alivePlayers: this.gameInstance.battleSystem ? 
                this.gameInstance.battleSystem.alivePlayers : 0,
            performanceIssues: this.testState.performanceIssues.length
        };
    }

    /**
     * 生成测试报告
     * @returns {string} 测试报告
     */
    generateReport() {
        const metrics = this.testResults.performanceMetrics;
        
        let report = '=== TETRIS 99 AI测试报告 ===\n\n';
        
        report += `测试结果: ${this.testResults.passed ? '通过' : '失败'}\n`;
        report += `测试时长: ${(metrics.testDuration / 1000).toFixed(2)}秒\n`;
        report += `总帧数: ${metrics.totalFrames}\n`;
        report += `平均FPS: ${metrics.averageFPS.toFixed(2)}\n`;
        report += `平均帧时间: ${metrics.averageFrameTime.toFixed(2)}ms\n`;
        report += `最大帧时间: ${metrics.maxFrameTime.toFixed(2)}ms\n`;
        report += `崩溃次数: ${metrics.crashCount}\n`;
        report += `性能问题: ${metrics.performanceIssueCount}次\n`;
        
        if (metrics.memoryPeakUsage > 0) {
            report += `内存峰值: ${(metrics.memoryPeakUsage / 1024 / 1024).toFixed(2)}MB\n`;
        }
        
        if (this.testResults.issues.length > 0) {
            report += '\n发现的问题:\n';
            this.testResults.issues.forEach(issue => {
                report += `- ${issue}\n`;
            });
        }
        
        if (this.testResults.recommendations.length > 0) {
            report += '\n优化建议:\n';
            this.testResults.recommendations.forEach(rec => {
                report += `- ${rec}\n`;
            });
        }
        
        return report;
    }

    /**
     * 清理测试环境
     */
    cleanup() {
        this.stopTest();
        
        if (this.gameInstance) {
            // 恢复原始游戏循环
            delete this.gameInstance.gameLoop;
            delete this.gameInstance.endGame;
        }
        
        console.log('测试环境已清理');
    }
}

// 创建全局测试环境
window.testEnvironment = new TestEnvironment();