/**
 * 统计系统
 * 记录和分析玩家的游戏数据
 */
class StatisticsSystem {
    constructor() {
        this.playerStats = new Map();
        this.globalStats = {
            totalGames: 0,
            totalPlayTime: 0,
            totalLinesCleared: 0,
            totalKOs: 0,
            averageRank: 0,
            bestRank: 99,
            winRate: 0,
            gamesWon: 0
        };
        
        this.sessionStats = {
            startTime: Date.now(),
            gamesPlayed: 0,
            bestRank: 99,
            totalKOs: 0,
            totalLines: 0,
            averageGameTime: 0
        };
        
        this.loadStats();
    }

    /**
     * 初始化玩家统计
     * @param {string} playerId - 玩家ID
     */
    initPlayerStats(playerId) {
        if (!this.playerStats.has(playerId)) {
            this.playerStats.set(playerId, {
                playerId: playerId,
                gamesPlayed: 0,
                gamesWon: 0,
                totalPlayTime: 0,
                totalLinesCleared: 0,
                totalKOs: 0,
                totalAttacksSent: 0,
                totalAttacksReceived: 0,
                bestRank: 99,
                averageRank: 0,
                winRate: 0,
                longestSurvivalTime: 0,
                fastestWin: Infinity,
                maxLinesInGame: 0,
                maxKOsInGame: 0,
                perfectClears: 0,
                tetrises: 0,
                tSpins: 0,
                comboCount: 0,
                maxCombo: 0,
                efficiency: 0, // 攻击效率
                defense: 0,    // 防御能力
                speed: 0,      // 游戏速度
                consistency: 0, // 稳定性
                rankHistory: [],
                recentGames: []
            });
        }
    }

    /**
     * 更新玩家游戏统计
     * @param {string} playerId - 玩家ID
     * @param {Object} gameData - 游戏数据
     */
    updatePlayerStats(playerId, gameData) {
        this.initPlayerStats(playerId);
        const stats = this.playerStats.get(playerId);
        
        // 基础统计
        stats.gamesPlayed++;
        stats.totalPlayTime += gameData.playTime || 0;
        stats.totalLinesCleared += gameData.linesCleared || 0;
        stats.totalKOs += gameData.kos || 0;
        stats.totalAttacksSent += gameData.attacksSent || 0;
        stats.totalAttacksReceived += gameData.attacksReceived || 0;
        
        // 排名统计
        const rank = gameData.rank || 99;
        stats.rankHistory.push(rank);
        if (rank < stats.bestRank) {
            stats.bestRank = rank;
        }
        
        // 胜利统计
        if (rank === 1) {
            stats.gamesWon++;
            if (gameData.playTime < stats.fastestWin) {
                stats.fastestWin = gameData.playTime;
            }
        }
        
        // 生存时间
        if (gameData.playTime > stats.longestSurvivalTime) {
            stats.longestSurvivalTime = gameData.playTime;
        }
        
        // 单局最佳
        if (gameData.linesCleared > stats.maxLinesInGame) {
            stats.maxLinesInGame = gameData.linesCleared;
        }
        
        if (gameData.kos > stats.maxKOsInGame) {
            stats.maxKOsInGame = gameData.kos;
        }
        
        // 特殊技巧统计
        stats.perfectClears += gameData.perfectClears || 0;
        stats.tetrises += gameData.tetrises || 0;
        stats.tSpins += gameData.tSpins || 0;
        
        if (gameData.maxCombo > stats.maxCombo) {
            stats.maxCombo = gameData.maxCombo;
        }
        
        // 计算衍生统计
        this.calculateDerivedStats(stats);
        
        // 保存最近游戏记录
        stats.recentGames.unshift({
            timestamp: Date.now(),
            rank: rank,
            playTime: gameData.playTime,
            linesCleared: gameData.linesCleared,
            kos: gameData.kos,
            attacksSent: gameData.attacksSent,
            attacksReceived: gameData.attacksReceived
        });
        
        // 只保留最近50场游戏
        if (stats.recentGames.length > 50) {
            stats.recentGames = stats.recentGames.slice(0, 50);
        }
        
        this.updateGlobalStats();
        this.saveStats();
    }

