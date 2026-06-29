/**
 * TETRIS 99 对战系统
 * 管理99人对战逻辑、攻击系统、排名等
 */

class BattleSystem {
    /**
     * 构造函数
     */
    constructor() {
        this.players = [];
        this.humanPlayer = null;
        this.aiPlayers = [];
        this.gameStarted = false;
        this.gameEnded = false;
        this.currentRank = 99;
        this.eliminationQueue = [];
        this.attackTargetStrategy = 'random';

        // 游戏统计
        this.gameStats = {
            startTime: null,
            endTime: null,
            totalKOs: 0,
            totalAttacks: 0,
            winner: null
        };
    }

    /**
     * 辅助方法：根据ID查找玩家
     * @param {string} id - 玩家ID
     * @returns {Object|undefined} 玩家对象
     */
    getPlayerById(id) {
        return this.players.find(p => p.id === id);
    }

    /**
     * 初始化战斗系统
     * @param {Object} settings - 游戏设置
     */
    init(settings = {}) {
        this.players = [];
        this.gameStartTime = Date.now();
        this.settings = {
            dropSpeed: 1,
            levelUpSpeed: 1,
            aiDifficulty: 5,
            humanPlayers: 1,
            aiPlayers: 98,
            teamMode: false,
            friendlyFire: true,
            sharedKO: false,
            infiniteMode: false,
            ...settings
        };

        // 创建人类玩家
        for (let h = 0; h < this.settings.humanPlayers; h++) {
            const humanPlayer = {
                id: h === 0 ? 'human' : `human_${h}`,
                name: h === 0 ? '玩家' : `玩家 ${h + 1}`,
                isAI: false,
                gameEngine: new TetrisGameEngine(10, 20, (soundName) => {
                    if (window.audioManager) {
                        window.audioManager.playSound(soundName);
                    }
                }),
                isAlive: true,
                rank: null,
                targetPlayer: null,
                attackQueue: [],
                koCount: 0,
                badges: 0,
                lastLinesCleared: 0,
                team: this.settings.teamMode ? (h % 2) : null,
                stats: {
                    kos: 0,
                    attacksSent: 0,
                    attacksReceived: 0,
                    linesCleared: 0,
                    tetrises: 0,
                    tSpins: 0,
                    perfectClears: 0,
                    maxCombo: 0,
                    currentCombo: 0
                }
            };

            humanPlayer.gameEngine.initializeGame();
            humanPlayer.gameEngine.dropSpeed = this.settings.dropSpeed;
            this.players.push(humanPlayer);
        }

        // 创建AI玩家
        for (let i = 0; i < this.settings.aiPlayers; i++) {
            const difficulty = this.getRandomDifficulty();
            const aiController = new AIPlayer(i, difficulty);

            const aiPlayer = {
                id: `ai_${i}`,
                name: `AI ${i + 1}`,
                isAI: true,
                gameEngine: aiController.gameEngine,
                aiController: aiController,
                isAlive: true,
                rank: null,
                targetPlayer: null,
                attackQueue: [],
                koCount: 0,
                badges: 0,
                lastLinesCleared: 0,
                difficulty: difficulty,
                team: this.settings.teamMode ? ((i + this.settings.humanPlayers) % 2) : null,
                stats: {
                    kos: 0,
                    attacksSent: 0,
                    attacksReceived: 0,
                    linesCleared: 0,
                    tetrises: 0,
                    tSpins: 0,
                    perfectClears: 0,
                    maxCombo: 0,
                    currentCombo: 0
                }
            };

            aiPlayer.gameEngine.initializeGame();
            aiPlayer.gameEngine.dropSpeed = this.settings.dropSpeed;
            aiPlayer.aiController.init(aiPlayer.gameEngine);
            aiPlayer.aiController.difficulty = this.settings.aiDifficulty;
            this.players.push(aiPlayer);
        }

        this.humanPlayer = this.players.find(p => !p.isAI);
        this.aiPlayers = this.players.filter(p => p.isAI);
    }

