/**
 * TETRIS 99 主游戏控制器
 * 整合所有系统，处理渲染、输入和游戏循环
 */

class Tetris99Game {
    /**
     * 构造函数
     */
    constructor() {
        // 获取DOM元素
        this.gameCanvas = document.getElementById('gameCanvas');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.holdCanvas = document.getElementById('holdCanvas');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.startButton = document.getElementById('startButton');
        
        // 获取Canvas上下文
        this.ctx = this.gameCanvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        // 游戏系统
        this.battleSystem = new BattleSystem();
        this.humanPlayer = this.battleSystem.humanPlayer;
        
        // 游戏状态
        this.gameRunning = false;
        this.lastTime = 0;
        this.keys = {};
        this.keyRepeatTimers = {};
        
        // 渲染设置
        this.cellSize = 20;
        this.boardOffsetX = 0;
        this.boardOffsetY = 0;
        
        // 音频管理器
        this.audioManager = window.audioManager;
        
        // 新功能模块
        this.badgeSystem = window.badgeSystem;
        this.targetingSystem = window.targetingSystem;
        this.spectatorSystem = window.spectatorSystem;
        this.testEnvironment = window.testEnvironment;
        this.performanceMonitor = window.performanceMonitor;
        this.gameModes = window.gameModes;
        this.powerUpSystem = window.powerUpSystem;
        this.statisticsSystem = window.statisticsSystem;
        
        // 测试相关
        this.isTestMode = false;
        this.testResults = null;
        
        // 特效
        this.effects = [];
        
        this.initializeGame();
        this.setupEventListeners();
        this.startGameLoop();
    }

    /**
     * 初始化游戏
     */
    initializeGame() {
        // 设置Canvas尺寸
        this.resizeCanvas();
        
        // 初始化渲染偏移
        this.boardOffsetX = (this.gameCanvas.width - this.humanPlayer.gameEngine.width * this.cellSize) / 2;
        this.boardOffsetY = 20;
        
        // 初始化新功能模块
        if (this.spectatorSystem) {
            this.spectatorSystem.initialize(this.gameCanvas);
        }
        
        if (this.performanceMonitor) {
            this.performanceMonitor.initialize();
        }
        
        // 显示开始界面
        this.showStartScreen();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // 开始按钮
        this.startButton.addEventListener('click', () => this.startGame());
        
        // 攻击目标选择按钮
        document.getElementById('targetRandom').addEventListener('click', () => this.setAttackStrategy('random'));
        document.getElementById('targetAttacker').addEventListener('click', () => this.setAttackStrategy('attacker'));
        document.getElementById('targetKO').addEventListener('click', () => this.setAttackStrategy('ko'));
        document.getElementById('targetBadge').addEventListener('click', () => this.setAttackStrategy('badge'));
        
        // 窗口大小变化
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 防止页面滚动
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
    }

    /**
     * 调整Canvas尺寸
     */
    resizeCanvas() {
        const container = this.gameCanvas.parentElement;
        const maxWidth = Math.min(400, container.clientWidth - 40);
        const maxHeight = Math.min(800, container.clientHeight - 100);
        
        this.gameCanvas.width = maxWidth;
        this.gameCanvas.height = maxHeight;
        
        this.cellSize = Math.min(maxWidth / this.humanPlayer.gameEngine.width, maxHeight / this.humanPlayer.gameEngine.height);
        this.boardOffsetX = (this.gameCanvas.width - this.humanPlayer.gameEngine.width * this.cellSize) / 2;
        this.boardOffsetY = 20;
    }

