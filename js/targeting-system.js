/**
 * 目标选择系统
 * 管理TETRIS 99的攻击目标选择机制
 */

class TargetingSystem {
    /**
     * 构造函数
     */
    constructor() {
        // 攻击策略
        this.strategies = {
            RANDOM: 'random',           // 随机攻击
            BADGES: 'badges',           // 攻击徽章最多的玩家
            ATTACKERS: 'attackers',     // 攻击正在攻击自己的玩家
            KO: 'ko'                    // 攻击即将被淘汰的玩家
        };

        // 当前策略
        this.currentStrategy = this.strategies.RANDOM;
        
        // 攻击目标缓存
        this.targetCache = new Map();
        this.cacheTimeout = 1000; // 1秒缓存
        
        // 攻击权重配置
        this.weights = {
            badges: 2.0,        // 徽章权重
            attackers: 3.0,     // 攻击者权重
            ko: 5.0,           // KO权重
            distance: 0.5,      // 距离权重
            health: 1.5         // 血量权重
        };
    }

    /**
     * 设置攻击策略
     * @param {string} strategy - 攻击策略
     */
    setStrategy(strategy) {
        if (Object.values(this.strategies).includes(strategy)) {
            this.currentStrategy = strategy;
            this.clearCache();
        }
    }

    /**
     * 获取当前策略
     * @returns {string} 当前攻击策略
     */
    getStrategy() {
        return this.currentStrategy;
    }

    /**
     * 为玩家选择攻击目标
     * @param {Object} player - 攻击者
     * @param {Array} allPlayers - 所有玩家
     * @param {Object} battleSystem - 战斗系统引用
     * @returns {Object|null} 目标玩家
     */
    selectTarget(player, allPlayers, battleSystem) {
        // 检查缓存
        const cacheKey = `${player.id}_${this.currentStrategy}`;
        const cached = this.targetCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            // 验证缓存的目标是否仍然有效
            const target = allPlayers.find(p => p.id === cached.targetId);
            if (target && !target.gameOver) {
                return target;
            }
        }

        // 过滤有效目标
        const validTargets = this.getValidTargets(player, allPlayers);
        if (validTargets.length === 0) return null;

        let target = null;

        switch (this.currentStrategy) {
            case this.strategies.RANDOM:
                target = this.selectRandomTarget(validTargets);
                break;
                
            case this.strategies.BADGES:
                target = this.selectBadgeTarget(validTargets, battleSystem);
                break;
                
            case this.strategies.ATTACKERS:
                target = this.selectAttackerTarget(player, validTargets, battleSystem);
                break;
                
            case this.strategies.KO:
                target = this.selectKOTarget(validTargets);
                break;
                
            default:
                target = this.selectRandomTarget(validTargets);
        }

        // 缓存结果
        if (target) {
            this.targetCache.set(cacheKey, {
                targetId: target.id,
                timestamp: Date.now()
            });
        }

