/**
 * 观战系统
 * 管理TETRIS 99的观战功能
 */

class SpectatorSystem {
    /**
     * 构造函数
     */
    constructor() {
        // 观战状态
        this.isSpectating = false;
        this.spectatingPlayerId = null;
        this.spectatorCanvas = null;
        this.spectatorCtx = null;
        
        // 观战界面配置
        this.spectatorConfig = {
            width: 300,
            height: 600,
            x: 10,
            y: 10,
            scale: 0.8
        };
        
        // 自动切换配置
        this.autoSwitch = {
            enabled: false,
            interval: 5000, // 5秒切换一次
            lastSwitch: 0,
            preferredTargets: ['badges', 'attackers', 'ko'] // 优先观看的目标类型
        };
        
        // 观战历史
        this.spectatingHistory = [];
        this.maxHistoryLength = 10;
        
        // 事件回调
        this.onSpectatorChange = null;
        this.onSpectatorEnd = null;
    }

    /**
     * 初始化观战系统
     * @param {HTMLCanvasElement} canvas - 主画布
     */
    initialize(canvas) {
        this.createSpectatorCanvas(canvas);
        this.setupEventListeners();
    }

    /**
     * 创建观战画布
     * @param {HTMLCanvasElement} mainCanvas - 主画布
     */
    createSpectatorCanvas(mainCanvas) {
        // 创建观战画布
        this.spectatorCanvas = document.createElement('canvas');
        this.spectatorCanvas.width = this.spectatorConfig.width;
        this.spectatorCanvas.height = this.spectatorConfig.height;
        this.spectatorCanvas.style.position = 'absolute';
        this.spectatorCanvas.style.top = this.spectatorConfig.y + 'px';
        this.spectatorCanvas.style.left = this.spectatorConfig.x + 'px';
        this.spectatorCanvas.style.border = '2px solid #fff';
        this.spectatorCanvas.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.spectatorCanvas.style.zIndex = '1000';
        this.spectatorCanvas.style.display = 'none';
        
        this.spectatorCtx = this.spectatorCanvas.getContext('2d');
        
        // 添加到页面
        document.body.appendChild(this.spectatorCanvas);
        
        // 添加标题
        this.createSpectatorUI();
    }

    /**
     * 创建观战UI
     */
    createSpectatorUI() {
        // 创建观战信息面板
        this.spectatorInfo = document.createElement('div');
        this.spectatorInfo.style.position = 'absolute';
        this.spectatorInfo.style.top = (this.spectatorConfig.y - 30) + 'px';
        this.spectatorInfo.style.left = this.spectatorConfig.x + 'px';
        this.spectatorInfo.style.color = '#fff';
        this.spectatorInfo.style.fontSize = '14px';
        this.spectatorInfo.style.fontFamily = 'Arial, sans-serif';
        this.spectatorInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.spectatorInfo.style.padding = '5px 10px';
        this.spectatorInfo.style.borderRadius = '5px';
        this.spectatorInfo.style.zIndex = '1001';
        this.spectatorInfo.style.display = 'none';
        
        document.body.appendChild(this.spectatorInfo);
        
        // 创建控制按钮
        this.createSpectatorControls();
    }