    /**
     * 处理键盘按下事件
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyDown(e) {
        // 全局快捷键
        switch (e.key) {
            case 'F1':
                this.startAITest();
                e.preventDefault();
                return;
            case 'F2':
                this.toggleSpectatorMode();
                e.preventDefault();
                return;
            case 'F3':
                this.showPerformanceStats();
                e.preventDefault();
                return;
        }
        
        if (!this.gameRunning) {
            if (e.key === ' ' || e.key === 'Enter') {
                this.startGame();
            }
            return;
        }

        this.keys[e.key] = true;

        // 立即执行的动作
        switch (e.key) {
            case 'ArrowUp':
            case 'x':
            case 'X':
                this.humanPlayer.gameEngine.rotatePiece(1);
                this.playSound('drop');
                break;
            case 'z':
            case 'Z':
                this.humanPlayer.gameEngine.rotatePiece(-1);
                this.playSound('drop');
                break;
            case ' ':
                const dropDistance = this.humanPlayer.gameEngine.hardDrop();
                this.addEffect('hardDrop', dropDistance);
                this.playSound('drop');
                break;
            case 'c':
            case 'C':
                this.humanPlayer.gameEngine.holdPiece();
                break;
            case '1':
                this.setAttackStrategy('random');
                break;
            case '2':
                this.setAttackStrategy('badge');
                break;
            case '3':
                this.setAttackStrategy('attacker');
                break;
            case '4':
                this.setAttackStrategy('ko');
                break;
            case 'v':
            case 'V':
                this.startSpectating();
                break;
            case 'm':
            case 'M':
                if (this.gameModes) {
                    this.gameModes.nextMode();
                    this.showMessage(`切换到: ${this.gameModes.getCurrentModeName()}`);
                }
                break;
            case 'q':
            case 'Q':
                if (this.powerUpSystem && this.battleSystem) {
                    const humanPlayer = this.battleSystem.players.find(p => !p.isAI);
                    if (humanPlayer) {
                        this.powerUpSystem.usePowerUp(humanPlayer.id, 0);
                    }
                }
                break;
            case 'e':
            case 'E':
                if (this.powerUpSystem && this.battleSystem) {
                    const humanPlayer = this.battleSystem.players.find(p => !p.isAI);
                    if (humanPlayer) {
                        this.powerUpSystem.usePowerUp(humanPlayer.id, 1);
                    }
                }
                break;
        }

        // 设置重复按键计时器
        if (['ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(e.key)) {
            this.setKeyRepeat(e.key);
        }
    }

    /**
     * 处理键盘释放事件
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyUp(e) {
        this.keys[e.key] = false;
        
        // 清除重复按键计时器
        if (this.keyRepeatTimers[e.key]) {
            clearInterval(this.keyRepeatTimers[e.key]);
            delete this.keyRepeatTimers[e.key];
        }
    }

    /**
     * 设置按键重复
     * @param {string} key - 按键
     */
    setKeyRepeat(key) {
        // 立即执行一次
        this.executeKeyAction(key);
        
        // 设置重复计时器
        setTimeout(() => {
            if (this.keys[key]) {
                this.keyRepeatTimers[key] = setInterval(() => {
                    if (this.keys[key]) {
                        this.executeKeyAction(key);
                    } else {
                        clearInterval(this.keyRepeatTimers[key]);
                        delete this.keyRepeatTimers[key];
                    }
                }, 50); // 重复间隔
            }
        }, 200); // 初始延迟
    }

    /**
     * 执行按键动作
     * @param {string} key - 按键
     */
    executeKeyAction(key) {
        switch (key) {
            case 'ArrowLeft':
                this.humanPlayer.gameEngine.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.humanPlayer.gameEngine.movePiece(1, 0);
                break;
            case 'ArrowDown':
                if (this.humanPlayer.gameEngine.softDrop()) {
                    // 软降成功，增加少量分数
                    this.humanPlayer.gameEngine.score += 1;
                }
                break;
        }
    }