        return target;
    }

    /**
     * 获取有效攻击目标
     * @param {Object} player - 攻击者
     * @param {Array} allPlayers - 所有玩家
     * @returns {Array} 有效目标列表
     */
    getValidTargets(player, allPlayers) {
        return allPlayers.filter(p => 
            p.id !== player.id && 
            !p.gameOver && 
            p.gameEngine && 
            p.gameEngine.isActive
        );
    }

    /**
     * 随机选择目标
     * @param {Array} targets - 目标列表
     * @returns {Object|null} 选中的目标
     */
    selectRandomTarget(targets) {
        if (targets.length === 0) return null;
        return targets[Math.floor(Math.random() * targets.length)];
    }

    /**
     * 选择徽章最多的目标
     * @param {Array} targets - 目标列表
     * @param {Object} battleSystem - 战斗系统
     * @returns {Object|null} 选中的目标
     */
    selectBadgeTarget(targets, battleSystem) {
        if (targets.length === 0) return null;

        let bestTarget = null;
        let maxBadgeScore = -1;

        targets.forEach(target => {
            const badgeCount = window.badgeSystem ? 
                window.badgeSystem.getPlayerBadgeCount(target) : 0;
            const badgeLevel = window.badgeSystem ? 
                window.badgeSystem.getPlayerHighestBadgeLevel(target) : 0;
            
            const score = badgeCount * 10 + badgeLevel * 5;
            
            if (score > maxBadgeScore) {
                maxBadgeScore = score;
                bestTarget = target;
            }
        });

        return bestTarget || this.selectRandomTarget(targets);
    }

    /**
     * 选择正在攻击自己的目标
     * @param {Object} player - 攻击者
     * @param {Array} targets - 目标列表
     * @param {Object} battleSystem - 战斗系统
     * @returns {Object|null} 选中的目标
     */
    selectAttackerTarget(player, targets, battleSystem) {
        if (targets.length === 0) return null;

        // 找到正在攻击自己的玩家
        const attackers = targets.filter(target => {
            return battleSystem && 
                   battleSystem.attackTargets && 
                   battleSystem.attackTargets.get(target.id) === player.id;
        });

        if (attackers.length > 0) {
            // 在攻击者中选择威胁最大的
            let bestAttacker = null;
            let maxThreat = -1;

            attackers.forEach(attacker => {
                const threat = this.calculateThreat(attacker, player);
                if (threat > maxThreat) {
                    maxThreat = threat;
                    bestAttacker = attacker;
                }
            });

            return bestAttacker;
        }

        // 如果没有攻击者，随机选择
        return this.selectRandomTarget(targets);
    }

    /**
     * 选择即将被KO的目标
     * @param {Array} targets - 目标列表
     * @returns {Object|null} 选中的目标
     */
    selectKOTarget(targets) {
        if (targets.length === 0) return null;

        // 找到血量最低的目标
        let bestTarget = null;
        let minHealth = Infinity;

        targets.forEach(target => {
            const health = this.calculateHealth(target);
            if (health < minHealth && health < 0.3) { // 血量低于30%
                minHealth = health;
                bestTarget = target;
            }
        });

        return bestTarget || this.selectRandomTarget(targets);
    }

    /**
     * 计算玩家威胁度
     * @param {Object} attacker - 攻击者
     * @param {Object} defender - 防御者
     * @returns {number} 威胁度分数
     */
    calculateThreat(attacker, defender) {
        let threat = 0;

        // 基于徽章的威胁
        if (window.badgeSystem) {
            const badgeCount = window.badgeSystem.getPlayerBadgeCount(attacker);
            const badgeLevel = window.badgeSystem.getPlayerHighestBadgeLevel(attacker);
            threat += badgeCount * this.weights.badges + badgeLevel * 2;
        }

        // 基于攻击力的威胁
        if (attacker.gameEngine) {
            const level = attacker.gameEngine.level || 1;
            threat += level * 0.5;
        }

        // 基于连击的威胁
        if (attacker.gameEngine && attacker.gameEngine.combo > 0) {
            threat += attacker.gameEngine.combo * 2;
        }

        return threat;
    }

    /**
     * 计算玩家血量百分比
     * @param {Object} player - 玩家
     * @returns {number} 血量百分比 (0-1)
     */
    calculateHealth(player) {
        if (!player.gameEngine || !player.gameEngine.board) return 1;

        const board = player.gameEngine.board;
        const height = board.length;
        let emptyRows = 0;

        // 从顶部开始计算空行数
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
     * 获取攻击目标的统计信息
     * @param {Object} player - 玩家
     * @param {Array} allPlayers - 所有玩家
     * @param {Object} battleSystem - 战斗系统
     * @returns {Object} 统计信息
     */
    getTargetingStats(player, allPlayers, battleSystem) {
        const validTargets = this.getValidTargets(player, allPlayers);
        const stats = {
            totalTargets: validTargets.length,
            strategyCounts: {},
            currentTarget: null
        };

        // 统计各策略的目标数量
        Object.values(this.strategies).forEach(strategy => {
            const oldStrategy = this.currentStrategy;
            this.currentStrategy = strategy;
            const target = this.selectTarget(player, allPlayers, battleSystem);
            stats.strategyCounts[strategy] = target ? 1 : 0;
            this.currentStrategy = oldStrategy;
        });

        // 获取当前目标
        stats.currentTarget = this.selectTarget(player, allPlayers, battleSystem);

        return stats;
    }

    /**
     * 清除目标缓存
     */
    clearCache() {
        this.targetCache.clear();
    }

    /**
     * 清理过期缓存
     */
    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.targetCache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.targetCache.delete(key);
            }
        }
    }

    /**
     * 获取策略显示名称
     * @param {string} strategy - 策略代码
     * @returns {string} 显示名称
     */
    getStrategyDisplayName(strategy) {
        const names = {
            [this.strategies.RANDOM]: '随机攻击',
            [this.strategies.BADGES]: '徽章攻击',
            [this.strategies.ATTACKERS]: '反击攻击',
            [this.strategies.KO]: 'KO攻击'
        };
        return names[strategy] || strategy;
    }

    /**
     * 获取所有可用策略
     * @returns {Array} 策略列表
     */
    getAvailableStrategies() {
        return Object.values(this.strategies).map(strategy => ({
            code: strategy,
            name: this.getStrategyDisplayName(strategy)
        }));
    }

    /**
     * 更新攻击权重
     * @param {Object} newWeights - 新的权重配置
     */
    updateWeights(newWeights) {
        this.weights = { ...this.weights, ...newWeights };
        this.clearCache();
    }

    /**
     * 重置为默认配置
     */
    reset() {
        this.currentStrategy = this.strategies.RANDOM;
        this.clearCache();
        this.weights = {
            badges: 2.0,
            attackers: 3.0,
            ko: 5.0,
            distance: 0.5,
            health: 1.5
        };
    }
}

// 创建全局目标选择系统
window.targetingSystem = new TargetingSystem();