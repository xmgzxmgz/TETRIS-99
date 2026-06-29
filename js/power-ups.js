/**
 * 道具系统
 * 实现TETRIS®99的各种道具效果
 */
class PowerUpSystem {
    constructor() {
        this.powerUps = {
            // 攻击类道具
            multiAttack: {
                name: '多重攻击',
                description: '下次攻击影响多个目标',
                duration: 0,
                type: 'instant',
                icon: '⚡',
                rarity: 'common'
            },
            
            pierceAttack: {
                name: '穿透攻击',
                description: '攻击无视防御',
                duration: 10000,
                type: 'timed',
                icon: '🗡️',
                rarity: 'rare'
            },
            
            powerBoost: {
                name: '攻击强化',
                description: '攻击伤害翻倍',
                duration: 15000,
                type: 'timed',
                icon: '💪',
                rarity: 'epic'
            },
            
            // 防御类道具
            shield: {
                name: '护盾',
                description: '免疫下次攻击',
                duration: 0,
                type: 'shield',
                icon: '🛡️',
                rarity: 'common'
            },
            
            reflect: {
                name: '反射',
                description: '反弹攻击给攻击者',
                duration: 8000,
                type: 'timed',
                icon: '🔄',
                rarity: 'rare'
            },
            
            immunity: {
                name: '免疫',
                description: '短时间内免疫所有攻击',
                duration: 5000,
                type: 'timed',
                icon: '✨',
                rarity: 'legendary'
            },
            
            // 辅助类道具
            speedBoost: {
                name: '速度提升',
                description: '方块下落速度减慢',
                duration: 20000,
                type: 'timed',
                icon: '🏃',
                rarity: 'common'
            },
            
            clearLines: {
                name: '清行',
                description: '立即清除底部2行',
                duration: 0,
                type: 'instant',
                icon: '🧹',
                rarity: 'rare'
            },
            
            preview: {
                name: '预览增强',
                description: '显示更多下个方块',
                duration: 30000,
                type: 'timed',
                icon: '👁️',
                rarity: 'common'
            },
            
            // 特殊道具
            timeFreeze: {
                name: '时间冻结',
                description: '暂停所有其他玩家',
                duration: 3000,
                type: 'global',
                icon: '❄️',
                rarity: 'legendary'
            },
            
            chaos: {
                name: '混乱',
                description: '随机交换所有玩家的方块',
                duration: 0,
                type: 'global',
                icon: '🌪️',
                rarity: 'epic'
            }
        };
        
        this.activePowerUps = new Map(); // playerId -> [powerUps]
        this.powerUpQueue = [];
        this.spawnTimer = 0;
        this.spawnInterval = 30000; // 30秒生成一个道具
        
        this.rarityWeights = {
            common: 50,
            rare: 25,
            epic: 15,
            legendary: 10
        };
    }

    /**
     * 更新道具系统
     * @param {number} deltaTime - 时间增量
     * @param {Array} players - 玩家列表
     */
    update(deltaTime, players) {
        // 更新道具生成计时器
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnRandomPowerUp(players);
            this.spawnTimer = 0;
        }
        
        // 更新活跃道具
        this.updateActivePowerUps(deltaTime);
        