    /**
     * 设置攻击策略
     * @param {string} strategy - 攻击策略
     */
    setAttackStrategy(strategy) {
        this.battleSystem.setAttackStrategy(strategy);
        
        // 更新按钮状态
        document.querySelectorAll('.target-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`target${strategy.charAt(0).toUpperCase() + strategy.slice(1)}`).classList.add('active');
        
        if (this.targetingSystem) {
            this.targetingSystem.setStrategy(strategy);
            console.log(`切换攻击策略: ${this.targetingSystem.getStrategyDisplayName(strategy)}`);
            
            // 显示策略切换提示
            this.showMessage(`攻击策略: ${this.targetingSystem.getStrategyDisplayName(strategy)}`);
        }
    }

    /**
     * 开始AI测试
     */
    async startAITest() {
        if (this.isTestMode) {
            console.log('测试已在进行中...');
            return;
        }
        
        console.log('开始AI测试环境...');
        this.isTestMode = true;
        this.gameState = 'testing';
        
        try {
            // 显示测试界面
            this.showTestInterface();
            
            // 开始测试
            this.testResults = await this.testEnvironment.startTest(this);
            
            // 显示测试结果
            this.showTestResults();
            
        } catch (error) {
            console.error('测试失败:', error);
            this.showMessage(`测试失败: ${error.message}`);
        } finally {
            this.isTestMode = false;
            this.gameState = 'menu';
        }
    }

    /**
     * 切换观战模式
     */
    toggleSpectatorMode() {
        if (!this.spectatorSystem) return;
        
        if (this.spectatorSystem.isSpectating) {
            this.spectatorSystem.stopSpectating();
            this.showMessage('退出观战模式');
        } else {
            this.startSpectating();
        }
    }

    /**
     * 开始观战
     */
    startSpectating() {
        if (!this.spectatorSystem || !this.battleSystem) return;
        
        const alivePlayers = this.battleSystem.players.filter(p => !p.gameOver && p.isAI);
        if (alivePlayers.length === 0) {
            this.showMessage('没有可观战的玩家');
            return;
        }
        
        // 选择第一个AI玩家开始观战
        const targetPlayer = alivePlayers[0];
        if (this.spectatorSystem.startSpectating(targetPlayer.id, this.battleSystem.players)) {
            this.showMessage(`开始观战: ${targetPlayer.name}`);
            
            // 设置观战回调
            this.spectatorSystem.onSpectatorChange = (player) => {
                this.showMessage(`观战: ${player.name}`);
            };
        }
    }

    /**
     * 显示性能统计
     */
    showPerformanceStats() {
        if (!this.performanceMonitor) return;
        
        const stats = this.performanceMonitor.getStats();
        const message = `FPS: ${stats.fps.toFixed(1)} | 帧时间: ${stats.frameTime.toFixed(2)}ms | 内存: ${(stats.memory / 1024 / 1024).toFixed(1)}MB`;
        
        console.log('性能统计:', stats);
        this.showMessage(message);
    }

    /**
     * 显示消息
     * @param {string} message - 消息内容
     */
    showMessage(message) {
        // 创建消息显示元素
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        messageEl.style.position = 'fixed';
        messageEl.style.top = '20px';
        messageEl.style.left = '50%';
        messageEl.style.transform = 'translateX(-50%)';
        messageEl.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        messageEl.style.color = '#fff';
        messageEl.style.padding = '10px 20px';
        messageEl.style.borderRadius = '5px';
        messageEl.style.zIndex = '9999';
        messageEl.style.fontSize = '14px';
        
        document.body.appendChild(messageEl);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    /**
     * 显示测试界面
     */
    showTestInterface() {
        const testUI = document.createElement('div');
        testUI.id = 'testInterface';
        testUI.style.position = 'fixed';
        testUI.style.top = '50%';
        testUI.style.left = '50%';
        testUI.style.transform = 'translate(-50%, -50%)';
        testUI.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        testUI.style.color = '#fff';
        testUI.style.padding = '20px';
        testUI.style.borderRadius = '10px';
        testUI.style.zIndex = '10000';
        testUI.style.minWidth = '400px';
        testUI.style.textAlign = 'center';
        
        testUI.innerHTML = `
            <h2>AI测试环境</h2>
            <p>正在进行99人对战测试...</p>
            <div id="testProgress">
                <div>进度: <span id="progressPercent">0%</span></div>
                <div>帧率: <span id="testFPS">0</span> FPS</div>
                <div>存活玩家: <span id="alivePlayers">99</span></div>
                <div>性能问题: <span id="performanceIssues">0</span></div>
            </div>
            <button onclick="window.testEnvironment.cleanup(); document.getElementById('testInterface').remove();">停止测试</button>
        `;
        
        document.body.appendChild(testUI);
        
        // 设置进度更新回调
        if (this.testEnvironment) {
            this.testEnvironment.onTestProgress = (progress) => {
                document.getElementById('progressPercent').textContent = `${(progress.progress * 100).toFixed(1)}%`;
                document.getElementById('testFPS').textContent = progress.averageFPS.toFixed(1);
                document.getElementById('alivePlayers').textContent = progress.alivePlayers;
                document.getElementById('performanceIssues').textContent = progress.performanceIssues;
            };
        }
    }

    /**
     * 显示测试结果
     */
    showTestResults() {
        const testInterface = document.getElementById('testInterface');
        if (testInterface) {
            testInterface.remove();
        }
        
        if (!this.testResults) return;
        
        const resultUI = document.createElement('div');
        resultUI.style.position = 'fixed';
        resultUI.style.top = '50%';
        resultUI.style.left = '50%';
        resultUI.style.transform = 'translate(-50%, -50%)';
        resultUI.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        resultUI.style.color = '#fff';
        resultUI.style.padding = '20px';
        resultUI.style.borderRadius = '10px';
        resultUI.style.zIndex = '10000';
        resultUI.style.maxWidth = '600px';
        resultUI.style.maxHeight = '80vh';
        resultUI.style.overflow = 'auto';
        
        const report = this.testEnvironment.generateReport();
        resultUI.innerHTML = `
            <h2>测试结果</h2>
            <pre style="text-align: left; white-space: pre-wrap;">${report}</pre>
            <button onclick="this.parentNode.remove();">关闭</button>
        `;
        
        document.body.appendChild(resultUI);
        
        console.log('测试报告:', report);
    }

    /**
     * 开始游戏
     */
    startGame() {
        console.log('开始游戏');
        this.gameRunning = true;
        this.gameStartTime = Date.now();
        this.hideStartScreen();
        
        // 应用游戏模式设置
        let gameSettings = {
            dropSpeed: 1,
            levelUpSpeed: 1,
            aiDifficulty: 5,
            humanPlayers: 1,
            aiPlayers: 98,
            teamMode: false,
            friendlyFire: true,
            sharedKO: false,
            infiniteMode: false
        };
        
        if (this.gameModes) {
            gameSettings = this.gameModes.applyModeRules(gameSettings);
        }
        
        // 初始化战斗系统
        this.battleSystem.startGame(gameSettings);
        
        // 重置道具系统
        if (this.powerUpSystem) {
            this.powerUpSystem.reset();
        }
        
        // 重置游戏模式状态
        if (this.gameModes) {
            this.gameModes.reset();
        }
        
        if (this.audioManager) {
            this.audioManager.playBackgroundMusic();
        }
        this.lastTime = performance.now();
    }

    /**
     * 显示开始界面
     */
    showStartScreen() {
        this.gameOverlay.classList.remove('hidden');
        document.getElementById('overlayTitle').textContent = 'TETRIS® 99';
        document.getElementById('overlayMessage').textContent = '按空格键开始游戏';
        this.startButton.style.display = 'block';
    }

    /**
     * 隐藏开始界面
     */
    hideStartScreen() {
        this.gameOverlay.classList.add('hidden');
    }

    /**
     * 显示游戏结束界面
     * @param {Object} winner - 获胜者
     */
    showGameOverScreen(winner) {
        console.log('游戏结束，获胜者:', winner);
        
        // 记录游戏统计
        if (this.statisticsSystem && this.battleSystem) {
            this.battleSystem.players.forEach(player => {
                const gameData = {
                    rank: player.rank || 99,
                    playTime: Date.now() - this.gameStartTime,
                    linesCleared: player.gameEngine ? player.gameEngine.linesCleared : 0,
                    kos: player.stats ? player.stats.kos : 0,
                    attacksSent: player.stats ? player.stats.attacksSent : 0,
                    attacksReceived: player.stats ? player.stats.attacksReceived : 0,
                    tetrises: player.stats ? player.stats.tetrises : 0,
                    tSpins: player.stats ? player.stats.tSpins : 0,
                    perfectClears: player.stats ? player.stats.perfectClears : 0,
                    maxCombo: player.stats ? player.stats.maxCombo : 0
                };
                
                this.statisticsSystem.updatePlayerStats(player.id, gameData);
                this.statisticsSystem.updateSessionStats(gameData);
            });
        }
        
        this.gameOverlay.classList.remove('hidden');
        
        if (winner && winner.id === 0) {
            document.getElementById('overlayTitle').textContent = '胜利！';
            document.getElementById('overlayMessage').textContent = `恭喜！您获得了第1名！`;
        } else {
            const rank = this.humanPlayer.rank;
            document.getElementById('overlayTitle').textContent = '游戏结束';
            document.getElementById('overlayMessage').textContent = `您的排名：第${rank}名`;
        }
        
        // 添加统计信息显示
        const humanPlayer = this.battleSystem.players.find(p => !p.isAI);
        if (humanPlayer && this.statisticsSystem) {
            const stats = this.statisticsSystem.getPlayerStats(humanPlayer.id);
            if (stats) {
                const statsDiv = document.createElement('div');
                statsDiv.style.marginTop = '15px';
                statsDiv.style.fontSize = '14px';
                statsDiv.innerHTML = `
                    <div>本局KO: ${humanPlayer.stats ? humanPlayer.stats.kos : 0} | 清行: ${humanPlayer.gameEngine ? humanPlayer.gameEngine.linesCleared : 0}</div>
                    <div>胜率: ${stats.winRate.toFixed(1)}% | 最佳排名: ${stats.bestRank} | 总KO: ${stats.totalKOs}</div>
                `;
                document.getElementById('overlayMessage').appendChild(statsDiv);
            }
        }
        
        this.startButton.textContent = '重新开始';
        this.startButton.style.display = 'block';
        
        this.playSound('gameOver');
    }

    /**
     * 播放音效
     * @param {string} soundName - 音效名称
     */
    playSound(soundName) {
        if (this.audioManager) {
            this.audioManager.playSound(soundName);
        }
    }

    /**
     * 添加特效
     * @param {string} type - 特效类型
     * @param {*} data - 特效数据
     */
    addEffect(type, data) {
        this.effects.push({
            type: type,
            data: data,
            timestamp: Date.now(),
            duration: 1000
        });
    }

    /**
     * 更新特效
     * @param {number} deltaTime - 时间增量
     */
    updateEffects(deltaTime) {
        this.effects = this.effects.filter(effect => {
            const age = Date.now() - effect.timestamp;
            return age < effect.duration;
        });
    }

    /**
     * 游戏循环
     * @param {number} currentTime - 当前时间
     */
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // 性能监控开始
        if (this.performanceMonitor) {
            this.performanceMonitor.startFrame();
        }

        if (this.gameRunning || this.isTestMode) {
            // 更新游戏状态
            if (this.performanceMonitor) this.performanceMonitor.startMeasure('gameUpdate');
            this.battleSystem.update(deltaTime);
            if (this.performanceMonitor) this.performanceMonitor.endMeasure('gameUpdate');
            
            // 更新特效
            if (this.performanceMonitor) this.performanceMonitor.startMeasure('effects');
            this.updateEffects(deltaTime);
            if (this.performanceMonitor) this.performanceMonitor.endMeasure('effects');
            
            // 更新观战系统
            if (this.spectatorSystem && this.spectatorSystem.isSpectating) {
                this.spectatorSystem.update(deltaTime);
            }
            
            // 更新徽章系统
            if (this.badgeSystem) {
                this.badgeSystem.update(this.battleSystem.players);
            }
            
            // 更新道具系统
            if (this.powerUpSystem) {
                this.powerUpSystem.update(deltaTime, this.battleSystem.players);
            }
            
            // 检查游戏结束
            if (this.battleSystem.gameEnded && this.gameRunning) {
                this.gameRunning = false;
                this.showGameOverScreen(this.battleSystem.gameStats.winner);
            }
            
            // 更新UI
            if (this.performanceMonitor) this.performanceMonitor.startMeasure('ui');
            this.updateUI();
            if (this.performanceMonitor) this.performanceMonitor.endMeasure('ui');
        }

        // 渲染
        if (this.performanceMonitor) this.performanceMonitor.startMeasure('render');
        this.render();
        if (this.performanceMonitor) this.performanceMonitor.endMeasure('render');

        // 性能监控结束
        if (this.performanceMonitor) {
            this.performanceMonitor.endFrame();
        }

        // 继续游戏循环
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * 开始游戏循环
     */
    startGameLoop() {
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * 更新UI
     */
    updateUI() {
        const status = this.battleSystem.getHumanPlayerStatus();
        
        // 更新统计信息
        document.getElementById('rank').textContent = status.rank;
        document.getElementById('koCount').textContent = status.koCount;
        document.getElementById('score').textContent = status.score.toLocaleString();
        document.getElementById('comboCount').textContent = status.combo;
        
        // 更新攻击队列显示
        this.updateAttackQueueDisplay();
        
        // 更新对手网格
        this.updateOpponentsGrid();
    }

    /**
     * 更新攻击队列显示
     */
    updateAttackQueueDisplay() {
        const queueContainer = document.getElementById('attackQueue');
        queueContainer.innerHTML = '';
        
        this.humanPlayer.attackQueue.forEach((attack, index) => {
            const attackElement = document.createElement('div');
            attackElement.className = 'attack-line';
            attackElement.style.animationDelay = `${index * 0.1}s`;
            queueContainer.appendChild(attackElement);
        });
    }

    /**
     * 更新对手网格显示
     */
    updateOpponentsGrid() {
        const container = document.getElementById('opponentsContainer');
        const opponents = this.battleSystem.getOpponentsStatus();
        
        // 清空现有内容
        container.innerHTML = '';
        
        // 创建对手显示元素
        opponents.forEach(opponent => {
            const opponentElement = document.createElement('div');
            opponentElement.className = 'opponent-board';
            opponentElement.id = `opponent-${opponent.id}`;
            
            if (!opponent.isAlive) {
                opponentElement.classList.add('eliminated');
            }
            if (opponent.targeting) {
                opponentElement.classList.add('targeting');
            }
            if (opponent.targeted) {
                opponentElement.classList.add('targeted');
            }
            
            // 添加排名显示
            const rankElement = document.createElement('div');
            rankElement.className = 'opponent-rank';
            rankElement.textContent = opponent.rank;
            opponentElement.appendChild(rankElement);
            
            // 添加简化的游戏板显示
            this.renderMiniBoard(opponentElement, opponent);
            
            container.appendChild(opponentElement);
        });
    }

    /**
     * 渲染迷你游戏板
     * @param {HTMLElement} container - 容器元素
     * @param {Object} opponent - 对手数据
     */
    renderMiniBoard(container, opponent) {
        const canvas = document.createElement('canvas');
        canvas.width = 76;
        canvas.height = 96;
        canvas.style.position = 'absolute';
        canvas.style.top = '15px';
        canvas.style.left = '2px';
        
        const ctx = canvas.getContext('2d');
        
        // 简化渲染 - 只显示高度信息
        const height = opponent.height;
        const maxHeight = 20;
        const fillHeight = Math.min(height, maxHeight);
        
        // 绘制背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制高度指示器
        if (fillHeight > 0) {
            const barHeight = (fillHeight / maxHeight) * canvas.height;
            const hue = Math.max(0, 120 - (fillHeight / maxHeight) * 120); // 从绿到红
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.fillRect(2, canvas.height - barHeight, canvas.width - 4, barHeight);
        }
        
        container.appendChild(canvas);
    }

    /**
     * 主渲染函数
     */
    render() {
        // 清空主画布
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        
        if (this.gameRunning) {
            // 渲染游戏板
            this.renderBoard();
            
            // 渲染当前方块
            this.renderCurrentPiece();
            
            // 渲染幽灵方块
            this.renderGhostPiece();
            
            // 渲染特效
            this.renderEffects();
        }
        
        // 渲染观战界面
        if (this.spectatorSystem && this.spectatorSystem.isSpectating) {
            this.spectatorSystem.render(this.ctx);
        }
        
        // 渲染徽章系统
        if (this.badgeSystem && this.battleSystem) {
            this.badgeSystem.render(this.ctx, this.battleSystem.players);
        }
        
        // 渲染游戏模式UI
        if (this.gameModes) {
            this.gameModes.renderModeUI(this.ctx);
        }
        
        // 渲染道具系统
        if (this.powerUpSystem && this.battleSystem) {
            // 为人类玩家渲染道具
            const humanPlayer = this.battleSystem.players.find(p => !p.isAI);
            if (humanPlayer) {
                this.powerUpSystem.renderPowerUps(this.ctx, humanPlayer.id, 10, 100);
            }
        }
        
        // 渲染下一个方块
        this.renderNextPiece();
        
        // 渲染保留方块
        this.renderHoldPiece();
        
        // 渲染性能信息（如果启用）
        if (this.performanceMonitor && this.performanceMonitor.showStats) {
            this.renderPerformanceStats();
        }
    }

    /**
     * 渲染性能统计信息
     */
    renderPerformanceStats() {
        const stats = this.performanceMonitor.getStats();
        const x = 10;
        let y = 30;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - 5, y - 20, 200, 100);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        
        this.ctx.fillText(`FPS: ${stats.fps.toFixed(1)}`, x, y);
        y += 15;
        this.ctx.fillText(`帧时间: ${stats.frameTime.toFixed(2)}ms`, x, y);
        y += 15;
        this.ctx.fillText(`内存: ${(stats.memory / 1024 / 1024).toFixed(1)}MB`, x, y);
        y += 15;
        this.ctx.fillText(`AI时间: ${stats.aiTime.toFixed(2)}ms`, x, y);
        y += 15;
        this.ctx.fillText(`渲染时间: ${stats.renderTime.toFixed(2)}ms`, x, y);
    }

    /**
     * 渲染游戏板
     */
    renderBoard() {
        const board = this.humanPlayer.gameEngine.board;
        
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                const cell = board[y][x];
                if (cell) {
                    this.renderCell(x, y, cell.color);
                }
            }
        }
        
        // 绘制网格线
        this.renderGrid();
    }