    /**
     * 计算衍生统计数据
     * @param {Object} stats - 玩家统计
     */
    calculateDerivedStats(stats) {
        // 胜率
        stats.winRate = stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0;
        
        // 平均排名
        if (stats.rankHistory.length > 0) {
            stats.averageRank = stats.rankHistory.reduce((sum, rank) => sum + rank, 0) / stats.rankHistory.length;
        }
        
        // 攻击效率 (KO数 / 发送攻击数)
        stats.efficiency = stats.totalAttacksSent > 0 ? (stats.totalKOs / stats.totalAttacksSent) * 100 : 0;
        
        // 防御能力 (生存时间 / 接收攻击数)
        stats.defense = stats.totalAttacksReceived > 0 ? stats.totalPlayTime / stats.totalAttacksReceived : 0;
        
        // 游戏速度 (每分钟清行数)
        const totalMinutes = stats.totalPlayTime / 60000;
        stats.speed = totalMinutes > 0 ? stats.totalLinesCleared / totalMinutes : 0;
        
        // 稳定性 (基于排名方差)
        if (stats.rankHistory.length > 1) {
            const variance = this.calculateVariance(stats.rankHistory);
            stats.consistency = Math.max(0, 100 - variance);
        }
    }

    /**
     * 计算方差
     * @param {Array} values - 数值数组
     */
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    }

    /**
     * 更新全局统计
     */
    updateGlobalStats() {
        let totalGames = 0;
        let totalPlayTime = 0;
        let totalLines = 0;
        let totalKOs = 0;
        let totalWins = 0;
        let bestRank = 99;
        
        for (const stats of this.playerStats.values()) {
            totalGames += stats.gamesPlayed;
            totalPlayTime += stats.totalPlayTime;
            totalLines += stats.totalLinesCleared;
            totalKOs += stats.totalKOs;
            totalWins += stats.gamesWon;
            
            if (stats.bestRank < bestRank) {
                bestRank = stats.bestRank;
            }
        }
        
        this.globalStats.totalGames = totalGames;
        this.globalStats.totalPlayTime = totalPlayTime;
        this.globalStats.totalLinesCleared = totalLines;
        this.globalStats.totalKOs = totalKOs;
        this.globalStats.gamesWon = totalWins;
        this.globalStats.bestRank = bestRank;
        this.globalStats.winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
    }

    /**
     * 更新会话统计
     * @param {Object} gameData - 游戏数据
     */
    updateSessionStats(gameData) {
        this.sessionStats.gamesPlayed++;
        this.sessionStats.totalKOs += gameData.kos || 0;
        this.sessionStats.totalLines += gameData.linesCleared || 0;
        
        const rank = gameData.rank || 99;
        if (rank < this.sessionStats.bestRank) {
            this.sessionStats.bestRank = rank;
        }
        
        // 计算平均游戏时间
        const sessionTime = Date.now() - this.sessionStats.startTime;
        this.sessionStats.averageGameTime = this.sessionStats.gamesPlayed > 0 ? 
            sessionTime / this.sessionStats.gamesPlayed : 0;
    }

    /**
     * 获取玩家统计
     * @param {string} playerId - 玩家ID
     */
    getPlayerStats(playerId) {
        return this.playerStats.get(playerId) || null;
    }

    /**
     * 获取全局统计
     */
    getGlobalStats() {
        return { ...this.globalStats };
    }

    /**
     * 获取会话统计
     */
    getSessionStats() {
        return { ...this.sessionStats };
    }

    /**
     * 获取排行榜
     * @param {string} category - 排行类别
     * @param {number} limit - 限制数量
     */
    getLeaderboard(category = 'winRate', limit = 10) {
        const players = Array.from(this.playerStats.values());
        
        players.sort((a, b) => {
            switch (category) {
                case 'winRate':
                    return b.winRate - a.winRate;
                case 'bestRank':
                    return a.bestRank - b.bestRank;
                case 'totalKOs':
                    return b.totalKOs - a.totalKOs;
                case 'totalLines':
                    return b.totalLinesCleared - a.totalLinesCleared;
                case 'efficiency':
                    return b.efficiency - a.efficiency;
                case 'speed':
                    return b.speed - a.speed;
                default:
                    return b.winRate - a.winRate;
            }
        });
        
        return players.slice(0, limit);
    }

    /**
     * 获取玩家成就
     * @param {string} playerId - 玩家ID
     */
    getPlayerAchievements(playerId) {
        const stats = this.getPlayerStats(playerId);
        if (!stats) return [];
        
        const achievements = [];
        
        // 胜利成就
        if (stats.gamesWon >= 1) achievements.push({ name: '首胜', description: '获得第一次胜利' });
        if (stats.gamesWon >= 10) achievements.push({ name: '胜利者', description: '获得10次胜利' });
        if (stats.gamesWon >= 100) achievements.push({ name: '传奇', description: '获得100次胜利' });
        
        // KO成就
        if (stats.totalKOs >= 100) achievements.push({ name: 'KO新手', description: '累计KO 100人' });
        if (stats.totalKOs >= 1000) achievements.push({ name: 'KO专家', description: '累计KO 1000人' });
        if (stats.maxKOsInGame >= 10) achievements.push({ name: '单局屠杀', description: '单局KO 10人以上' });
        
        // 清行成就
        if (stats.totalLinesCleared >= 1000) achievements.push({ name: '清行新手', description: '累计清除1000行' });
        if (stats.totalLinesCleared >= 10000) achievements.push({ name: '清行大师', description: '累计清除10000行' });
        
        // 技巧成就
        if (stats.tetrises >= 100) achievements.push({ name: 'Tetris大师', description: '完成100次Tetris' });
        if (stats.tSpins >= 50) achievements.push({ name: 'T-Spin专家', description: '完成50次T-Spin' });
        if (stats.perfectClears >= 10) achievements.push({ name: '完美主义者', description: '完成10次完美清除' });
        
        // 排名成就
        if (stats.bestRank <= 10) achievements.push({ name: '前十强者', description: '进入前10名' });
        if (stats.bestRank <= 3) achievements.push({ name: '领奖台', description: '进入前3名' });
        if (stats.bestRank === 1) achievements.push({ name: '冠军', description: '获得第一名' });
        
        return achievements;
    }

    /**
     * 生成统计报告
     * @param {string} playerId - 玩家ID
     */
    generateReport(playerId) {
        const stats = this.getPlayerStats(playerId);
        if (!stats) return '未找到玩家统计数据';
        
        const report = `
=== 玩家统计报告 ===
玩家ID: ${playerId}
游戏场次: ${stats.gamesPlayed}
胜利次数: ${stats.gamesWon}
胜率: ${stats.winRate.toFixed(2)}%
最佳排名: ${stats.bestRank}
平均排名: ${stats.averageRank.toFixed(1)}

=== 战斗统计 ===
总KO数: ${stats.totalKOs}
单局最高KO: ${stats.maxKOsInGame}
发送攻击: ${stats.totalAttacksSent}
接收攻击: ${stats.totalAttacksReceived}
攻击效率: ${stats.efficiency.toFixed(2)}%

=== 游戏技巧 ===
总清行数: ${stats.totalLinesCleared}
单局最高清行: ${stats.maxLinesInGame}
Tetris次数: ${stats.tetrises}
T-Spin次数: ${stats.tSpins}
完美清除: ${stats.perfectClears}
最大连击: ${stats.maxCombo}

=== 时间统计 ===
总游戏时间: ${this.formatTime(stats.totalPlayTime)}
最长生存: ${this.formatTime(stats.longestSurvivalTime)}
最快胜利: ${stats.fastestWin !== Infinity ? this.formatTime(stats.fastestWin) : 'N/A'}

=== 能力评估 ===
游戏速度: ${stats.speed.toFixed(2)} 行/分钟
防御能力: ${stats.defense.toFixed(2)}
稳定性: ${stats.consistency.toFixed(2)}%
        `;
        
        return report.trim();
    }

    /**
     * 格式化时间
     * @param {number} milliseconds - 毫秒
     */
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
    }

    /**
     * 保存统计数据
     */
    saveStats() {
        try {
            const data = {
                playerStats: Array.from(this.playerStats.entries()),
                globalStats: this.globalStats,
                lastSaved: Date.now()
            };
            localStorage.setItem('tetris99_stats', JSON.stringify(data));
        } catch (error) {
            console.warn('无法保存统计数据:', error);
        }
    }

    /**
     * 加载统计数据
     */
    loadStats() {
        try {
            const data = localStorage.getItem('tetris99_stats');
            if (data) {
                const parsed = JSON.parse(data);
                this.playerStats = new Map(parsed.playerStats || []);
                this.globalStats = { ...this.globalStats, ...parsed.globalStats };
            }
        } catch (error) {
            console.warn('无法加载统计数据:', error);
        }
    }

    /**
     * 重置统计数据
     */
    resetStats() {
        this.playerStats.clear();
        this.globalStats = {
            totalGames: 0,
            totalPlayTime: 0,
            totalLinesCleared: 0,
            totalKOs: 0,
            averageRank: 0,
            bestRank: 99,
            winRate: 0,
            gamesWon: 0
        };
        this.saveStats();
    }

    /**
     * 导出统计数据
     */
    exportStats() {
        const data = {
            playerStats: Array.from(this.playerStats.entries()),
            globalStats: this.globalStats,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tetris99_stats_${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

// 创建全局实例
window.statisticsSystem = new StatisticsSystem();