    /**
     * 创建观战控制按钮
     */
    createSpectatorControls() {
        this.spectatorControls = document.createElement('div');
        this.spectatorControls.style.position = 'absolute';
        this.spectatorControls.style.top = (this.spectatorConfig.y + this.spectatorConfig.height + 10) + 'px';
        this.spectatorControls.style.left = this.spectatorConfig.x + 'px';
        this.spectatorControls.style.zIndex = '1001';
        this.spectatorControls.style.display = 'none';
        
        // 上一个玩家按钮
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '◀';
        prevBtn.style.marginRight = '5px';
        prevBtn.onclick = () => this.switchToPreviousPlayer();
        
        // 下一个玩家按钮
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '▶';
        nextBtn.style.marginRight = '5px';
        nextBtn.onclick = () => this.switchToNextPlayer();
        
        // 自动切换按钮
        const autoBtn = document.createElement('button');
        autoBtn.textContent = '自动';
        autoBtn.style.marginRight = '5px';
        autoBtn.onclick = () => this.toggleAutoSwitch();
        
        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.onclick = () => this.stopSpectating();
        
        this.spectatorControls.appendChild(prevBtn);
        this.spectatorControls.appendChild(nextBtn);
        this.spectatorControls.appendChild(autoBtn);
        this.spectatorControls.appendChild(closeBtn);
        
        document.body.appendChild(this.spectatorControls);
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (this.isSpectating) {
                switch (e.key) {
                    case 'ArrowLeft':
                        this.switchToPreviousPlayer();
                        e.preventDefault();
                        break;
                    case 'ArrowRight':
                        this.switchToNextPlayer();
                        e.preventDefault();
                        break;
                    case 'Escape':
                        this.stopSpectating();
                        e.preventDefault();
                        break;
                    case ' ':
                        this.toggleAutoSwitch();
                        e.preventDefault();
                        break;
                }
            }
        });
    }

    /**
     * 开始观战指定玩家
     * @param {string} playerId - 玩家ID
     * @param {Array} allPlayers - 所有玩家列表
     */
    startSpectating(playerId, allPlayers) {
        const player = allPlayers.find(p => p.id === playerId);
        if (!player || player.gameOver) {
            return false;
        }

        this.isSpectating = true;
        this.spectatingPlayerId = playerId;
        this.allPlayers = allPlayers;
        
        // 显示观战界面
        this.spectatorCanvas.style.display = 'block';
        this.spectatorInfo.style.display = 'block';
        this.spectatorControls.style.display = 'block';
        
        // 添加到历史记录
        this.addToHistory(playerId);
        
        // 触发回调
        if (this.onSpectatorChange) {
            this.onSpectatorChange(player);
        }
        
        return true;
    }

    /**
     * 停止观战
     */
    stopSpectating() {
        this.isSpectating = false;
        this.spectatingPlayerId = null;
        this.autoSwitch.enabled = false;
        
        // 隐藏观战界面
        this.spectatorCanvas.style.display = 'none';
        this.spectatorInfo.style.display = 'none';
        this.spectatorControls.style.display = 'none';
        
        // 触发回调
        if (this.onSpectatorEnd) {
            this.onSpectatorEnd();
        }
    }

    /**
     * 切换到下一个玩家
     */
    switchToNextPlayer() {
        if (!this.isSpectating || !this.allPlayers) return;
        
        const alivePlayers = this.allPlayers.filter(p => !p.gameOver);
        if (alivePlayers.length === 0) {
            this.stopSpectating();
            return;
        }
        
        const currentIndex = alivePlayers.findIndex(p => p.id === this.spectatingPlayerId);
        const nextIndex = (currentIndex + 1) % alivePlayers.length;
        const nextPlayer = alivePlayers[nextIndex];
        
        this.spectatingPlayerId = nextPlayer.id;
        this.addToHistory(nextPlayer.id);
        
        if (this.onSpectatorChange) {
            this.onSpectatorChange(nextPlayer);
        }
    }

    /**
     * 切换到上一个玩家
     */
    switchToPreviousPlayer() {
        if (!this.isSpectating || !this.allPlayers) return;
        
        const alivePlayers = this.allPlayers.filter(p => !p.gameOver);
        if (alivePlayers.length === 0) {
            this.stopSpectating();
            return;
        }
        
        const currentIndex = alivePlayers.findIndex(p => p.id === this.spectatingPlayerId);
        const prevIndex = currentIndex === 0 ? alivePlayers.length - 1 : currentIndex - 1;
        const prevPlayer = alivePlayers[prevIndex];
        
        this.spectatingPlayerId = prevPlayer.id;
        this.addToHistory(prevPlayer.id);
        
        if (this.onSpectatorChange) {
            this.onSpectatorChange(prevPlayer);
        }
    }

    /**
     * 切换自动观战模式
     */
    toggleAutoSwitch() {
        this.autoSwitch.enabled = !this.autoSwitch.enabled;
        this.autoSwitch.lastSwitch = Date.now();
    }

    /**
     * 更新观战系统
     * @param {number} deltaTime - 时间增量
     */
    update(deltaTime) {
        if (!this.isSpectating) return;
        
        // 检查当前观战的玩家是否还活着
        if (this.allPlayers) {
            const currentPlayer = this.allPlayers.find(p => p.id === this.spectatingPlayerId);
            if (!currentPlayer || currentPlayer.gameOver) {
                this.switchToNextPlayer();
                return;
            }
        }
        
        // 自动切换逻辑
        if (this.autoSwitch.enabled) {
            const now = Date.now();
            if (now - this.autoSwitch.lastSwitch > this.autoSwitch.interval) {
                this.autoSwitchToInterestingPlayer();
                this.autoSwitch.lastSwitch = now;
            }
        }
    }

    /**
     * 自动切换到有趣的玩家
     */
    autoSwitchToInterestingPlayer() {
        if (!this.allPlayers) return;
        
        const alivePlayers = this.allPlayers.filter(p => !p.gameOver);
        if (alivePlayers.length === 0) return;
        
        // 寻找有趣的目标
        let interestingPlayer = null;
        
        // 优先级1: 正在进行大连击的玩家
        interestingPlayer = alivePlayers.find(p => 
            p.gameEngine && p.gameEngine.combo >= 4
        );
        
        // 优先级2: 血量很低的玩家
        if (!interestingPlayer) {
            interestingPlayer = alivePlayers.find(p => {
                if (!p.gameEngine || !p.gameEngine.board) return false;
                const health = this.calculatePlayerHealth(p);
                return health < 0.2; // 血量低于20%
            });
        }
        
        // 优先级3: 徽章最多的玩家
        if (!interestingPlayer && window.badgeSystem) {
            let maxBadges = -1;
            alivePlayers.forEach(p => {
                const badgeCount = window.badgeSystem.getPlayerBadgeCount(p);
                if (badgeCount > maxBadges) {
                    maxBadges = badgeCount;
                    interestingPlayer = p;
                }
            });
        }
        
        // 如果没找到特别有趣的，随机选择
        if (!interestingPlayer) {
            interestingPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        }
        
        if (interestingPlayer && interestingPlayer.id !== this.spectatingPlayerId) {
            this.spectatingPlayerId = interestingPlayer.id;
            this.addToHistory(interestingPlayer.id);
            
            if (this.onSpectatorChange) {
                this.onSpectatorChange(interestingPlayer);
            }
        }
    }

    /**
     * 计算玩家血量
     * @param {Object} player - 玩家对象
     * @returns {number} 血量百分比
     */
    calculatePlayerHealth(player) {
        if (!player.gameEngine || !player.gameEngine.board) return 1;
        
        const board = player.gameEngine.board;
        const height = board.length;
        let emptyRows = 0;
        
        for (let row = 0; row < height; row++) {
            if (board[row].every(cell => cell === 0)) {
                emptyRows++;
            } else {
                break;
            }
        }
        
        return emptyRows / height;
    }

    /**
     * 渲染观战界面
     * @param {Object} spectatedPlayer - 被观战的玩家
     */
    render(spectatedPlayer) {
        if (!this.isSpectating || !this.spectatorCtx || !spectatedPlayer) return;
        
        const ctx = this.spectatorCtx;
        const canvas = this.spectatorCanvas;
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制游戏区域
        if (spectatedPlayer.gameEngine) {
            this.renderSpectatedGame(ctx, spectatedPlayer.gameEngine);
        }
        
        // 更新信息面板
        this.updateSpectatorInfo(spectatedPlayer);
    }

    /**
     * 渲染被观战的游戏
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Object} gameEngine - 游戏引擎
     */
    renderSpectatedGame(ctx, gameEngine) {
        const scale = this.spectatorConfig.scale;
        const cellSize = 20 * scale;
        const boardWidth = 10;
        const boardHeight = 20;
        
        ctx.save();
        ctx.scale(scale, scale);
        
        // 绘制游戏板
        if (gameEngine.board) {
            for (let row = 0; row < boardHeight; row++) {
                for (let col = 0; col < boardWidth; col++) {
                    const cell = gameEngine.board[row][col];
                    const x = col * cellSize / scale;
                    const y = row * cellSize / scale;
                    
                    if (cell !== 0) {
                        ctx.fillStyle = this.getCellColor(cell);
                        ctx.fillRect(x, y, cellSize / scale, cellSize / scale);
                        ctx.strokeStyle = '#000';
                        ctx.strokeRect(x, y, cellSize / scale, cellSize / scale);
                    } else {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                        ctx.fillRect(x, y, cellSize / scale, cellSize / scale);
                    }
                }
            }
        }
        
        // 绘制当前方块
        if (gameEngine.currentPiece) {
            this.renderSpectatedPiece(ctx, gameEngine.currentPiece, cellSize / scale);
        }
        
        ctx.restore();
    }

    /**
     * 渲染被观战的方块
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Object} piece - 方块对象
     * @param {number} cellSize - 单元格大小
     */
    renderSpectatedPiece(ctx, piece, cellSize) {
        if (!piece.shape || !piece.shape[piece.rotation]) return;
        
        const shape = piece.shape[piece.rotation];
        ctx.fillStyle = this.getCellColor(piece.type);
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = (piece.x + col) * cellSize;
                    const y = (piece.y + row) * cellSize;
                    ctx.fillRect(x, y, cellSize, cellSize);
                    ctx.strokeStyle = '#000';
                    ctx.strokeRect(x, y, cellSize, cellSize);
                }
            }
        }
    }

    /**
     * 获取单元格颜色
     * @param {number} cellType - 单元格类型
     * @returns {string} 颜色值
     */
    getCellColor(cellType) {
        const colors = {
            1: '#FF0000', // I
            2: '#00FF00', // O
            3: '#0000FF', // T
            4: '#FFFF00', // S
            5: '#FF00FF', // Z
            6: '#00FFFF', // J
            7: '#FFA500'  // L
        };
        return colors[cellType] || '#FFFFFF';
    }

    /**
     * 更新观战信息面板
     * @param {Object} player - 被观战的玩家
     */
    updateSpectatorInfo(player) {
        if (!this.spectatorInfo) return;
        
        let info = `观战: ${player.name || `玩家${player.id}`}`;
        
        if (player.gameEngine) {
            info += ` | 等级: ${player.gameEngine.level || 1}`;
            info += ` | 分数: ${player.gameEngine.score || 0}`;
            info += ` | 行数: ${player.gameEngine.lines || 0}`;
            
            if (player.gameEngine.combo > 0) {
                info += ` | 连击: ${player.gameEngine.combo}`;
            }
        }
        
        if (window.badgeSystem) {
            const badgeCount = window.badgeSystem.getPlayerBadgeCount(player);
            if (badgeCount > 0) {
                info += ` | 徽章: ${badgeCount}`;
            }
        }
        
        this.spectatorInfo.textContent = info;
    }

    /**
     * 添加到观战历史
     * @param {string} playerId - 玩家ID
     */
    addToHistory(playerId) {
        // 移除重复项
        this.spectatingHistory = this.spectatingHistory.filter(id => id !== playerId);
        
        // 添加到开头
        this.spectatingHistory.unshift(playerId);
        
        // 限制历史长度
        if (this.spectatingHistory.length > this.maxHistoryLength) {
            this.spectatingHistory = this.spectatingHistory.slice(0, this.maxHistoryLength);
        }
    }

    /**
     * 获取观战历史
     * @returns {Array} 观战历史
     */
    getSpectatingHistory() {
        return [...this.spectatingHistory];
    }

    /**
     * 清理资源
     */
    cleanup() {
        if (this.spectatorCanvas) {
            this.spectatorCanvas.remove();
        }
        if (this.spectatorInfo) {
            this.spectatorInfo.remove();
        }
        if (this.spectatorControls) {
            this.spectatorControls.remove();
        }
        
        this.isSpectating = false;
        this.spectatingPlayerId = null;
    }
}

// 创建全局观战系统
window.spectatorSystem = new SpectatorSystem();