    /**
     * 随机选择AI难度
     * @returns {string} 难度等级
     */
    getRandomDifficulty() {
        const difficulties = ['easy', 'medium', 'hard', 'expert'];
        const weights = [0.3, 0.4, 0.25, 0.05];

        const random = Math.random();
        let cumulative = 0;

        for (let i = 0; i < difficulties.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                return difficulties[i];
            }
        }

        return 'medium';
    }

    /**
     * 开始游戏
     * @param {Object} settings - 游戏设置
     */
    startGame(settings = {}) {
        this.init(settings);
        this.gameStarted = true;
        this.gameRunning = true;
        this.gameStats.startTime = Date.now();
    }

    /**
     * 更新游戏状态
     * @param {number} deltaTime - 时间增量（毫秒）
     */
    update(deltaTime) {
        if (!this.gameStarted || this.gameEnded) return;

        const startTime = performance.now();

        // 更新所有玩家
        this.players.forEach(player => {
            if (!player.isAlive) return;

            // 记录更新前的lines用于攻击计算
            const prevLines = player.gameEngine.lines;

            if (player.isAI) {
                const playerStartTime = performance.now();
                player.aiController.update(deltaTime);

                if (window.performanceMonitor) {
                    const aiTime = performance.now() - playerStartTime;
                    window.performanceMonitor.recordAITime(aiTime);
                }

                if (!player.aiController.isAlive) {
                    this.eliminatePlayer(player.id);
                }
            } else {
                player.gameEngine.update(deltaTime);

                if (player.gameEngine.gameOver) {
                    this.eliminatePlayer(player.id);
                }
            }

            // 记录本轮清除的行数
            player.lastLinesCleared = player.gameEngine.lines - prevLines;
        });

        // 处理攻击
        this.processAttacks();

        // 更新瞄准系统
        if (window.targetingSystem) {
            window.targetingSystem.update(this.players);
        }

        // 更新游戏模式
        if (window.gameModes) {
            window.gameModes.update(deltaTime, this.players);
        }

        // 更新道具系统
        if (window.powerUpSystem) {
            window.powerUpSystem.update(deltaTime, this.players);
        }

        // 检查游戏结束条件
        this.checkGameEnd();

        // 更新排名
        this.updateRankings();

        if (window.performanceMonitor) {
            const totalTime = performance.now() - startTime;
            window.performanceMonitor.recordBattleSystemTime(totalTime);
        }
    }

    /**
     * 处理攻击系统
     */
    processAttacks() {
        this.players.forEach(attacker => {
            if (!attacker.isAlive) return;

            const gameEngine = attacker.gameEngine;

            // 检查本轮是否有行被清除
            if (attacker.lastLinesCleared > 0) {
                const attackLines = gameEngine.getAttackLines(
                    attacker.lastLinesCleared,
                    gameEngine.lastClearWasTSpin
                );

                if (attackLines > 0) {
                    this.sendAttack(attacker.id, attackLines);
                    this.gameStats.totalAttacks++;
                }
            }
        });
    }

    /**
     * 发送攻击
     * @param {string} attackerId - 攻击者ID
     * @param {number} attackLines - 攻击行数
     */
    sendAttack(attackerId, attackLines) {
        const attacker = this.getPlayerById(attackerId);
        if (!attacker || !attacker.isAlive) return;

        const targets = this.selectAttackTargets(attackerId, attackLines);

        targets.forEach(target => {
            if (target.isAlive) {
                this.deliverAttack(target.id, attackLines, attackerId);
            }
        });
    }

    /**
     * 选择攻击目标
     * @param {string} attackerId - 攻击者ID
     * @param {number} attackLines - 攻击行数
     * @returns {Array} 目标玩家数组
     */
    selectAttackTargets(attackerId, attackLines) {
        const attacker = this.getPlayerById(attackerId);
        const alivePlayers = this.players.filter(p => p.isAlive && p.id !== attackerId);

        if (alivePlayers.length === 0) return [];

        let targets = [];

        switch (this.attackTargetStrategy) {
            case 'random':
                targets = this.getRandomTargets(alivePlayers, Math.min(4, alivePlayers.length));
                break;

            case 'attacker':
                const attackers = alivePlayers.filter(p => p.targetPlayer === attackerId);
                if (attackers.length > 0) {
                    targets = attackers.slice(0, Math.min(4, attackers.length));
                } else {
                    targets = this.getRandomTargets(alivePlayers, Math.min(4, alivePlayers.length));
                }
                break;

            case 'ko':
                const vulnerableTargets = alivePlayers
                    .filter(p => this.getPlayerHeight(p) > 15)
                    .sort((a, b) => this.getPlayerHeight(b) - this.getPlayerHeight(a));
                targets = vulnerableTargets.slice(0, Math.min(4, vulnerableTargets.length));
                if (targets.length === 0) {
                    targets = this.getRandomTargets(alivePlayers, Math.min(4, alivePlayers.length));
                }
                break;

            case 'badge':
                const badgeTargets = alivePlayers
                    .sort((a, b) => b.badges - a.badges);
                targets = badgeTargets.slice(0, Math.min(4, badgeTargets.length));
                break;

            default:
                targets = this.getRandomTargets(alivePlayers, Math.min(4, alivePlayers.length));
        }

        return targets;
    }

    /**
     * 获取随机目标
     * @param {Array} players - 可选玩家列表
     * @param {number} count - 目标数量
     * @returns {Array} 随机选择的目标
     */
    getRandomTargets(players, count) {
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    /**
     * 获取玩家高度
     * @param {Object} player - 玩家对象
     * @returns {number} 玩家游戏板高度
     */
    getPlayerHeight(player) {
        const board = player.gameEngine.board;
        for (let y = 0; y < board.length; y++) {
            if (board[y].some(cell => cell !== null)) {
                return board.length - y;
            }
        }
        return 0;
    }

    /**
     * 传递攻击
     * @param {string} targetId - 目标玩家ID
     * @param {number} attackLines - 攻击行数
     * @param {string} attackerId - 攻击者ID
     */
    deliverAttack(targetId, attackLines, attackerId) {
        const target = this.getPlayerById(targetId);
        if (!target || !target.isAlive) return;

        target.attackQueue.push({
            lines: attackLines,
            from: attackerId,
            timestamp: Date.now()
        });

        target.gameEngine.receiveAttack(attackLines);

        if (target.gameEngine.gameOver || !target.gameEngine.currentPiece) {
            this.eliminatePlayer(targetId, attackerId);
        }
    }

    /**
     * 淘汰玩家
     * @param {string} playerId - 被淘汰的玩家ID
     * @param {string} killerId - 淘汰者ID（可选）
     */
    eliminatePlayer(playerId, killerId = null) {
        const player = this.getPlayerById(playerId);
        if (!player || !player.isAlive) return;

        player.isAlive = false;
        player.rank = this.currentRank;
        this.currentRank--;

        if (killerId !== null) {
            const killer = this.getPlayerById(killerId);
            if (killer && killer.isAlive) {
                killer.koCount++;
                killer.badges += player.badges + 1;
                this.gameStats.totalKOs++;
            }
        }

        this.updateAttackTargets();

        this.eliminationQueue.push({
            playerId: playerId,
            killerId: killerId,
            timestamp: Date.now(),
            rank: player.rank
        });
    }

    /**
     * 更新攻击目标
     */
    updateAttackTargets() {
        const alivePlayers = this.players.filter(p => p.isAlive);

        alivePlayers.forEach(player => {
            if (player.isAI) {
                player.targetPlayer = player.aiController.selectTarget(
                    alivePlayers,
                    this.attackTargetStrategy
                );
            }
        });
    }

    /**
     * 更新排名
     */
    updateRankings() {
        const alivePlayers = this.players.filter(p => p.isAlive);

        alivePlayers.sort((a, b) => {
            if (b.koCount !== a.koCount) {
                return b.koCount - a.koCount;
            }
            return b.gameEngine.score - a.gameEngine.score;
        });

        alivePlayers.forEach((player, index) => {
            player.rank = index + 1;
        });
    }

    /**
     * 检查游戏结束
     */
    checkGameEnd() {
        const alivePlayers = this.players.filter(p => p.isAlive);

        if (alivePlayers.length <= 1) {
            this.endGame(alivePlayers[0] || null);
        }
    }

    /**
     * 结束游戏
     * @param {Object} winner - 获胜者
     */
    endGame(winner) {
        this.gameEnded = true;
        this.gameStats.endTime = Date.now();
        this.gameStats.winner = winner;

        if (winner) {
            winner.rank = 1;
        }
    }

    /**
     * 设置攻击目标策略
     * @param {string} strategy - 攻击策略
     */
    setAttackStrategy(strategy) {
        this.attackTargetStrategy = strategy;
        this.updateAttackTargets();
    }

    /**
     * 获取人类玩家状态
     * @returns {Object} 人类玩家状态
     */
    getHumanPlayerStatus() {
        return {
            rank: this.humanPlayer.rank,
            score: this.humanPlayer.gameEngine.score,
            level: this.humanPlayer.gameEngine.level,
            lines: this.humanPlayer.gameEngine.lines,
            koCount: this.humanPlayer.koCount,
            badges: this.humanPlayer.badges,
            combo: this.humanPlayer.gameEngine.combo,
            isAlive: this.humanPlayer.isAlive
        };
    }

    /**
     * 获取对手状态列表
     * @returns {Array} 对手状态数组
     */
    getOpponentsStatus() {
        return this.aiPlayers.map(player => ({
            id: player.id,
            rank: player.rank,
            isAlive: player.isAlive,
            koCount: player.koCount,
            badges: player.badges,
            difficulty: player.difficulty,
            height: this.getPlayerHeight(player),
            targeting: player.targetPlayer === this.humanPlayer.id,
            targeted: this.humanPlayer.targetPlayer === player.id
        }));
    }

    /**
     * 获取游戏统计
     * @returns {Object} 游戏统计信息
     */
    getGameStats() {
        const duration = this.gameStats.endTime ?
            this.gameStats.endTime - this.gameStats.startTime :
            Date.now() - this.gameStats.startTime;

        return {
            ...this.gameStats,
            duration: duration,
            playersRemaining: this.players.filter(p => p.isAlive).length,
            humanPlayerRank: this.humanPlayer.rank,
            humanPlayerAlive: this.humanPlayer.isAlive
        };
    }

    /**
     * 重置对战系统
     */
    reset() {
        this.gameStarted = false;
        this.gameEnded = false;
        this.currentRank = 99;
        this.eliminationQueue = [];
        this.attackTargetStrategy = 'random';

        this.gameStats = {
            startTime: null,
            endTime: null,
            totalKOs: 0,
            totalAttacks: 0,
            winner: null
        };

        this.players.forEach(player => {
            player.isAlive = true;
            player.rank = 99;
            player.koCount = 0;
            player.targetPlayer = null;
            player.attackQueue = [];
            player.badges = 0;
            player.lastLinesCleared = 0;

            if (player.isAI) {
                player.aiController.reset();
            } else {
                player.gameEngine.reset();
            }
        });
    }

    /**
     * 获取淘汰事件
     * @returns {Array} 淘汰事件数组
     */
    getEliminationEvents() {
        const events = [...this.eliminationQueue];
        this.eliminationQueue = [];
        return events;
    }
}
