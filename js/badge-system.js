/**
 * 徽章系统
 * 管理TETRIS 99的徽章机制
 */

class BadgeSystem {
    /**
     * 构造函数
     */
    constructor() {
        // 徽章类型
        this.badgeTypes = {
            ATTACKER: 'attacker',    // 攻击者徽章
            SPEED: 'speed',          // 速度徽章
            DEFENSE: 'defense',      // 防御徽章
            COMBO: 'combo'           // 连击徽章
        };

        // 徽章等级
        this.badgeLevels = {
            BRONZE: 1,
            SILVER: 2,
            GOLD: 3,
            PLATINUM: 4
        };

        // 徽章颜色
        this.badgeColors = {
            1: '#CD7F32', // 铜色
            2: '#C0C0C0', // 银色
            3: '#FFD700', // 金色
            4: '#E5E4E2'  // 铂金色
        };

        // 徽章获取条件
        this.badgeConditions = {
            [this.badgeTypes.ATTACKER]: {
                1: { koCount: 1 },
                2: { koCount: 3 },
                3: { koCount: 6 },
                4: { koCount: 10 }
            },
            [this.badgeTypes.SPEED]: {
                1: { pps: 1.5 },  // pieces per second
                2: { pps: 2.0 },
                3: { pps: 2.5 },
                4: { pps: 3.0 }
            },
            [this.badgeTypes.DEFENSE]: {
                1: { blockedAttacks: 10 },
                2: { blockedAttacks: 25 },
                3: { blockedAttacks: 50 },
                4: { blockedAttacks: 100 }
            },
            [this.badgeTypes.COMBO]: {
                1: { maxCombo: 4 },
                2: { maxCombo: 6 },
                3: { maxCombo: 8 },
                4: { maxCombo: 10 }
            }
        };

        // 徽章奖励
        this.badgeRewards = {
            [this.badgeTypes.ATTACKER]: {
                1: { attackPower: 1.1 },
                2: { attackPower: 1.2 },
                3: { attackPower: 1.3 },
                4: { attackPower: 1.5 }
            },
            [this.badgeTypes.SPEED]: {
                1: { dropSpeed: 1.1 },
                2: { dropSpeed: 1.2 },
                3: { dropSpeed: 1.3 },
                4: { dropSpeed: 1.5 }
            },
            [this.badgeTypes.DEFENSE]: {
                1: { defenseBonus: 0.9 },
                2: { defenseBonus: 0.8 },
                3: { defenseBonus: 0.7 },
                4: { defenseBonus: 0.5 }
            },
            [this.badgeTypes.COMBO]: {
                1: { comboBonus: 1.1 },
                2: { comboBonus: 1.2 },
                3: { comboBonus: 1.3 },
                4: { comboBonus: 1.5 }
            }
        };
    }

    /**
     * 检查并更新玩家徽章
     * @param {Object} player - 玩家对象
     * @returns {Array} 新获得的徽章
     */
    updatePlayerBadges(player) {
        const newBadges = [];
        
        if (!player.badges) {
            player.badges = {};
        }

        if (!player.stats) {
            player.stats = {
                koCount: 0,
                pps: 0,
                blockedAttacks: 0,
                maxCombo: 0,
                totalPieces: 0,
                gameTime: 0
            };
        }

        // 检查每种徽章类型
        Object.keys(this.badgeTypes).forEach(typeKey => {
            const badgeType = this.badgeTypes[typeKey];
            const currentLevel = player.badges[badgeType] || 0;
            const newLevel = this.checkBadgeLevel(player, badgeType);
            
            if (newLevel > currentLevel) {
                player.badges[badgeType] = newLevel;
                newBadges.push({
                    type: badgeType,
                    level: newLevel,
                    color: this.badgeColors[newLevel]
                });
            }
        });

        return newBadges;
    }

    /**
     * 检查特定徽章的等级
     * @param {Object} player - 玩家对象
     * @param {string} badgeType - 徽章类型
     * @returns {number} 徽章等级
     */
    checkBadgeLevel(player, badgeType) {
        const conditions = this.badgeConditions[badgeType];
        let level = 0;

        for (let i = 4; i >= 1; i--) {
            if (this.meetsBadgeCondition(player, badgeType, i)) {
                level = i;
                break;
            }
        }

        return level;
    }

    /**
     * 检查是否满足徽章条件
     * @param {Object} player - 玩家对象
     * @param {string} badgeType - 徽章类型
     * @param {number} level - 徽章等级
     * @returns {boolean} 是否满足条件
     */
    meetsBadgeCondition(player, badgeType, level) {
        const condition = this.badgeConditions[badgeType][level];
        
        switch (badgeType) {
            case this.badgeTypes.ATTACKER:
                return player.stats.koCount >= condition.koCount;
                
            case this.badgeTypes.SPEED:
                const pps = player.stats.gameTime > 0 ? 
                    player.stats.totalPieces / (player.stats.gameTime / 1000) : 0;
                return pps >= condition.pps;
                
            case this.badgeTypes.DEFENSE:
                return player.stats.blockedAttacks >= condition.blockedAttacks;
                
            case this.badgeTypes.COMBO:
                return player.stats.maxCombo >= condition.maxCombo;
                
            default:
                return false;
        }
    }