        // 处理道具队列
        this.processPowerUpQueue();
    }

    /**
     * 生成随机道具
     * @param {Array} players - 玩家列表
     */
    spawnRandomPowerUp(players) {
        const alivePlayers = players.filter(p => !p.gameOver);
        if (alivePlayers.length === 0) return;
        
        // 随机选择玩家
        const randomPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        
        // 根据稀有度权重选择道具
        const powerUpId = this.selectRandomPowerUp();
        
        this.grantPowerUp(randomPlayer.id, powerUpId);
    }

    /**
     * 根据稀有度权重选择道具
     */
    selectRandomPowerUp() {
        const powerUpIds = Object.keys(this.powerUps);
        const weightedList = [];
        
        powerUpIds.forEach(id => {
            const powerUp = this.powerUps[id];
            const weight = this.rarityWeights[powerUp.rarity] || 1;
            
            for (let i = 0; i < weight; i++) {
                weightedList.push(id);
            }
        });
        
        return weightedList[Math.floor(Math.random() * weightedList.length)];
    }

    /**
     * 给玩家授予道具
     * @param {string} playerId - 玩家ID
     * @param {string} powerUpId - 道具ID
     */
    grantPowerUp(playerId, powerUpId) {
        const powerUp = this.powerUps[powerUpId];
        if (!powerUp) return;
        
        const activePowerUp = {
            id: powerUpId,
            ...powerUp,
            remainingTime: powerUp.duration,
            grantedAt: Date.now()
        };
        
        if (!this.activePowerUps.has(playerId)) {
            this.activePowerUps.set(playerId, []);
        }
        
        this.activePowerUps.get(playerId).push(activePowerUp);
        
        // 立即执行即时道具
        if (powerUp.type === 'instant') {
            this.executePowerUp(playerId, activePowerUp);
        }
    }

    /**
     * 执行道具效果
     * @param {string} playerId - 玩家ID
     * @param {Object} powerUp - 道具对象
     */
    executePowerUp(playerId, powerUp) {
        switch (powerUp.id) {
            case 'multiAttack':
                this.executeMultiAttack(playerId);
                break;
                
            case 'clearLines':
                this.executeClearLines(playerId);
                break;
                
            case 'timeFreeze':
                this.executeTimeFreeze(playerId);
                break;
                
            case 'chaos':
                this.executeChaos();
                break;
        }
    }

    /**
     * 执行多重攻击
     * @param {string} playerId - 玩家ID
     */
    executeMultiAttack(playerId) {
        // 标记玩家下次攻击为多重攻击
        const player = this.getPlayerById(playerId);
        if (player) {
            player.nextAttackMultiple = true;
        }
    }

    /**
     * 执行清行道具
     * @param {string} playerId - 玩家ID
     */
    executeClearLines(playerId) {
        const player = this.getPlayerById(playerId);
        if (player && player.gameEngine) {
            // 清除底部2行
            const grid = player.gameEngine.grid;
            for (let i = 0; i < 2; i++) {
                if (grid.length > 0) {
                    grid.pop();
                    // 在顶部添加空行
                    grid.unshift(new Array(10).fill(0));
                }
            }
        }
    }

    /**
     * 执行时间冻结
     * @param {string} excludePlayerId - 排除的玩家ID
     */
    executeTimeFreeze(excludePlayerId) {
        // 暂停所有其他玩家
        if (window.battleSystem) {
            window.battleSystem.players.forEach(player => {
                if (player.id !== excludePlayerId && !player.gameOver) {
                    player.frozen = true;
                    setTimeout(() => {
                        player.frozen = false;
                    }, 3000);
                }
            });
        }
    }

    /**
     * 执行混乱道具
     */
    executeChaos() {
        if (window.battleSystem) {
            const alivePlayers = window.battleSystem.players.filter(p => !p.gameOver);
            
            // 收集所有玩家的当前方块
            const currentPieces = alivePlayers.map(p => ({
                playerId: p.id,
                piece: p.gameEngine ? p.gameEngine.currentPiece : null
            })).filter(item => item.piece);
            
            // 随机重新分配
            const shuffledPieces = [...currentPieces];
            for (let i = shuffledPieces.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledPieces[i], shuffledPieces[j]] = [shuffledPieces[j], shuffledPieces[i]];
            }
            
            // 分配给玩家
            alivePlayers.forEach((player, index) => {
                if (player.gameEngine && shuffledPieces[index]) {
                    player.gameEngine.currentPiece = shuffledPieces[index].piece;
                }
            });
        }
    }

    /**
     * 更新活跃道具
     * @param {number} deltaTime - 时间增量
     */
    updateActivePowerUps(deltaTime) {
        for (const [playerId, powerUps] of this.activePowerUps.entries()) {
            for (let i = powerUps.length - 1; i >= 0; i--) {
                const powerUp = powerUps[i];
                
                if (powerUp.type === 'timed') {
                    powerUp.remainingTime -= deltaTime;
                    
                    if (powerUp.remainingTime <= 0) {
                        this.removePowerUpEffect(playerId, powerUp);
                        powerUps.splice(i, 1);
                    }
                } else if (powerUp.type === 'instant') {
                    // 即时道具执行后立即移除
                    powerUps.splice(i, 1);
                }
            }
            
            // 如果玩家没有活跃道具，移除记录
            if (powerUps.length === 0) {
                this.activePowerUps.delete(playerId);
            }
        }
    }

    /**
     * 移除道具效果
     * @param {string} playerId - 玩家ID
     * @param {Object} powerUp - 道具对象
     */
    removePowerUpEffect(playerId, powerUp) {
        const player = this.getPlayerById(playerId);
        if (!player) return;
        
        switch (powerUp.id) {
            case 'speedBoost':
                if (player.gameEngine) {
                    player.gameEngine.dropSpeed /= 0.5; // 恢复原速度
                }
                break;
                
            case 'powerBoost':
                player.attackMultiplier = 1;
                break;
                
            case 'pierceAttack':
                player.pierceAttack = false;
                break;
        }
    }

    /**
     * 检查玩家是否有特定道具
     * @param {string} playerId - 玩家ID
     * @param {string} powerUpId - 道具ID
     */
    hasActivePowerUp(playerId, powerUpId) {
        const playerPowerUps = this.activePowerUps.get(playerId);
        if (!playerPowerUps) return false;
        
        return playerPowerUps.some(p => p.id === powerUpId);
    }

    /**
     * 获取玩家的活跃道具
     * @param {string} playerId - 玩家ID
     */
    getActivePowerUps(playerId) {
        return this.activePowerUps.get(playerId) || [];
    }

    /**
     * 处理道具队列
     */
    processPowerUpQueue() {
        while (this.powerUpQueue.length > 0) {
            const { playerId, powerUpId } = this.powerUpQueue.shift();
            this.grantPowerUp(playerId, powerUpId);
        }
    }

    /**
     * 根据ID获取玩家
     * @param {string} playerId - 玩家ID
     */
    getPlayerById(playerId) {
        if (window.battleSystem) {
            return window.battleSystem.players.find(p => p.id === playerId);
        }
        return null;
    }

    /**
     * 渲染道具UI
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {string} playerId - 玩家ID
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    renderPowerUps(ctx, playerId, x, y) {
        const powerUps = this.getActivePowerUps(playerId);
        if (powerUps.length === 0) return;
        
        ctx.save();
        
        powerUps.forEach((powerUp, index) => {
            const iconX = x + index * 35;
            const iconY = y;
            
            // 绘制道具图标背景
            ctx.fillStyle = this.getRarityColor(powerUp.rarity);
            ctx.fillRect(iconX, iconY, 30, 30);
            
            // 绘制道具图标
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(powerUp.icon, iconX + 15, iconY + 20);
            
            // 绘制剩余时间条
            if (powerUp.type === 'timed') {
                const progress = powerUp.remainingTime / powerUp.duration;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(iconX, iconY + 25, 30, 3);
                ctx.fillStyle = '#fff';
                ctx.fillRect(iconX, iconY + 25, 30 * progress, 3);
            }
        });
        
        ctx.restore();
    }

    /**
     * 获取稀有度颜色
     * @param {string} rarity - 稀有度
     */
    getRarityColor(rarity) {
        const colors = {
            common: '#808080',
            rare: '#0080FF',
            epic: '#8000FF',
            legendary: '#FFD700'
        };
        return colors[rarity] || colors.common;
    }

    /**
     * 重置道具系统
     */
    reset() {
        this.activePowerUps.clear();
        this.powerUpQueue = [];
        this.spawnTimer = 0;
    }
}

// 创建全局实例
window.powerUpSystem = new PowerUpSystem();