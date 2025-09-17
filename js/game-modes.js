/**
 * 游戏模式系统
 * 实现TETRIS®99的各种游戏模式
 */
class GameModes {
    constructor() {
        this.currentMode = 'classic';
        this.modes = {
            classic: {
                name: '经典模式',
                description: '标准的99人对战',
                maxPlayers: 99,
                timeLimit: null,
                specialRules: []
            },
            invictus: {
                name: '无敌模式',
                description: '更快的游戏节奏，更强的AI',
                maxPlayers: 99,
                timeLimit: null,
                specialRules: ['faster_speed', 'stronger_ai']
            },
            team: {
                name: '团队模式',
                description: '4队对战，每队最多24人',
                maxPlayers: 96,
                timeLimit: null,
                specialRules: ['team_play', 'shared_ko']
            },
            cpu: {
                name: 'CPU对战',
                description: '与98个AI对战',
                maxPlayers: 99,
                timeLimit: null,
                specialRules: ['all_ai_opponents']
            },
            marathon: {
                name: '马拉松模式',
                description: '单人无限模式',
                maxPlayers: 1,
                timeLimit: null,
                specialRules: ['single_player', 'infinite_lines']
            }
        };
        
        this.teamColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
        this.teams = [];
    }

    /**
     * 设置游戏模式
     * @param {string} mode - 模式名称
     */
    setMode(mode) {
        if (this.modes[mode]) {
            this.currentMode = mode;
            console.log(`切换到游戏模式: ${this.modes[mode].name}`);
            return true;
        }
        return false;
    }

    /**
     * 获取当前模式信息
     */
    getCurrentMode() {
        return this.modes[this.currentMode];
    }

    /**
     * 初始化团队模式
     */
    initTeamMode() {
        this.teams = [
            { id: 0, name: '红队', color: this.teamColors[0], players: [] },
            { id: 1, name: '蓝队', color: this.teamColors[1], players: [] },
            { id: 2, name: '绿队', color: this.teamColors[2], players: [] },
            { id: 3, name: '黄队', color: this.teamColors[3], players: [] }
        ];
    }

    /**
     * 分配玩家到团队
     * @param {Array} players - 玩家列表
     */
    assignPlayersToTeams(players) {
        if (this.currentMode !== 'team') return;

        this.initTeamMode();
        
        // 随机分配玩家到团队
        players.forEach((player, index) => {
            const teamIndex = index % 4;
            this.teams[teamIndex].players.push(player);
            player.teamId = teamIndex;
            player.teamColor = this.teamColors[teamIndex];
        });
    }

    /**
     * 获取团队信息
     */
    getTeamInfo() {
        return this.teams.map(team => ({
            ...team,
            aliveCount: team.players.filter(p => !p.gameOver).length,
            totalKOs: team.players.reduce((sum, p) => sum + (p.stats?.kos || 0), 0)
        }));
    }

    /**
     * 检查团队胜利条件
     */
    checkTeamVictory() {
        if (this.currentMode !== 'team') return null;

        const aliveTeams = this.teams.filter(team => 
            team.players.some(p => !p.gameOver)
        );

        if (aliveTeams.length === 1) {
            return aliveTeams[0];
        }

        return null;
    }

    /**
     * 应用模式特殊规则
     * @param {Object} gameSettings - 游戏设置
     */
    applyModeRules(gameSettings) {
        const mode = this.getCurrentMode();
        
        mode.specialRules.forEach(rule => {
            switch (rule) {
                case 'faster_speed':
                    gameSettings.dropSpeed *= 1.5;
                    gameSettings.levelUpSpeed *= 1.3;
                    break;
                    
                case 'stronger_ai':
                    gameSettings.aiDifficulty = Math.min(gameSettings.aiDifficulty + 2, 10);
                    break;
                    
                case 'team_play':
                    gameSettings.teamMode = true;
                    gameSettings.friendlyFire = false;
                    break;
                    
                case 'shared_ko':
                    gameSettings.sharedKO = true;
                    break;
                    
                case 'all_ai_opponents':
                    gameSettings.humanPlayers = 1;
                    gameSettings.aiPlayers = 98;
                    break;
                    
                case 'single_player':
                    gameSettings.humanPlayers = 1;
                    gameSettings.aiPlayers = 0;
                    break;
                    
                case 'infinite_lines':
                    gameSettings.infiniteMode = true;
                    break;
            }
        });
        
        return gameSettings;
    }

    /**
     * 获取模式特定的UI配置
     */
    getModeUIConfig() {
        const mode = this.getCurrentMode();
        
        return {
            showTeamInfo: this.currentMode === 'team',
            showPlayerCount: this.currentMode !== 'marathon',
            showTimer: mode.timeLimit !== null,
            showRanking: this.currentMode !== 'marathon',
            teamColors: this.currentMode === 'team' ? this.teamColors : null
        };
    }

    /**
     * 渲染模式特定的UI元素
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    renderModeUI(ctx) {
        if (this.currentMode === 'team') {
            this.renderTeamInfo(ctx);
        }
    }

    /**
     * 渲染团队信息
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    renderTeamInfo(ctx) {
        const teamInfo = this.getTeamInfo();
        const x = 10;
        let y = 150;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 5, y - 20, 150, teamInfo.length * 25 + 30);
        
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.fillText('团队状态', x, y);
        y += 20;
        
        ctx.font = '12px Arial';
        teamInfo.forEach(team => {
            ctx.fillStyle = team.color;
            ctx.fillText(`${team.name}: ${team.aliveCount}人`, x, y);
            y += 20;
        });
    }

    /**
     * 获取所有可用模式
     */
    getAllModes() {
        return Object.keys(this.modes).map(key => ({
            id: key,
            ...this.modes[key]
        }));
    }

    /**
     * 重置模式状态
     */
    reset() {
        this.teams = [];
    }
}

// 创建全局实例
window.gameModes = new GameModes();