    /**
     * 获取玩家的徽章奖励
     * @param {Object} player - 玩家对象
     * @returns {Object} 奖励对象
     */
    getPlayerBadgeRewards(player) {
        const rewards = {
            attackPower: 1.0,
            dropSpeed: 1.0,
            defenseBonus: 1.0,
            comboBonus: 1.0
        };

        if (!player.badges) return rewards;

        Object.keys(player.badges).forEach(badgeType => {
            const level = player.badges[badgeType];
            if (level > 0 && this.badgeRewards[badgeType] && this.badgeRewards[badgeType][level]) {
                const reward = this.badgeRewards[badgeType][level];
                Object.keys(reward).forEach(key => {
                    if (rewards[key] !== undefined) {
                        rewards[key] *= reward[key];
                    }
                });
            }
        });

        return rewards;
    }

    /**
     * 获取玩家徽章总数
     * @param {Object} player - 玩家对象
     * @returns {number} 徽章总数
     */
    getPlayerBadgeCount(player) {
        if (!player.badges) return 0;
        
        return Object.values(player.badges).reduce((total, level) => total + level, 0);
    }

    /**
     * 获取玩家最高徽章等级
     * @param {Object} player - 玩家对象
     * @returns {number} 最高徽章等级
     */
    getPlayerHighestBadgeLevel(player) {
        if (!player.badges) return 0;
        
        return Math.max(...Object.values(player.badges), 0);
    }

    /**
     * 渲染徽章
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Object} player - 玩家对象
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} size - 徽章大小
     */
    renderPlayerBadges(ctx, player, x, y, size = 16) {
        if (!player.badges) return;

        let offsetX = 0;
        Object.keys(player.badges).forEach(badgeType => {
            const level = player.badges[badgeType];
            if (level > 0) {
                this.renderBadge(ctx, badgeType, level, x + offsetX, y, size);
                offsetX += size + 2;
            }
        });
    }

    /**
     * 渲染单个徽章
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {string} badgeType - 徽章类型
     * @param {number} level - 徽章等级
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} size - 徽章大小
     */
    renderBadge(ctx, badgeType, level, x, y, size) {
        const color = this.badgeColors[level];
        
        ctx.save();
        
        // 绘制徽章背景
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制徽章边框
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制徽章图标
        ctx.fillStyle = '#000';
        ctx.font = `${size * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon = '';
        switch (badgeType) {
            case this.badgeTypes.ATTACKER:
                icon = '⚔';
                break;
            case this.badgeTypes.SPEED:
                icon = '⚡';
                break;
            case this.badgeTypes.DEFENSE:
                icon = '🛡';
                break;
            case this.badgeTypes.COMBO:
                icon = '🔥';
                break;
        }
        
        ctx.fillText(icon, x + size/2, y + size/2);
        
        ctx.restore();
    }

    /**
     * 更新玩家统计数据
     * @param {Object} player - 玩家对象
     * @param {string} statType - 统计类型
     * @param {number} value - 数值
     */
    updatePlayerStat(player, statType, value) {
        if (!player.stats) {
            player.stats = {
                koCount: 0,
                pps: 0,
                blockedAttacks: 0,
                maxCombo: 0,
                totalPieces: 0,
                gameTime: 0
            };
        }

        switch (statType) {
            case 'ko':
                player.stats.koCount++;
                break;
            case 'piece':
                player.stats.totalPieces++;
                break;
            case 'blockedAttack':
                player.stats.blockedAttacks++;
                break;
            case 'combo':
                player.stats.maxCombo = Math.max(player.stats.maxCombo, value);
                break;
            case 'gameTime':
                player.stats.gameTime = value;
                break;
        }
    }

    /**
     * 渲染所有玩家的徽章
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Array} players - 玩家数组
     */
    render(ctx, players) {
        if (!players || !Array.isArray(players)) return;
        
        // 为每个玩家渲染徽章（这里可以根据需要调整渲染位置）
        players.forEach((player, index) => {
            if (player && player.badges) {
                // 在右侧区域渲染玩家徽章
                const x = ctx.canvas.width - 200;
                const y = 50 + index * 30;
                this.renderPlayerBadges(ctx, player, x, y, 16);
            }
        });
    }

    /**
     * 重置玩家徽章和统计
     * @param {Object} player - 玩家对象
     */
    resetPlayer(player) {
        player.badges = {};
        player.stats = {
            koCount: 0,
            pps: 0,
            blockedAttacks: 0,
            maxCombo: 0,
            totalPieces: 0,
            gameTime: 0
        };
    }
}

// 创建全局徽章系统
window.badgeSystem = new BadgeSystem();