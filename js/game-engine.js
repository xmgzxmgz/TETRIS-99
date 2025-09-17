/**
 * 俄罗斯方块游戏引擎核心类
 * 负责游戏逻辑、碰撞检测、行消除等核心功能
 */

class TetrisGameEngine {
    /**
     * 构造函数
     * @param {number} width - 游戏板宽度
     * @param {number} height - 游戏板高度
     * @param {Function} onSoundEffect - 音效回调函数
     */
    constructor(width = 10, height = 20, onSoundEffect = null) {
        this.width = width;
        this.height = height;
        this.board = this.createEmptyBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.pieceGenerator = new PieceGenerator();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        this.lastClearWasTSpin = false;
        this.gameOver = false;
        this.dropTimer = 0;
        this.dropInterval = 1000; // 毫秒
        this.lockDelay = 500;
        this.lockTimer = 0;
        this.isLocking = false;
        
        // 音效回调
        this.onSoundEffect = onSoundEffect;
        
        // 统计数据
        this.stats = {
            totalPieces: 0,
            totalLines: 0,
            singles: 0,
            doubles: 0,
            triples: 0,
            tetrises: 0,
            tSpins: 0,
            perfectClears: 0
        };
        
        this.initializeGame();
    }

    /**
     * 创建空的游戏板
     * @returns {Array} 二维数组表示的游戏板
     */
    createEmptyBoard() {
        return Array(this.height).fill().map(() => Array(this.width).fill(null));
    }

    /**
     * 初始化游戏
     */
    initializeGame() {
        this.board = this.createEmptyBoard();
        this.nextPiece = this.pieceGenerator.getNext();
        this.spawnNewPiece();
    }

    /**
     * 生成新方块
     */
    spawnNewPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.pieceGenerator.getNext();
        this.canHold = true;
        this.isLocking = false;
        this.lockTimer = 0;
        this.stats.totalPieces++;

