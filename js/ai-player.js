/**
 * AI玩家类 - 实现智能的俄罗斯方块AI对手
 * 使用启发式算法进行决策
 */

class AIPlayer {
    /**
     * 构造函数
     * @param {number} id - AI玩家ID
     * @param {string} difficulty - 难度等级 ('easy', 'medium', 'hard', 'expert')
     */
    constructor(id, difficulty = 'medium') {
        this.id = id;
        this.difficulty = difficulty;
        this.gameEngine = new TetrisGameEngine();
        this.isAlive = true;
        this.rank = 99;
        this.koCount = 0;
        this.targetPlayer = null;
        this.attackQueue = [];
        this.lastMoveTime = 0;
        this.moveDelay = this.getMoveDelay();
        this.thinkingTime = 0;
        
        // AI参数根据难度调整
        this.aiParams = this.getAIParams(difficulty);
        
        // 性能统计
        this.stats = {
            totalMoves: 0,
            averageThinkTime: 0,
            efficiency: 1.0
        };
    }

    /**
     * 根据难度获取移动延迟
     * @returns {number} 移动延迟（毫秒）
     */
    getMoveDelay() {
        const delays = {
            'easy': 800 + Math.random() * 400,
            'medium': 400 + Math.random() * 200,
            'hard': 200 + Math.random() * 100,
            'expert': 100 + Math.random() * 50
        };
        return delays[this.difficulty] || delays['medium'];
    }

    /**
     * 根据难度获取AI参数
     * @param {string} difficulty - 难度等级
     * @returns {Object} AI参数对象
     */
    getAIParams(difficulty) {
        const params = {
            'easy': {
                lookAhead: 1,
                heightWeight: -0.5,
                linesWeight: 0.8,
                holesWeight: -0.3,
                bumpinessWeight: -0.1,
                aggregateHeightWeight: -0.1,
                errorRate: 0.15
            },
            'medium': {
                lookAhead: 2,
                heightWeight: -0.7,
                linesWeight: 1.0,
                holesWeight: -0.5,
                bumpinessWeight: -0.2,
                aggregateHeightWeight: -0.2,
                errorRate: 0.08
            },
            'hard': {
                lookAhead: 3,
                heightWeight: -0.9,
                linesWeight: 1.2,
                holesWeight: -0.7,
                bumpinessWeight: -0.3,
                aggregateHeightWeight: -0.3,
                errorRate: 0.03
            },
            'expert': {
                lookAhead: 4,
                heightWeight: -1.0,
                linesWeight: 1.5,
                holesWeight: -1.0,
                bumpinessWeight: -0.4,
                aggregateHeightWeight: -0.4,
                errorRate: 0.01
            }
        };
        return params[difficulty] || params['medium'];
    }

    /**
     * 更新AI玩家状态
     * @param {number} deltaTime - 时间增量（毫秒）
     */
    update(deltaTime) {
        if (!this.isAlive || this.gameEngine.gameOver) {
            this.isAlive = false;
            return;
        }

        this.gameEngine.update(deltaTime);
        this.lastMoveTime += deltaTime;

        // 动态调整决策频率以优化性能
        const targetFPS = window.performanceMonitor ? window.performanceMonitor.getTargetFPS() : 60;
        const currentFPS = window.performanceMonitor ? window.performanceMonitor.getCurrentFPS() : 60;
        
        // 如果帧率低于目标，降低AI决策频率
        let adjustedDelay = this.moveDelay;
        if (currentFPS < targetFPS * 0.8) {
            adjustedDelay *= 1.5; // 降低决策频率
        } else if (currentFPS > targetFPS * 0.95) {
            adjustedDelay *= 0.9; // 提高决策频率
        }

        // 检查是否需要做决策
        if (this.lastMoveTime >= adjustedDelay) {
            // 限制AI思考时间以避免卡顿
            const thinkStartTime = performance.now();
            this.makeMove();
            const thinkTime = performance.now() - thinkStartTime;
            
            // 如果思考时间过长，增加决策间隔
            if (thinkTime > 16) { // 超过一帧的时间
                this.moveDelay = Math.min(this.moveDelay * 1.2, 500);
            } else if (thinkTime < 5) {
                this.moveDelay = Math.max(this.moveDelay * 0.95, 50);
            }
            
            this.lastMoveTime = 0;
            this.moveDelay = this.getMoveDelay(); // 随机化下次移动时间
        }

        // 处理攻击队列
        this.processAttackQueue(deltaTime);
    }

