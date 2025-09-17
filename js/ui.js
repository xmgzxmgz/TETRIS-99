/**
 * UI管理器 - 负责游戏界面的渲染和交互
 * 处理游戏界面元素的显示、更新和用户交互
 */
class UIManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameOverlay = null;
        this.startButton = null;
        this.overlayMessage = null;
        
        // UI配置
        this.config = {
            colors: {
                background: '#1a1a2e',
                primary: '#16213e',
                secondary: '#0f3460',
                accent: '#e94560',
                text: '#ffffff',
                textSecondary: '#cccccc',
                border: '#444444'
            },
            fonts: {
                title: '24px Arial, sans-serif',
                subtitle: '18px Arial, sans-serif',
                normal: '14px Arial, sans-serif',
                small: '12px Arial, sans-serif'
            },
            spacing: {
                padding: 10,
                margin: 5,
                borderRadius: 5
            }
        };
        
        this.messageQueue = [];
        this.currentMessage = null;
        this.messageTimer = 0;
    }
    
    /**
     * 初始化UI管理器
     * @param {HTMLCanvasElement} canvas - 游戏画布
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 获取DOM元素
        this.gameOverlay = document.getElementById('gameOverlay');
        this.startButton = document.getElementById('startButton');
        this.overlayMessage = document.getElementById('overlayMessage');
        
        // 设置画布样式
        this.setupCanvas();
        
        console.log('UI管理器初始化完成');
    }
    
    /**
     * 设置画布样式
     */
    setupCanvas() {
        if (!this.canvas) return;
        
        this.canvas.style.border = `2px solid ${this.config.colors.border}`;
        this.canvas.style.borderRadius = `${this.config.spacing.borderRadius}px`;
        this.canvas.style.backgroundColor = this.config.colors.background;
    }
    
    /**
     * 显示消息
     * @param {string} message - 消息内容
     * @param {number} duration - 显示时长（毫秒）
     * @param {string} type - 消息类型
     */
    showMessage(message, duration = 3000, type = 'info') {
        this.messageQueue.push({
            text: message,
            duration: duration,
            type: type,
            timestamp: Date.now()
        });
        
        if (!this.currentMessage) {
            this.showNextMessage();
        }
    }
    
    /**
     * 显示下一条消息
     */
    showNextMessage() {
        if (this.messageQueue.length === 0) {
            this.currentMessage = null;
            return;
        }
        
        this.currentMessage = this.messageQueue.shift();
        this.messageTimer = this.currentMessage.duration;
    }
    
    /**
     * 更新UI状态
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        // 更新消息显示
        if (this.currentMessage) {
            this.messageTimer -= deltaTime;
            if (this.messageTimer <= 0) {
                this.showNextMessage();
            }
        }
    }
    
    /**
     * 渲染游戏界面
     * @param {Object} gameState - 游戏状态
     */
    render(gameState) {
        if (!this.ctx) return;
        
        // 清空画布
        this.clearCanvas();
        
        // 渲染消息
        this.renderMessages();
        
        // 渲染快捷键提示
        this.renderHotkeys();
    }
    
    /**
     * 清空画布
     */
    clearCanvas() {
        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * 渲染消息
     */
    renderMessages() {
        if (!this.currentMessage) return;
        
        const ctx = this.ctx;
        const message = this.currentMessage;
        
        // 设置消息样式
        ctx.font = this.config.fonts.normal;
        ctx.textAlign = 'center';
        
        // 根据消息类型设置颜色
        switch (message.type) {
            case 'success':
                ctx.fillStyle = '#4CAF50';
                break;
            case 'warning':
                ctx.fillStyle = '#FF9800';
                break;
            case 'error':
                ctx.fillStyle = '#F44336';
                break;
            default:
                ctx.fillStyle = this.config.colors.text;
        }
        
        // 计算消息位置
        const x = this.canvas.width / 2;
        const y = 50;
        
        // 绘制消息背景
        const textWidth = ctx.measureText(message.text).width;
        const padding = this.config.spacing.padding;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
            x - textWidth / 2 - padding,
            y - 20,
            textWidth + padding * 2,
            30
        );
        
        // 绘制消息文本
        ctx.fillStyle = this.config.colors.text;
        ctx.fillText(message.text, x, y);
    }
    
    /**
     * 渲染快捷键提示
     */
    renderHotkeys() {
        const ctx = this.ctx;
        const hotkeys = [
            'F1: AI测试',
            'F2: 观战模式',
            'F3: 性能统计',
            'M: 切换游戏模式',
            'V: 开始观战',
            'Q/E: 使用道具'
        ];
        
        ctx.font = this.config.fonts.small;
        ctx.fillStyle = this.config.colors.textSecondary;
        ctx.textAlign = 'left';
        
        const startY = this.canvas.height - (hotkeys.length * 15) - 10;
        
        hotkeys.forEach((hotkey, index) => {
            ctx.fillText(hotkey, 10, startY + index * 15);
        });
    }
    
    /**
     * 渲染游戏统计信息
     * @param {Object} stats - 统计数据
     */
    renderStats(stats) {
        if (!stats) return;
        
        const ctx = this.ctx;
        ctx.font = this.config.fonts.small;
        ctx.fillStyle = this.config.colors.text;
        ctx.textAlign = 'right';
        
        const x = this.canvas.width - 10;
        let y = 30;
        
        const statLines = [
            `FPS: ${stats.fps || 0}`,
            `玩家: ${stats.alivePlayers || 0}`,
            `排名: ${stats.rank || 99}`,
            `KO: ${stats.kos || 0}`,
            `清行: ${stats.lines || 0}`
        ];
        
        statLines.forEach((line, index) => {
            ctx.fillText(line, x, y + index * 15);
        });
    }
    
    /**
     * 渲染小地图
     * @param {Array} players - 玩家列表
     */
    renderMinimap(players) {
        if (!players || players.length === 0) return;
        
        const ctx = this.ctx;
        const minimapSize = 150;
        const x = this.canvas.width - minimapSize - 10;
        const y = this.canvas.height - minimapSize - 10;
        
        // 绘制小地图背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, minimapSize, minimapSize);
        
        ctx.strokeStyle = this.config.colors.border;
        ctx.strokeRect(x, y, minimapSize, minimapSize);
        
        // 绘制玩家点
        const gridSize = Math.ceil(Math.sqrt(players.length));
        const cellSize = minimapSize / gridSize;
        
        players.forEach((player, index) => {
            if (!player.isAlive) return;
            
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            const px = x + col * cellSize + cellSize / 2;
            const py = y + row * cellSize + cellSize / 2;
            
            // 设置玩家颜色
            if (player.isAI) {
                ctx.fillStyle = player.id === 'human' ? '#00FF00' : '#FF0000';
            } else {
                ctx.fillStyle = '#00FF00'; // 人类玩家为绿色
            }
            
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    /**
     * 显示游戏结束界面
     * @param {Object} winner - 获胜者信息
     * @param {Object} stats - 游戏统计
     */
    showGameOverScreen(winner, stats) {
        if (!this.gameOverlay) return;
        
        this.gameOverlay.classList.remove('hidden');
        
        if (this.overlayMessage) {
            this.overlayMessage.innerHTML = `
                <h2>游戏结束</h2>
                <p>获胜者: ${winner ? winner.name : '未知'}</p>
                ${stats ? this.formatGameStats(stats) : ''}
            `;
        }
        
        if (this.startButton) {
            this.startButton.textContent = '重新开始';
            this.startButton.style.display = 'block';
        }
    }
    
    /**
     * 格式化游戏统计信息
     * @param {Object} stats - 统计数据
     * @returns {string} 格式化的HTML字符串
     */
    formatGameStats(stats) {
        return `
            <div style="margin-top: 15px; font-size: 14px;">
                <div>本局统计:</div>
                <div>排名: ${stats.rank || 99}</div>
                <div>KO数: ${stats.kos || 0}</div>
                <div>清行数: ${stats.lines || 0}</div>
                <div>游戏时长: ${this.formatTime(stats.playTime || 0)}</div>
            </div>
        `;
    }
    
    /**
     * 格式化时间显示
     * @param {number} milliseconds - 毫秒数
     * @returns {string} 格式化的时间字符串
     */
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * 隐藏开始界面
     */
    hideStartScreen() {
        if (this.gameOverlay) {
            this.gameOverlay.classList.add('hidden');
        }
    }
    
    /**
     * 显示开始界面
     */
    showStartScreen() {
        if (this.gameOverlay) {
            this.gameOverlay.classList.remove('hidden');
        }
        
        if (this.overlayMessage) {
            this.overlayMessage.innerHTML = '<h1>TETRIS 99</h1><p>准备开始游戏</p>';
        }
        
        if (this.startButton) {
            this.startButton.textContent = '开始游戏';
            this.startButton.style.display = 'block';
        }
    }
    
    /**
     * 获取UI配置
     * @returns {Object} UI配置对象
     */
    getConfig() {
        return this.config;
    }
    
    /**
     * 更新UI配置
     * @param {Object} newConfig - 新的配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    
    /**
     * 销毁UI管理器
     */
    destroy() {
        this.canvas = null;
        this.ctx = null;
        this.gameOverlay = null;
        this.startButton = null;
        this.overlayMessage = null;
        this.messageQueue = [];
        this.currentMessage = null;
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
    window.uiManager = new UIManager();
}