        // 检查游戏结束
        if (this.isColliding(this.currentPiece)) {
            this.gameOver = true;
            return;
        }
    }

    /**
     * 检查方块是否与游戏板或其他方块碰撞
     * @param {TetrisPiece} piece - 要检查的方块
     * @returns {boolean} 是否碰撞
     */
    isColliding(piece) {
        const blocks = piece.getBlocks();
        
        for (const block of blocks) {
            // 检查边界
            if (block.x < 0 || block.x >= this.width || 
                block.y < 0 || block.y >= this.height) {
                return true;
            }
            
            // 检查与已放置方块的碰撞
            if (this.board[block.y][block.x] !== null) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 移动当前方块
     * @param {number} dx - X方向移动距离
     * @param {number} dy - Y方向移动距离
     * @returns {boolean} 移动是否成功
     */
    movePiece(dx, dy) {
        if (!this.currentPiece || this.gameOver) return false;
        
        const originalX = this.currentPiece.x;
        const originalY = this.currentPiece.y;
        
        this.currentPiece.move(dx, dy);
        
        if (this.isColliding(this.currentPiece)) {
            this.currentPiece.x = originalX;
            this.currentPiece.y = originalY;
            return false;
        }
        
        // 播放移动音效
        if (dx !== 0 && this.onSoundEffect) {
            this.onSoundEffect('move');
        }
        
        // 重置锁定计时器
        if (dy === 0) {
            this.resetLockTimer();
        }
        
        return true;
    }

    /**
     * 旋转当前方块（使用SRS系统）
     * @param {number} direction - 旋转方向 (1为顺时针，-1为逆时针)
     * @returns {boolean} 旋转是否成功
     */
    rotatePiece(direction = 1) {
        if (!this.currentPiece || this.gameOver) return false;
        
        const originalRotation = this.currentPiece.rotation;
        const newRotation = (originalRotation + direction + this.currentPiece.shape.length) % this.currentPiece.shape.length;
        
        // 获取踢墙测试数据
        const kickData = getWallKickData(this.currentPiece.type, originalRotation, newRotation);
        
        this.currentPiece.rotation = newRotation;
        
        // 尝试踢墙
        for (const [dx, dy] of kickData) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            
            if (!this.isColliding(this.currentPiece)) {
                this.resetLockTimer();
                
                // 播放旋转音效
                if (this.onSoundEffect) {
                    this.onSoundEffect('rotate');
                }
                
                return true;
            }
            
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
        }
        
        // 旋转失败，恢复原状态
        this.currentPiece.rotation = originalRotation;
        return false;
    }

    /**
     * 硬降 - 直接将方块降到底部
     * @returns {number} 降落的行数
     */
    hardDrop() {
        if (!this.currentPiece || this.gameOver) return 0;
        
        let dropDistance = 0;
        while (this.movePiece(0, 1)) {
            dropDistance++;
        }
        
        this.lockPiece();
        
        // 硬降奖励分数
        this.score += dropDistance * 2;
        
        // 播放硬降音效
        if (this.onSoundEffect) {
            this.onSoundEffect('drop');
        }
        
        return dropDistance;
    }

    /**
     * 软降 - 加速方块下降
     * @returns {boolean} 是否成功下降
     */
    softDrop() {
        return this.movePiece(0, 1);
    }

    /**
     * 保留当前方块
     * @returns {boolean} 保留是否成功
     */
    holdPiece() {
        if (!this.canHold || !this.currentPiece || this.gameOver) return false;
        
        const currentType = this.currentPiece.type;
        
        if (this.holdPiece) {
            // 交换当前方块和保留方块
            const holdType = this.holdPiece.type;
            this.holdPiece = new TetrisPiece(currentType);
            this.currentPiece = new TetrisPiece(holdType);
            this.currentPiece.x = Math.floor(this.width / 2) - 2;
            this.currentPiece.y = 0;
        } else {
            // 保留当前方块，生成新方块
            this.holdPiece = new TetrisPiece(currentType);
            this.spawnNewPiece();
        }
        
        this.canHold = false;
        
        // 播放保留音效
        if (this.onSoundEffect) {
            this.onSoundEffect('hold');
        }
        
        return true;
    }

    /**
     * 锁定当前方块到游戏板
     */
    lockPiece() {
        if (!this.currentPiece) return;
        
        const blocks = this.currentPiece.getBlocks();
        
        // 将方块添加到游戏板
        blocks.forEach(block => {
            if (block.y >= 0 && block.y < this.height && 
                block.x >= 0 && block.x < this.width) {
                this.board[block.y][block.x] = {
                    color: this.currentPiece.color,
                    type: this.currentPiece.type
                };
            }
        });
        
        // 检查T-Spin
        const isTSpin = this.currentPiece.isTSpin(this.board);
        
        // 检查并清除完整行
        const clearedLines = this.clearLines();
        
        // 计算分数
        this.calculateScore(clearedLines, isTSpin);
        
        // 生成新方块
        this.spawnNewPiece();
    }

    /**
     * 清除完整的行
     * @returns {number} 清除的行数
     */
    clearLines() {
        const fullRows = [];
        
        // 找到所有完整的行
        for (let y = 0; y < this.height; y++) {
            if (this.board[y].every(cell => cell !== null)) {
                fullRows.push(y);
            }
        }
        
        if (fullRows.length === 0) {
            this.combo = 0;
            return 0;
        }
        
        // 移除完整的行
        fullRows.forEach(row => {
            this.board.splice(row, 1);
            this.board.unshift(Array(this.width).fill(null));
        });
        
        this.lines += fullRows.length;
        this.stats.totalLines += fullRows.length;
        this.combo++;
        
        // 更新统计
        switch (fullRows.length) {
            case 1: this.stats.singles++; break;
            case 2: this.stats.doubles++; break;
            case 3: this.stats.triples++; break;
            case 4: this.stats.tetrises++; break;
        }
        
        // 播放行消除音效
        if (this.onSoundEffect && window.audioManager) {
            window.audioManager.playLineClearSound(fullRows.length);
        }
        
        // 检查完美清除
        if (this.isPerfectClear()) {
            this.stats.perfectClears++;
        }
        
        // 更新等级
        this.updateLevel();
        
        return fullRows.length;
    }

    /**
     * 检查是否为完美清除
     * @returns {boolean} 是否为完美清除
     */
    isPerfectClear() {
        return this.board.every(row => row.every(cell => cell === null));
    }

    /**
     * 计算分数
     * @param {number} lines - 清除的行数
     * @param {boolean} isTSpin - 是否为T-Spin
     */
    calculateScore(lines, isTSpin) {
        let baseScore = 0;
        
        if (isTSpin) {
            this.stats.tSpins++;
            this.lastClearWasTSpin = true;
            
            switch (lines) {
                case 0: baseScore = 400; break;  // T-Spin Mini
                case 1: baseScore = 800; break;  // T-Spin Single
                case 2: baseScore = 1200; break; // T-Spin Double
                case 3: baseScore = 1600; break; // T-Spin Triple
            }
        } else {
            this.lastClearWasTSpin = false;
            
            switch (lines) {
                case 1: baseScore = 100; break;  // Single
                case 2: baseScore = 300; break;  // Double
                case 3: baseScore = 500; break;  // Triple
                case 4: baseScore = 800; break;  // Tetris
            }
        }
        
        // 连击奖励
        if (this.combo > 1) {
            baseScore += 50 * (this.combo - 1);
        }
        
        // 完美清除奖励
        if (this.isPerfectClear()) {
            baseScore *= 10;
        }
        
        this.score += baseScore * this.level;
    }

    /**
     * 更新等级
     */
    updateLevel() {
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
        }
    }

    /**
     * 重置锁定计时器
     */
    resetLockTimer() {
        this.lockTimer = 0;
        this.isLocking = false;
    }

    /**
     * 更新游戏状态
     * @param {number} deltaTime - 时间增量（毫秒）
     */
    update(deltaTime) {
        if (this.gameOver || !this.currentPiece) return;
        
        // 更新下降计时器
        this.dropTimer += deltaTime;
        
        // 检查是否需要自动下降
        if (this.dropTimer >= this.dropInterval) {
            if (!this.movePiece(0, 1)) {
                // 无法下降，开始锁定计时
                if (!this.isLocking) {
                    this.isLocking = true;
                    this.lockTimer = 0;
                }
            }
            this.dropTimer = 0;
        }
        
        // 更新锁定计时器
        if (this.isLocking) {
            this.lockTimer += deltaTime;
            if (this.lockTimer >= this.lockDelay) {
                this.lockPiece();
            }
        }
    }

    /**
     * 获取幽灵方块位置
     * @returns {TetrisPiece|null} 幽灵方块
     */
    getGhostPiece() {
        if (!this.currentPiece) return null;
        
        const ghost = this.currentPiece.clone();
        
        while (!this.isColliding(ghost)) {
            ghost.y++;
        }
        ghost.y--;
        
        return ghost;
    }

    /**
     * 获取攻击垃圾行数
     * @param {number} lines - 清除的行数
     * @param {boolean} isTSpin - 是否为T-Spin
     * @returns {number} 攻击行数
     */
    getAttackLines(lines, isTSpin) {
        let attack = 0;
        
        if (isTSpin) {
            switch (lines) {
                case 0: attack = 0; break;  // T-Spin Mini
                case 1: attack = 2; break;  // T-Spin Single
                case 2: attack = 4; break;  // T-Spin Double
                case 3: attack = 6; break;  // T-Spin Triple
            }
        } else {
            switch (lines) {
                case 1: attack = 0; break;  // Single
                case 2: attack = 1; break;  // Double
                case 3: attack = 2; break;  // Triple
                case 4: attack = 4; break;  // Tetris
            }
        }
        
        // 连击奖励
        if (this.combo > 1) {
            attack += Math.min(this.combo - 1, 4);
        }
        
        // 完美清除奖励
        if (this.isPerfectClear()) {
            attack += 10;
        }
        
        return attack;
    }

    /**
     * 接收垃圾行攻击
     * @param {number} lines - 垃圾行数
     */
    receiveAttack(lines) {
        if (lines <= 0) return;
        
        // 移除顶部行
        for (let i = 0; i < lines; i++) {
            this.board.shift();
        }
        
        // 添加垃圾行到底部
        for (let i = 0; i < lines; i++) {
            const garbageLine = Array(this.width).fill({
                color: '#666666',
                type: 'garbage'
            });
            
            // 随机留一个空隙
            const hole = Math.floor(Math.random() * this.width);
            garbageLine[hole] = null;
            
            this.board.push(garbageLine);
        }
        
        // 检查当前方块是否仍然有效
        if (this.currentPiece && this.isColliding(this.currentPiece)) {
            this.gameOver = true;
        }
    }

    /**
     * 重置游戏
     */
    reset() {
        this.board = this.createEmptyBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.pieceGenerator = new PieceGenerator();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        this.lastClearWasTSpin = false;
        this.gameOver = false;
        this.dropTimer = 0;
        this.dropInterval = 1000;
        this.lockDelay = 500;
        this.lockTimer = 0;
        this.isLocking = false;
        
        // 重置统计
        this.stats = {
            totalPieces: 0,
            totalLines: 0,
            singles: 0,
            doubles: 0,
            triples: 0,
            tetrises: 0,
            tSpins: 0,
            perfectClears: 0
        };
        
        this.initializeGame();
    }
}