    /**
     * 渲染网格线
     */
    renderGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        const width = this.humanPlayer.gameEngine.width;
        const height = this.humanPlayer.gameEngine.height;
        
        // 垂直线
        for (let x = 0; x <= width; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.boardOffsetX + x * this.cellSize, this.boardOffsetY);
            this.ctx.lineTo(this.boardOffsetX + x * this.cellSize, this.boardOffsetY + height * this.cellSize);
            this.ctx.stroke();
        }
        
        // 水平线
        for (let y = 0; y <= height; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.boardOffsetX, this.boardOffsetY + y * this.cellSize);
            this.ctx.lineTo(this.boardOffsetX + width * this.cellSize, this.boardOffsetY + y * this.cellSize);
            this.ctx.stroke();
        }
    }

    /**
     * 渲染当前方块
     */
    renderCurrentPiece() {
        const piece = this.humanPlayer.gameEngine.currentPiece;
        if (!piece) return;
        
        const blocks = piece.getBlocks();
        blocks.forEach(block => {
            if (block.y >= 0) {
                this.renderCell(block.x, block.y, piece.color);
            }
        });
    }

    /**
     * 渲染幽灵方块
     */
    renderGhostPiece() {
        const ghost = this.humanPlayer.gameEngine.getGhostPiece();
        if (!ghost) return;
        
        const blocks = ghost.getBlocks();
        blocks.forEach(block => {
            if (block.y >= 0) {
                this.renderCell(block.x, block.y, ghost.color, 0.3);
            }
        });
    }

    /**
     * 渲染单个方块
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} color - 颜色
     * @param {number} alpha - 透明度
     */
    renderCell(x, y, color, alpha = 1) {
        const pixelX = this.boardOffsetX + x * this.cellSize;
        const pixelY = this.boardOffsetY + y * this.cellSize;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // 填充颜色
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.cellSize - 2, this.cellSize - 2);
        
        // 添加高光效果
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.cellSize - 2, 3);
        this.ctx.fillRect(pixelX + 1, pixelY + 1, 3, this.cellSize - 2);
        
        // 添加阴影效果
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(pixelX + this.cellSize - 4, pixelY + 4, 3, this.cellSize - 4);
        this.ctx.fillRect(pixelX + 4, pixelY + this.cellSize - 4, this.cellSize - 4, 3);
        
        this.ctx.restore();
    }

    /**
     * 渲染下一个方块
     */
    renderNextPiece() {
        const nextPiece = this.humanPlayer.gameEngine.nextPiece;
        if (!nextPiece) return;
        
        // 清空画布
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        // 渲染方块
        this.renderPieceOnCanvas(this.nextCtx, nextPiece, this.nextCanvas.width, this.nextCanvas.height);
    }

    /**
     * 渲染保留方块
     */
    renderHoldPiece() {
        const holdPiece = this.humanPlayer.gameEngine.holdPiece;
        
        // 清空画布
        this.holdCtx.fillStyle = '#000';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (holdPiece) {
            this.renderPieceOnCanvas(this.holdCtx, holdPiece, this.holdCanvas.width, this.holdCanvas.height);
        }
    }

    /**
     * 在指定画布上渲染方块
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {TetrisPiece} piece - 方块
     * @param {number} canvasWidth - 画布宽度
     * @param {number} canvasHeight - 画布高度
     */
    renderPieceOnCanvas(ctx, piece, canvasWidth, canvasHeight) {
        const shape = piece.getCurrentShape();
        const cellSize = Math.min(canvasWidth / 6, canvasHeight / 6);
        const offsetX = (canvasWidth - 4 * cellSize) / 2;
        const offsetY = (canvasHeight - 4 * cellSize) / 2;
        
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (shape[y][x]) {
                    const pixelX = offsetX + x * cellSize;
                    const pixelY = offsetY + y * cellSize;
                    
                    // 填充颜色
                    ctx.fillStyle = piece.color;
                    ctx.fillRect(pixelX + 1, pixelY + 1, cellSize - 2, cellSize - 2);
                    
                    // 添加边框
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(pixelX, pixelY, cellSize, cellSize);
                }
            }
        }
    }

    /**
     * 渲染特效
     */
    renderEffects() {
        this.effects.forEach(effect => {
            const age = Date.now() - effect.timestamp;
            const progress = age / effect.duration;
            
            switch (effect.type) {
                case 'hardDrop':
                    this.renderHardDropEffect(effect.data, progress);
                    break;
                case 'lineClear':
                    this.renderLineClearEffect(effect.data, progress);
                    break;
            }
        });
    }

    /**
     * 渲染硬降特效
     * @param {number} distance - 降落距离
     * @param {number} progress - 进度 (0-1)
     */
    renderHardDropEffect(distance, progress) {
        if (progress > 1) return;
        
        const alpha = 1 - progress;
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`+${distance * 2}`, this.gameCanvas.width / 2, 50 - progress * 30);
        this.ctx.restore();
    }

    /**
     * 渲染行消除特效
     * @param {Array} lines - 消除的行
     * @param {number} progress - 进度 (0-1)
     */
    renderLineClearEffect(lines, progress) {
        if (progress > 1) return;
        
        const alpha = 1 - progress;
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        lines.forEach(lineY => {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(
                this.boardOffsetX, 
                this.boardOffsetY + lineY * this.cellSize,
                this.humanPlayer.gameEngine.width * this.cellSize,
                this.cellSize
            );
        });
        
        this.ctx.restore();
    }
}

// 游戏初始化
let game;

// 页面加载完成后启动游戏
document.addEventListener('DOMContentLoaded', () => {
    game = new Tetris99Game();
    // 导出游戏实例供调试使用
    window.tetrisGame = game;
});