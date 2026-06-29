<div align="center">

# 🎮 TETRIS-99

**网页版俄罗斯方块 99 — 支持 AI 对战、道具系统、多种游戏模式**

[![HTML5](https://img.shields.io/badge/HTML5-Game-red?style=flat-square&logo=html5)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Styled-blue?style=flat-square&logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Play](https://img.shields.io/badge/🎮_Play_Now-Click_Here-brightgreen?style=flat-square)](https://xmgzxmgz.github.io/TETRIS-99/)

一个功能完整的网页版俄罗斯方块 99 克隆，纯前端实现，零依赖。

[功能特性](#功能特性) · [在线试玩](#在线试玩) · [游戏模式](#游戏模式) · [操作说明](#操作说明) · [项目结构](#项目结构) · [本地运行](#本地运行)

</div>

---

## ✨ 功能特性

### 🎯 核心玩法
- 经典俄罗斯方块 99 玩法
- 99 人同场竞技（AI 模拟）
- 攻击/防御机制
- 实时排行榜

### 🤖 AI 系统
- 智能 AI 对手（`ai-player.js`）
- 多难度等级
- 自动决策和策略

### 💥 战斗系统
- 攻击目标选择（`targeting-system.js`）
- 徽章系统（`badge-system.js`）
- 道具系统（`power-ups.js`）
- 战斗伤害计算（`battle-system.js`）

### 🎮 游戏模式
- 经典模式
- 计时挑战
- AI 对战
- 观众模式（`spectator-system.js`）

### 🎵 音效 & 视觉
- 音效管理（`audio-manager.js`）
- 流畅动画
- 性能监控（`performance-monitor.js`）
- 游戏统计（`statistics.js`）

---

## 🎮 在线试玩

**[👉 点击这里开始游戏](https://xmgzxmgz.github.io/TETRIS-99/)**

或本地运行：

```bash
git clone https://github.com/xmgzxmgz/TETRIS-99.git
cd TETRIS-99
open index.html
```

---

## 🕹️ 操作说明

| 按键 | 功能 |
|------|------|
| `←` `→` | 左右移动 |
| `↑` | 旋转 |
| `↓` | 加速下落 |
| `Space` | 直接落底 |
| `Z` | 左旋转 |
| `X` | 右旋转 |
| `C` | 暂存 |
| `P` | 暂停 |

---

## 🎯 游戏模式

### 经典模式
标准俄罗斯方块 99 玩法，99 人淘汰赛。

### 计时挑战
在限定时间内尽可能消除更多行。

### AI 对战
与 AI 对手 1v1 对战，可选难度。

### 观众模式
观看 AI 之间的自动对战。

---

## 📁 项目结构

```
TETRIS-99/
├── index.html              # 游戏主页面
├── styles.css              # 样式文件
└── js/
    ├── main.js             # 应用入口
    ├── game-engine.js      # 核心游戏引擎
    ├── tetris-pieces.js    # 方块定义和旋转
    ├── ai-player.js        # AI 对手逻辑
    ├── battle-system.js    # 战斗/攻击系统
    ├── targeting-system.js # 目标选择系统
    ├── badge-system.js     # 徽章/奖励系统
    ├── power-ups.js        # 道具系统
    ├── game-modes.js       # 游戏模式管理
    ├── spectator-system.js # 观众模式
    ├── ui.js               # UI 渲染
    ├── audio-manager.js    # 音效管理
    ├── statistics.js       # 游戏统计
    └── performance-monitor.js # 性能监控
```

---

## 🏗️ 技术实现

- **纯前端**：HTML5 + CSS3 + JavaScript，零外部依赖
- **Canvas 渲染**：使用 HTML5 Canvas 绘制游戏画面
- **AI 算法**：基于启发式评估的 AI 决策系统
- **游戏循环**：requestAnimationFrame 驱动的 60fps 游戏循环
- **模块化架构**：每个功能独立模块，职责清晰

---

## 📊 游戏统计

游戏会记录并显示：
- 🏆 最高分
- 📈 消除行数
- ⏱️ 游戏时长
- 🎯 攻击次数
- 🛡️ 防御次数

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 👨‍💻 作者

**xmgz**
- 📧 Email: [xmgzdm@gmail.com](mailto:xmgzdm@gmail.com)
- 🐙 GitHub: [@xmgzxmgz](https://github.com/xmgzxmgz)

---

<div align="center">

**🎮 [立即开玩](https://xmgzxmgz.github.io/TETRIS-99/) · ⭐ 觉得好玩请给 Star！**

</div>