    /**
     * AI做出移动决策
     */
    makeMove() {
        if (!this.gameEngine.currentPiece) return;

        const startTime = performance.now();
        
        // 引入错误率
        if (Math.random() < this.aiParams.errorRate) {
            this.makeRandomMove();
            return;
        }

        const bestMove = this.findBestMove();
        if (bestMove) {
            this.executeBestMove(bestMove);
        }

        // 更新思考时间统计
        this.thinkingTime = performance.now() - startTime;
        this.stats.totalMoves++;
        this.stats.averageThinkTime = 
            (this.stats.averageThinkTime * (this.stats.totalMoves - 1) + this.thinkingTime) / this.stats.totalMoves;
    }

    /**
     * 寻找最佳移动
     * @returns {Object|null} 最佳移动对象
     */
    findBestMove() {
        const currentPiece = this.gameEngine.currentPiece;
        if (!currentPiece) return null;

        let bestMove = null;
        let bestScore = -Infinity;

        // 尝试所有可能的位置和旋转
        for (let rotation = 0; rotation < currentPiece.shape.length; rotation++) {
            for (let x = -2; x < this.gameEngine.width + 2; x++) {
                const testPiece = currentPiece.clone();
                testPiece.rotation = rotation;
                testPiece.x = x;
                testPiece.y = 0;

                // 将方块降到底部
                while (!this.gameEngine.isColliding(testPiece)) {
                    testPiece.y++;
                }
                testPiece.y--;

                // 检查位置是否有效
                if (this.gameEngine.isColliding(testPiece)) continue;

                // 评估这个位置
                const score = this.evaluatePosition(testPiece);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = {
                        x: testPiece.x,
                        y: testPiece.y,
                        rotation: rotation,
                        score: score
                    };
                }
            }
        }

        return bestMove;
    }

    /**
     * 评估方块位置的得分
     * @param {TetrisPiece} piece - 要评估的方块
     * @returns {number} 位置得分
     */
    evaluatePosition(piece) {
        // 创建临时游戏板
        const tempBoard = this.gameEngine.board.map(row => [...row]);
        
        // 将方块放置到临时游戏板
        const blocks = piece.getBlocks();
        blocks.forEach(block => {
            if (block.y >= 0 && block.y < this.gameEngine.height && 
                block.x >= 0 && block.x < this.gameEngine.width) {
                tempBoard[block.y][block.x] = { color: piece.color, type: piece.type };
            }
        });

        // 计算清除的行数
        const clearedLines = this.countClearedLines(tempBoard);
        
        // 移除清除的行
        const boardAfterClear = this.removeClearedLines(tempBoard);

        // 计算各种评估指标
        const height = this.getMaxHeight(boardAfterClear);
        const holes = this.countHoles(boardAfterClear);
        const bumpiness = this.getBumpiness(boardAfterClear);
        const aggregateHeight = this.getAggregateHeight(boardAfterClear);

        // 计算总分
        let score = 0;
        score += this.aiParams.linesWeight * clearedLines * clearedLines; // 清除行数的平方
        score += this.aiParams.heightWeight * height;
        score += this.aiParams.holesWeight * holes;
        score += this.aiParams.bumpinessWeight * bumpiness;
        score += this.aiParams.aggregateHeightWeight * aggregateHeight;

        // T-Spin奖励
        if (piece.type === 'T' && piece.isTSpin(this.gameEngine.board)) {
            score += 100;
        }

        // 完美清除奖励
        if (this.isPerfectClear(boardAfterClear)) {
            score += 1000;
        }

        return score;
    }

    /**
     * 计算可清除的行数
     * @param {Array} board - 游戏板
     * @returns {number} 可清除的行数
     */
    countClearedLines(board) {
        let lines = 0;
        for (let y = 0; y < board.length; y++) {
            if (board[y].every(cell => cell !== null)) {
                lines++;
            }
        }
        return lines;
    }

    /**
     * 移除已清除的行
     * @param {Array} board - 游戏板
     * @returns {Array} 清除行后的游戏板
     */
    removeClearedLines(board) {
        const newBoard = board.filter(row => !row.every(cell => cell !== null));
        while (newBoard.length < this.gameEngine.height) {
            newBoard.unshift(Array(this.gameEngine.width).fill(null));
        }
        return newBoard;
    }

    /**
     * 获取最大高度
     * @param {Array} board - 游戏板
     * @returns {number} 最大高度
     */
    getMaxHeight(board) {
        for (let y = 0; y < board.length; y++) {
            if (board[y].some(cell => cell !== null)) {
                return board.length - y;
            }
        }
        return 0;
    }

    /**
     * 计算空洞数量
     * @param {Array} board - 游戏板
     * @returns {number} 空洞数量
     */
    countHoles(board) {
        let holes = 0;
        for (let x = 0; x < this.gameEngine.width; x++) {
            let foundBlock = false;
            for (let y = 0; y < this.gameEngine.height; y++) {
                if (board[y][x] !== null) {
                    foundBlock = true;
                } else if (foundBlock) {
                    holes++;
                }
            }
        }
        return holes;
    }

    /**
     * 计算表面不平整度
     * @param {Array} board - 游戏板
     * @returns {number} 不平整度
     */
    getBumpiness(board) {
        const heights = [];
        for (let x = 0; x < this.gameEngine.width; x++) {
            let height = 0;
            for (let y = 0; y < this.gameEngine.height; y++) {
                if (board[y][x] !== null) {
                    height = this.gameEngine.height - y;
                    break;
                }
            }
            heights.push(height);
        }

        let bumpiness = 0;
        for (let i = 0; i < heights.length - 1; i++) {
            bumpiness += Math.abs(heights[i] - heights[i + 1]);
        }
        return bumpiness;
    }

    /**
     * 计算总高度
     * @param {Array} board - 游戏板
     * @returns {number} 总高度
     */
    getAggregateHeight(board) {
        let totalHeight = 0;
        for (let x = 0; x < this.gameEngine.width; x++) {
            for (let y = 0; y < this.gameEngine.height; y++) {
                if (board[y][x] !== null) {
                    totalHeight += this.gameEngine.height - y;
                    break;
                }
            }
        }
        return totalHeight;
    }

    /**
     * 检查是否为完美清除
     * @param {Array} board - 游戏板
     * @returns {boolean} 是否为完美清除
     */
    isPerfectClear(board) {
        return board.every(row => row.every(cell => cell === null));
    }

    /**
     * 执行最佳移动
     * @param {Object} move - 移动对象
     */
    executeBestMove(move) {
        const currentPiece = this.gameEngine.currentPiece;
        if (!currentPiece) return;

        // 旋转到目标状态
        while (currentPiece.rotation !== move.rotation) {
            this.gameEngine.rotatePiece(1);
        }

        // 移动到目标X位置
        const dx = move.x - currentPiece.x;
        if (dx !== 0) {
            this.gameEngine.movePiece(dx, 0);
        }

        // 硬降
        this.gameEngine.hardDrop();
    }

    /**
     * 做随机移动（用于引入错误）
     */
    makeRandomMove() {
        const actions = ['left', 'right', 'rotate', 'drop', 'hold'];
        const action = actions[Math.floor(Math.random() * actions.length)];

        switch (action) {
            case 'left':
                this.gameEngine.movePiece(-1, 0);
                break;
            case 'right':
                this.gameEngine.movePiece(1, 0);
                break;
            case 'rotate':
                this.gameEngine.rotatePiece(1);
                break;
            case 'drop':
                this.gameEngine.hardDrop();
                break;
            case 'hold':
                this.gameEngine.holdPiece();
                break;
        }
    }

    /**
     * 处理攻击队列
     * @param {number} deltaTime - 时间增量
     */
    processAttackQueue(deltaTime) {
        if (this.attackQueue.length > 0) {
            const attack = this.attackQueue.shift();
            this.gameEngine.receiveAttack(attack.lines);
        }
    }

    /**
     * 接收攻击
     * @param {number} lines - 攻击行数
     * @param {number} fromPlayer - 攻击来源玩家ID
     */
    receiveAttack(lines, fromPlayer) {
        this.attackQueue.push({
            lines: lines,
            from: fromPlayer,
            timestamp: Date.now()
        });
    }

    /**
     * 发送攻击
     * @returns {number} 攻击行数
     */
    sendAttack() {
        const lines = this.gameEngine.lines;
        const lastClear = this.gameEngine.lastClearWasTSpin;
        
        // 计算攻击力度
        let attackLines = 0;
        if (lines > 0) {
            attackLines = this.gameEngine.getAttackLines(lines, lastClear);
        }

        return attackLines;
    }

    /**
     * 选择攻击目标
     * @param {Array} players - 所有玩家列表
     * @param {string} strategy - 攻击策略
     * @returns {number|null} 目标玩家ID
     */
    selectTarget(players, strategy = 'random') {
        const alivePlayers = players.filter(p => p.isAlive && p.id !== this.id);
        if (alivePlayers.length === 0) return null;

        switch (strategy) {
            case 'random':
                return alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;
            
            case 'attacker':
                // 攻击正在攻击自己的玩家
                const attackers = alivePlayers.filter(p => p.targetPlayer === this.id);
                if (attackers.length > 0) {
                    return attackers[Math.floor(Math.random() * attackers.length)].id;
                }
                return this.selectTarget(players, 'random');
            
            case 'ko':
                // 攻击血量最少的玩家
                const weakest = alivePlayers.reduce((min, p) => 
                    p.gameEngine.getMaxHeight(p.gameEngine.board) > min.gameEngine.getMaxHeight(min.gameEngine.board) ? p : min
                );
                return weakest.id;
            
            case 'badge':
                // 攻击KO数最多的玩家
                const strongest = alivePlayers.reduce((max, p) => 
                    p.koCount > max.koCount ? p : max
                );
                return strongest.id;
            
            default:
                return this.selectTarget(players, 'random');
        }
    }

    /**
     * 重置AI玩家
     */
    reset() {
        this.gameEngine.reset();
        this.isAlive = true;
        this.rank = 99;
        this.koCount = 0;
        this.targetPlayer = null;
        this.attackQueue = [];
        this.lastMoveTime = 0;
        this.moveDelay = this.getMoveDelay();
        this.thinkingTime = 0;
        
        this.stats = {
            totalMoves: 0,
            averageThinkTime: 0,
            efficiency: 1.0
        };
    }

    /**
     * 获取AI状态信息
     * @returns {Object} 状态信息
     */
    getStatus() {
        return {
            id: this.id,
            isAlive: this.isAlive,
            rank: this.rank,
            score: this.gameEngine.score,
            level: this.gameEngine.level,
            lines: this.gameEngine.lines,
            koCount: this.koCount,
            difficulty: this.difficulty,
            board: this.gameEngine.board,
            currentPiece: this.gameEngine.currentPiece,
            nextPiece: this.gameEngine.nextPiece,
            stats: this.stats
        };
    }
}