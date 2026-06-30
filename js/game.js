/* ============================================
   TETRIS 99 — Self-contained game engine
   iOS 27 style · All logic in one file
   ============================================ */

'use strict';

/* ── Piece definitions ──────────────────── */
const COLORS = {
    I: '#00e5ff', O: '#ffd600', T: '#d500f9',
    S: '#00e676', Z: '#ff1744', J: '#2979ff', L: '#ff9100'
};

const SHAPES = {
    I: [
        [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
        [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
        [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
    ],
    O: [
        [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]]
    ],
    T: [
        [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]],
        [[0,0,0,0],[0,1,0,0],[0,1,1,0],[0,1,0,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,1,0],[0,1,0,0]],
        [[0,0,0,0],[0,1,0,0],[1,1,0,0],[0,1,0,0]]
    ],
    S: [
        [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
        [[0,0,0,0],[0,1,0,0],[0,1,1,0],[0,0,1,0]],
        [[0,0,0,0],[0,0,0,0],[0,1,1,0],[1,1,0,0]],
        [[0,0,0,0],[1,0,0,0],[1,1,0,0],[0,1,0,0]]
    ],
    Z: [
        [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
        [[0,0,0,0],[0,0,1,0],[0,1,1,0],[0,1,0,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,0,0],[0,1,1,0]],
        [[0,0,0,0],[0,1,0,0],[1,1,0,0],[1,0,0,0]]
    ],
    J: [
        [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]],
        [[0,0,0,0],[0,1,1,0],[0,1,0,0],[0,1,0,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,1,0],[0,0,1,0]],
        [[0,0,0,0],[0,1,0,0],[0,1,0,0],[1,1,0,0]]
    ],
    L: [
        [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]],
        [[0,0,0,0],[0,1,0,0],[0,1,0,0],[0,1,1,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,1,0],[1,0,0,0]],
        [[0,0,0,0],[1,1,0,0],[0,1,0,0],[0,1,0,0]]
    ]
};

const KICKS = {
    JLSTZ: {
        '01': [[-1,0],[-1,1],[0,-2],[-1,-2]],
        '10': [[1,0],[1,-1],[0,2],[1,2]],
        '12': [[1,0],[1,-1],[0,2],[1,2]],
        '21': [[-1,0],[-1,1],[0,-2],[-1,-2]],
        '23': [[1,0],[1,1],[0,-2],[1,-2]],
        '32': [[-1,0],[-1,-1],[0,2],[-1,2]],
        '30': [[-1,0],[-1,-1],[0,2],[-1,2]],
        '03': [[1,0],[1,1],[0,-2],[1,-2]]
    },
    I: {
        '01': [[-2,0],[1,0],[-2,-1],[1,2]],
        '10': [[2,0],[-1,0],[2,1],[-1,-2]],
        '12': [[-1,0],[2,0],[-1,2],[2,-1]],
        '21': [[1,0],[-2,0],[1,-2],[-2,1]],
        '23': [[2,0],[-1,0],[2,1],[-1,-2]],
        '32': [[-2,0],[1,0],[-2,-1],[1,2]],
        '30': [[1,0],[-2,0],[1,-2],[-2,1]],
        '03': [[-1,0],[2,0],[-1,2],[2,-1]]
    }
};

function getKicks(type, from, to) {
    if (type === 'O') return [[0, 0]];
    const key = '' + from + to;
    const table = type === 'I' ? KICKS.I : KICKS.JLSTZ;
    return [[0, 0], ...(table[key] || [])];
}

/* ── Seven-bag generator ────────────────── */
class Bag {
    constructor() { this._bag = []; }
    next() {
        if (this._bag.length === 0) {
            this._bag = ['I','O','T','S','Z','J','L'];
            for (let i = 6; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this._bag[i], this._bag[j]] = [this._bag[j], this._bag[i]];
            }
        }
        return this._bag.pop();
    }
}

/* ── Tetris Engine (single player) ──────── */
class Engine {
    constructor(w = 10, h = 20) {
        this.W = w;
        this.H = h;
        this.board = [];
        this.bag = new Bag();
        this.cur = null;      // { type, x, y, rot }
        this.next = null;
        this.hold = null;
        this.canHold = true;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        this.gameOver = false;

        this.dropTimer = 0;
        this.lockTimer = 0;
        this.locking = false;
        this.dropMs = 1000;
        this.lockMs = 500;
        this.lastClear = 0;
        this.lastWasTSpin = false;
        this.totalPieces = 0;

        this._init();
    }

    _init() {
        this.board = Array.from({ length: this.H }, () => Array(this.W).fill(0));
        this.next = this._spawn();
        this._nextPiece();
    }

    _spawn() {
        const t = this.bag.next();
        return { type: t, x: 3, y: 0, rot: 0 };
    }

    _nextPiece() {
        this.cur = this.next;
        this.next = this._spawn();
        this.canHold = true;
        this.locking = false;
        this.lockTimer = 0;
        this.totalPieces++;
        if (this._collides(this.cur)) this.gameOver = true;
    }

    _shape(p) { return SHAPES[p.type][p.rot % SHAPES[p.type].length]; }

    _blocks(p) {
        const s = this._shape(p);
        const b = [];
        for (let r = 0; r < 4; r++)
            for (let c = 0; c < 4; c++)
                if (s[r][c]) b.push({ x: p.x + c, y: p.y + r });
        return b;
    }

    _collides(p) {
        for (const b of this._blocks(p)) {
            if (b.x < 0 || b.x >= this.W || b.y >= this.H) return true;
            if (b.y >= 0 && this.board[b.y][b.x]) return true;
        }
        return false;
    }

    move(dx, dy) {
        if (!this.cur || this.gameOver) return false;
        this.cur.x += dx; this.cur.y += dy;
        if (this._collides(this.cur)) {
            this.cur.x -= dx; this.cur.y -= dy;
            return false;
        }
        if (dy === 0) { this.lockTimer = 0; this.locking = false; }
        return true;
    }

    rotate(dir = 1) {
        if (!this.cur || this.gameOver) return false;
        const old = this.cur.rot;
        const len = SHAPES[this.cur.type].length;
        const nw = (old + dir + len) % len;
        const kicks = getKicks(this.cur.type, old, nw);
        this.cur.rot = nw;
        for (const [dx, dy] of kicks) {
            this.cur.x += dx; this.cur.y += dy;
            if (!this._collides(this.cur)) { this.lockTimer = 0; this.locking = false; return true; }
            this.cur.x -= dx; this.cur.y -= dy;
        }
        this.cur.rot = old;
        return false;
    }

    hardDrop() {
        if (!this.cur || this.gameOver) return 0;
        let d = 0;
        while (this.move(0, 1)) d++;
        this._lock();
        return d;
    }

    softDrop() { return this.move(0, 1); }

    holdPiece() {
        if (!this.canHold || !this.cur || this.gameOver) return false;
        const t = this.cur.type;
        if (this.hold) {
            const ht = this.hold;
            this.hold = t;
            this.cur = { type: ht, x: 3, y: 0, rot: 0 };
        } else {
            this.hold = t;
            this._nextPiece();
        }
        this.canHold = false;
        return true;
    }

    ghost() {
        if (!this.cur) return null;
        const g = { ...this.cur };
        while (!this._collides(g)) g.y++;
        g.y--;
        return g;
    }

    _lock() {
        if (!this.cur) return;
        const color = COLORS[this.cur.type];
        for (const b of this._blocks(this.cur)) {
            if (b.y >= 0 && b.y < this.H && b.x >= 0 && b.x < this.W) {
                this.board[b.y][b.x] = color;
            }
        }
        // T-Spin check
        let tSpin = false;
        if (this.cur.type === 'T') {
            const corners = [
                [this.cur.x, this.cur.y], [this.cur.x + 2, this.cur.y],
                [this.cur.x, this.cur.y + 2], [this.cur.x + 2, this.cur.y + 2]
            ];
            let occ = 0;
            for (const [cx, cy] of corners) {
                if (cx < 0 || cx >= this.W || cy < 0 || cy >= this.H || (cy >= 0 && this.board[cy] && this.board[cy][cx])) occ++;
            }
            tSpin = occ >= 3;
        }
        this.lastWasTSpin = tSpin;

        const cleared = this._clearLines();
        this.lastClear = cleared;
        this._score(cleared, tSpin);
        this._nextPiece();
    }

    _clearLines() {
        let full = 0;
        for (let y = this.H - 1; y >= 0; y--) {
            if (this.board[y].every(c => c !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.W).fill(0));
                full++; y++; // re-check same index
            }
        }
        if (full === 0) { this.combo = 0; return 0; }
        this.lines += full;
        this.combo++;
        this._updateLevel();
        return full;
    }

    _score(lines, tSpin) {
        let base = 0;
        if (tSpin) {
            base = [0, 800, 1200, 1600][lines] || 0;
        } else {
            base = [0, 100, 300, 500, 800][lines] || 0;
        }
        if (this.combo > 1) base += 50 * (this.combo - 1);
        if (this.board.every(r => r.every(c => c === 0))) base *= 10; // perfect clear
        this.score += base * this.level;
    }

    _updateLevel() {
        const nl = Math.floor(this.lines / 10) + 1;
        if (nl > this.level) {
            this.level = nl;
            this.dropMs = Math.max(50, 1000 - (this.level - 1) * 50);
        }
    }

    attackLines() {
        let atk = 0;
        const l = this.lastClear;
        if (this.lastWasTSpin) {
            atk = [0, 2, 4, 6][l] || 0;
        } else {
            atk = [0, 0, 1, 2, 4][l] || 0;
        }
        if (this.combo > 1) atk += Math.min(this.combo - 1, 4);
        if (this.board.every(r => r.every(c => c === 0))) atk += 10;
        return atk;
    }

    receiveGarbage(n) {
        if (n <= 0) return;
        for (let i = 0; i < n; i++) this.board.shift();
        for (let i = 0; i < n; i++) {
            const row = Array(this.W).fill('#666');
            row[Math.floor(Math.random() * this.W)] = 0;
            this.board.push(row);
        }
        if (this.cur && this._collides(this.cur)) this.gameOver = true;
    }

    update(dt) {
        if (this.gameOver || !this.cur) return;
        this.dropTimer += dt;
        if (this.dropTimer >= this.dropMs) {
            if (!this.move(0, 1)) {
                if (!this.locking) { this.locking = true; this.lockTimer = 0; }
            }
            this.dropTimer = 0;
        }
        if (this.locking) {
            this.lockTimer += dt;
            if (this.lockTimer >= this.lockMs) this._lock();
        }
    }

    reset() {
        Object.assign(this, {
            score: 0, level: 1, lines: 0, combo: 0, gameOver: false,
            dropTimer: 0, lockTimer: 0, locking: false, dropMs: 1000,
            lastClear: 0, lastWasTSpin: false, totalPieces: 0,
            hold: null, canHold: true
        });
        this.bag = new Bag();
        this._init();
    }
}

/* ── AI Player ──────────────────────────── */
class AI {
    constructor(diff = 'medium') {
        this.diff = diff;
        this.engine = new Engine();
        this.alive = true;
        this.timer = 0;
        this.delay = { easy: 800, medium: 400, hard: 200, expert: 100 }[diff] || 400;
        this.delay += (Math.random() - 0.5) * this.delay * 0.4;
        this.errRate = { easy: 0.15, medium: 0.08, hard: 0.03, expert: 0.01 }[diff] || 0.08;
        this.weights = {
            easy:   { h: -0.5, l: 0.8, ho: -0.3, b: -0.1, a: -0.1 },
            medium: { h: -0.7, l: 1.0, ho: -0.5, b: -0.2, a: -0.2 },
            hard:   { h: -0.9, l: 1.2, ho: -0.7, b: -0.3, a: -0.3 },
            expert: { h: -1.0, l: 1.5, ho: -1.0, b: -0.4, a: -0.4 }
        }[diff] || { h: -0.7, l: 1.0, ho: -0.5, b: -0.2, a: -0.2 };
    }

    update(dt) {
        if (!this.alive || this.engine.gameOver) { this.alive = false; return; }
        this.engine.update(dt);
        this.timer += dt;
        if (this.timer >= this.delay) {
            this._decide();
            this.timer = 0;
            this.delay = { easy: 800, medium: 400, hard: 200, expert: 100 }[this.diff] || 400;
            this.delay += (Math.random() - 0.5) * this.delay * 0.4;
        }
    }

    _decide() {
        if (!this.engine.cur) return;
        if (Math.random() < this.errRate) { this._random(); return; }
        const best = this._bestMove();
        if (best) {
            const cur = this.engine.cur;
            while (cur.rot !== best.rot) this.engine.rotate(1);
            const dx = best.x - cur.x;
            if (dx > 0) for (let i = 0; i < dx; i++) this.engine.move(1, 0);
            if (dx < 0) for (let i = 0; i < -dx; i++) this.engine.move(-1, 0);
            this.engine.hardDrop();
        }
    }

    _bestMove() {
        const p = this.engine.cur;
        if (!p) return null;
        let best = null, bestS = -Infinity;
        const len = SHAPES[p.type].length;
        for (let r = 0; r < len; r++) {
            for (let x = -2; x < this.engine.W + 2; x++) {
                const t = { type: p.type, x, y: 0, rot: r };
                while (!this.engine._collides(t)) t.y++;
                t.y--;
                if (this.engine._collides(t)) continue;
                const s = this._eval(t);
                if (s > bestS) { bestS = s; best = { x: t.x, rot: r }; }
            }
        }
        return best;
    }

    _eval(p) {
        const eng = this.engine;
        const tmp = eng.board.map(r => [...r]);
        for (const b of eng._blocks(p)) {
            if (b.y >= 0 && b.y < eng.H && b.x >= 0 && b.x < eng.W) tmp[b.y][b.x] = 1;
        }
        // clear full rows
        const cleared = tmp.filter(r => !r.every(c => c !== 0));
        while (cleared.length < eng.H) cleared.unshift(Array(eng.W).fill(0));
        const board = cleared;
        const w = this.weights;
        const linesCleared = eng.H - board.length + (eng.H - board.filter(r => r.every(c => c === 0)).length);
        // Actually count cleared lines properly
        let cl = 0;
        for (const row of tmp) if (row.every(c => c !== 0)) cl++;

        let maxH = 0, holes = 0, agg = 0;
        const heights = [];
        for (let x = 0; x < eng.W; x++) {
            let h = 0, found = false;
            for (let y = 0; y < eng.H; y++) {
                if (board[y][x]) { if (!found) { h = eng.H - y; found = true; } }
                else if (found) holes++;
            }
            heights.push(h);
            maxH = Math.max(maxH, h);
            agg += h;
        }
        let bump = 0;
        for (let i = 0; i < heights.length - 1; i++) bump += Math.abs(heights[i] - heights[i + 1]);

        return w.l * cl * cl + w.h * maxH + w.ho * holes + w.b * bump + w.a * agg;
    }

    _random() {
        const acts = ['l','r','rot','drop','hold'];
        const a = acts[Math.floor(Math.random() * acts.length)];
        if (a === 'l') this.engine.move(-1, 0);
        else if (a === 'r') this.engine.move(1, 0);
        else if (a === 'rot') this.engine.rotate(1);
        else if (a === 'drop') this.engine.hardDrop();
        else this.engine.holdPiece();
    }

    reset() {
        this.engine.reset();
        this.alive = true;
        this.timer = 0;
    }
}

/* ── Battle System ──────────────────────── */
class Battle {
    constructor() {
        this.players = [];
        this.human = null;
        this.ais = [];
        this.started = false;
        this.ended = false;
        this.rank = 99;
        this.strategy = 'random';
        this.stats = { ko: 0 };
    }

    init(aiCount = 98) {
        this.players = [];
        this.rank = aiCount + 1;
        this.ended = false;
        this.stats = { ko: 0 };

        // Human
        const h = {
            id: 'human', name: '玩家', isAI: false,
            engine: new Engine(), alive: true, rank: null,
            ko: 0, badges: 0, atkQ: [], lastLines: 0
        };
        this.players.push(h);
        this.human = h;

        // AIs
        this.ais = [];
        const diffs = ['easy', 'medium', 'hard', 'expert'];
        const weights = [0.3, 0.4, 0.25, 0.05];
        for (let i = 0; i < aiCount; i++) {
            let r = Math.random(), cum = 0, diff = 'medium';
            for (let d = 0; d < diffs.length; d++) {
                cum += weights[d];
                if (r <= cum) { diff = diffs[d]; break; }
            }
            const ai = new AI(diff);
            const p = {
                id: 'ai_' + i, name: 'AI ' + (i + 1), isAI: true,
                engine: ai.engine, ai, alive: true, rank: null,
                ko: 0, badges: 0, atkQ: [], lastLines: 0, diff
            };
            this.players.push(p);
            this.ais.push(p);
        }
    }

    start() {
        this.init();
        this.started = true;
    }

    update(dt) {
        if (!this.started || this.ended) return;
        for (const p of this.players) {
            if (!p.alive) continue;
            const prev = p.engine.lines;
            if (p.isAI) {
                p.ai.update(dt);
                if (!p.ai.alive) this._eliminate(p);
            } else {
                p.engine.update(dt);
                if (p.engine.gameOver) this._eliminate(p);
            }
            p.lastLines = p.engine.lines - prev;
        }
        this._processAttacks();
        this._checkEnd();
    }

    _processAttacks() {
        for (const p of this.players) {
            if (!p.alive || p.lastLines <= 0) continue;
            const atk = p.engine.attackLines();
            if (atk <= 0) continue;
            const targets = this._pickTargets(p.id, atk);
            for (const t of targets) {
                if (!t.alive) continue;
                t.atkQ.push({ lines: atk, from: p.id });
                t.engine.receiveGarbage(atk);
                if (t.engine.gameOver) this._eliminate(t, p.id);
            }
        }
    }

    _pickTargets(srcId, atk) {
        const alive = this.players.filter(p => p.alive && p.id !== srcId);
        if (!alive.length) return [];
        const n = Math.min(4, alive.length);
        switch (this.strategy) {
            case 'attacker': {
                const att = alive.filter(p => p.target === srcId);
                if (att.length) return att.slice(0, n);
                return this._randN(alive, n);
            }
            case 'ko': {
                const vuln = alive.filter(p => this._height(p) > 15)
                    .sort((a, b) => this._height(b) - this._height(a));
                return vuln.length ? vuln.slice(0, n) : this._randN(alive, n);
            }
            case 'badge':
                return [...alive].sort((a, b) => b.badges - a.badges).slice(0, n);
            default:
                return this._randN(alive, n);
        }
    }

    _randN(arr, n) {
        const s = [...arr].sort(() => Math.random() - 0.5);
        return s.slice(0, n);
    }

    _height(p) {
        const b = p.engine.board;
        for (let y = 0; y < b.length; y++) if (b[y].some(c => c)) return b.length - y;
        return 0;
    }

    _eliminate(p, killerId = null) {
        if (!p.alive) return;
        p.alive = false;
        p.rank = this.rank--;
        if (killerId) {
            const k = this.players.find(q => q.id === killerId);
            if (k && k.alive) { k.ko++; k.badges += p.badges + 1; this.stats.ko++; }
        }
    }

    _checkEnd() {
        const alive = this.players.filter(p => p.alive);
        if (alive.length <= 1) {
            this.ended = true;
            if (alive[0]) alive[0].rank = 1;
        }
    }

    getOpponents() {
        return this.ais.slice(0, 40).map(p => ({
            id: p.id, rank: p.rank, alive: p.alive,
            height: this._height(p),
            targeting: false, targeted: false
        }));
    }
}

/* ── Renderer ───────────────────────────── */
class Renderer {
    constructor(canvas, nextCanvas, holdCanvas) {
        this.cv = canvas;
        this.ctx = canvas.getContext('2d');
        this.nCv = nextCanvas;
        this.nCtx = nextCanvas.getContext('2d');
        this.hCv = holdCanvas;
        this.hCtx = holdCanvas.getContext('2d');
        this.cell = 28;
        this.ox = 0;
        this.oy = 0;
        this.effects = [];
    }

    resize(engine) {
        const wrapper = this.cv.parentElement;
        const maxW = Math.min(320, wrapper ? wrapper.clientWidth : 320);
        const maxH = Math.min(640, window.innerHeight - 180);
        this.cell = Math.floor(Math.min(maxW / engine.W, maxH / engine.H));
        this.cv.width = engine.W * this.cell;
        this.cv.height = engine.H * this.cell;
        this.ox = 0;
        this.oy = 0;
    }

    render(engine) {
        const ctx = this.ctx;
        const c = this.cell;
        ctx.clearRect(0, 0, this.cv.width, this.cv.height);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= engine.W; x++) {
            ctx.beginPath(); ctx.moveTo(x * c, 0); ctx.lineTo(x * c, engine.H * c); ctx.stroke();
        }
        for (let y = 0; y <= engine.H; y++) {
            ctx.beginPath(); ctx.moveTo(0, y * c); ctx.lineTo(engine.W * c, y * c); ctx.stroke();
        }

        // Board
        for (let y = 0; y < engine.H; y++)
            for (let x = 0; x < engine.W; x++)
                if (engine.board[y][x]) this._cell(ctx, x, y, engine.board[y][x]);

        // Ghost
        if (engine.cur) {
            const g = engine.ghost();
            if (g) for (const b of engine._blocks(g))
                if (b.y >= 0) this._cell(ctx, b.x, b.y, COLORS[g.type], 0.15);
        }

        // Current
        if (engine.cur) {
            const color = COLORS[engine.cur.type];
            for (const b of engine._blocks(engine.cur))
                if (b.y >= 0) this._cell(ctx, b.x, b.y, color);
        }

        // Effects
        this.effects = this.effects.filter(e => {
            const age = Date.now() - e.t;
            if (age > e.d) return false;
            const p = age / e.d;
            ctx.save(); ctx.globalAlpha = 1 - p;
            ctx.fillStyle = '#fff'; ctx.font = 'bold 16px -apple-system'; ctx.textAlign = 'center';
            ctx.fillText('+' + e.v, this.cv.width / 2, 50 - p * 30);
            ctx.restore();
            return true;
        });
    }

    _cell(ctx, x, y, color, alpha = 1) {
        const c = this.cell;
        const px = this.ox + x * c;
        const py = this.oy + y * c;
        ctx.save();
        ctx.globalAlpha = alpha;
        // Main fill
        ctx.fillStyle = color;
        const r = 4;
        ctx.beginPath();
        ctx.moveTo(px + r + 1, py + 1);
        ctx.lineTo(px + c - r - 1, py + 1);
        ctx.quadraticCurveTo(px + c - 1, py + 1, px + c - 1, py + r + 1);
        ctx.lineTo(px + c - 1, py + c - r - 1);
        ctx.quadraticCurveTo(px + c - 1, py + c - 1, px + c - r - 1, py + c - 1);
        ctx.lineTo(px + r + 1, py + c - 1);
        ctx.quadraticCurveTo(px + 1, py + c - 1, px + 1, py + c - r - 1);
        ctx.lineTo(px + 1, py + r + 1);
        ctx.quadraticCurveTo(px + 1, py + 1, px + r + 1, py + 1);
        ctx.closePath();
        ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(px + 2, py + 2, c - 4, 3);
        ctx.restore();
    }

    renderPreview(ctx, canvas, piece) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (!piece) return;
        const shape = SHAPES[piece.type][0];
        const cs = Math.min(canvas.width / 5, canvas.height / 5);
        const ox = (canvas.width - 4 * cs) / 2;
        const oy = (canvas.height - 4 * cs) / 2;
        const color = COLORS[piece.type];
        for (let r = 0; r < 4; r++)
            for (let c2 = 0; c2 < 4; c2++)
                if (shape[r][c2]) {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    const px = ox + c2 * cs, py = oy + r * cs;
                    const rr = 3;
                    ctx.moveTo(px + rr + 1, py + 1);
                    ctx.lineTo(px + cs - rr - 1, py + 1);
                    ctx.quadraticCurveTo(px + cs - 1, py + 1, px + cs - 1, py + rr + 1);
                    ctx.lineTo(px + cs - 1, py + cs - rr - 1);
                    ctx.quadraticCurveTo(px + cs - 1, py + cs - 1, px + cs - rr - 1, py + cs - 1);
                    ctx.lineTo(px + rr + 1, py + cs - 1);
                    ctx.quadraticCurveTo(px + 1, py + cs - 1, px + 1, py + cs - rr - 1);
                    ctx.lineTo(px + 1, py + rr + 1);
                    ctx.quadraticCurveTo(px + 1, py + 1, px + rr + 1, py + 1);
                    ctx.closePath();
                    ctx.fill();
                }
    }

    addDropEffect(dist) {
        this.effects.push({ v: dist * 2, t: Date.now(), d: 600 });
    }
}

/* ── Opponents Renderer ─────────────────── */
class OpponentsView {
    constructor(container) {
        this.el = container;
        this.cards = new Map();
    }

    update(opponents) {
        // Add new
        for (const o of opponents) {
            if (!this.cards.has(o.id)) {
                const card = document.createElement('div');
                card.className = 'opponent-card';
                const rank = document.createElement('div');
                rank.className = 'opponent-card__rank';
                card.appendChild(rank);
                const cvs = document.createElement('canvas');
                cvs.width = 76; cvs.height = 96;
                card.appendChild(cvs);
                this.el.appendChild(card);
                this.cards.set(o.id, { el: card, rank, ctx: cvs.getContext('2d'), cvs });
            }
            const c = this.cards.get(o.id);
            c.el.classList.toggle('eliminated', !o.alive);
            c.rank.textContent = o.rank || '-';
            // Draw mini bar
            const ctx = c.ctx;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, 76, 96);
            const h = Math.min(o.height, 20);
            if (h > 0) {
                const barH = (h / 20) * 96;
                const hue = Math.max(0, 120 - (h / 20) * 120);
                ctx.fillStyle = `hsl(${hue},70%,50%)`;
                ctx.fillRect(4, 96 - barH, 68, barH);
            }
        }
        // Remove old
        for (const [id, c] of this.cards) {
            if (!opponents.find(o => o.id === id)) {
                c.el.remove();
                this.cards.delete(id);
            }
        }
    }
}

/* ── Toast ──────────────────────────────── */
function toast(msg) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.remove('show');
    void el.offsetWidth; // reflow
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2500);
}

/* ── Main Game Controller ───────────────── */
class Game {
    constructor() {
        // DOM
        this.cv = document.getElementById('gameCanvas');
        this.nCv = document.getElementById('nextCanvas');
        this.hCv = document.getElementById('holdCanvas');
        this.overlay = document.getElementById('overlay');
        this.startBtn = document.getElementById('startBtn');
        this.oTitle = document.getElementById('overlayTitle');
        this.oMsg = document.getElementById('overlayMessage');
        this.oStats = document.getElementById('overlayStats');

        // Systems
        this.renderer = new Renderer(this.cv, this.nCv, this.hCv);
        this.battle = new Battle();
        this.oppView = new OpponentsView(document.getElementById('opponentsGrid'));

        // State
        this.running = false;
        this.lastTime = 0;
        this.keys = {};
        this.keyTimers = {};
        this.startTime = 0;

        this._setup();
        this._showStart();
        this._loop(performance.now());
    }

    _setup() {
        // Keyboard
        const kd = e => this._keyDown(e);
        const ku = e => this._keyUp(e);
        document.addEventListener('keydown', kd);
        document.addEventListener('keyup', ku);
        window.addEventListener('keydown', e => {
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
        });

        // Start button
        this.startBtn.addEventListener('click', () => this._start());

        // Target buttons
        document.querySelectorAll('.target-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.battle.strategy = btn.dataset.strategy;
                document.querySelectorAll('.target-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                toast('策略: ' + btn.textContent);
            });
        });

        // Resize
        window.addEventListener('resize', () => {
            if (this.battle.human) this.renderer.resize(this.battle.human.engine);
        });
    }

    _showStart() {
        this.oTitle.textContent = 'TETRIS 99';
        this.oMsg.textContent = '99 人对战 · iOS 27 风格';
        this.oStats.textContent = '';
        this.startBtn.textContent = '开始游戏';
        this.overlay.classList.remove('hidden');
    }

    _start() {
        this.battle.start();
        this.running = true;
        this.startTime = Date.now();
        this.overlay.classList.add('hidden');
        this.renderer.resize(this.battle.human.engine);
    }

    _keyDown(e) {
        if (!this.running) {
            if (e.key === ' ' || e.key === 'Enter') this._start();
            return;
        }
        const eng = this.battle.human.engine;
        switch (e.key) {
            case 'ArrowLeft':
                eng.move(-1, 0); this._setRepeat('ArrowLeft', () => eng.move(-1, 0)); break;
            case 'ArrowRight':
                eng.move(1, 0); this._setRepeat('ArrowRight', () => eng.move(1, 0)); break;
            case 'ArrowDown':
                if (eng.softDrop()) eng.score++;
                this._setRepeat('ArrowDown', () => { if (eng.softDrop()) eng.score++; }); break;
            case 'ArrowUp': case 'x': case 'X':
                eng.rotate(1); break;
            case 'z': case 'Z':
                eng.rotate(-1); break;
            case ' ':
                const d = eng.hardDrop();
                if (d) this.renderer.addDropEffect(d);
                break;
            case 'c': case 'C':
                eng.holdPiece(); break;
            case '1': this._setStrategy('random'); break;
            case '2': this._setStrategy('badge'); break;
            case '3': this._setStrategy('attacker'); break;
            case '4': this._setStrategy('ko'); break;
        }
    }

    _keyUp(e) {
        this.keys[e.key] = false;
        if (this.keyTimers[e.key]) { clearInterval(this.keyTimers[e.key]); delete this.keyTimers[e.key]; }
    }

    _setRepeat(key, fn) {
        if (this.keyTimers[key]) return;
        this.keys[key] = true;
        setTimeout(() => {
            if (this.keys[key]) {
                this.keyTimers[key] = setInterval(() => { if (this.keys[key]) fn(); else { clearInterval(this.keyTimers[key]); delete this.keyTimers[key]; } }, 50);
            }
        }, 170);
    }

    _setStrategy(s) {
        this.battle.strategy = s;
        document.querySelectorAll('.target-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.strategy === s);
        });
        toast('策略: ' + { random: '随机', attacker: '攻击者', ko: 'KO', badge: '徽章' }[s]);
    }

    _loop(now) {
        const dt = now - this.lastTime;
        this.lastTime = now;

        if (this.running && !this.battle.ended) {
            this.battle.update(dt);

            // Update UI
            const h = this.battle.human;
            const rank = h.alive ? (this.battle.players.filter(p => p.alive).indexOf(h) + 1) : h.rank;
            document.getElementById('stat-rank').textContent = rank || this.battle.rank;
            document.getElementById('stat-ko').textContent = h.ko;
            document.getElementById('stat-score').textContent = h.engine.score.toLocaleString();

            // Combo
            const comboEl = document.getElementById('comboDisplay');
            comboEl.textContent = h.engine.combo;
            if (h.engine.combo > 0) { comboEl.classList.add('bump'); setTimeout(() => comboEl.classList.remove('bump'), 150); }

            // Attack queue
            const aq = document.getElementById('attackQueue');
            if (this._lastAtkCount !== h.atkQ.length) {
                this._lastAtkCount = h.atkQ.length;
                aq.innerHTML = '';
                for (let i = 0; i < Math.min(h.atkQ.length, 8); i++) {
                    const bar = document.createElement('div');
                    bar.className = 'attack-bar';
                    aq.appendChild(bar);
                }
            }

            // Opponents
            this.oppView.update(this.battle.getOpponents());

            // Next / Hold
            this.renderer.renderPreview(this.renderer.nCtx, this.nCv, h.engine.next ? { type: h.engine.next.type } : null);
            this.renderer.renderPreview(this.renderer.hCtx, this.hCv, h.engine.hold ? { type: h.engine.hold } : null);

            // Check game end
            if (this.battle.ended) {
                this.running = false;
                this._showEnd();
            }
        }

        // Render
        if (this.battle.human) {
            this.renderer.render(this.battle.human.engine);
        }

        requestAnimationFrame(t => this._loop(t));
    }

    _showEnd() {
        const h = this.battle.human;
        if (h.alive) {
            this.oTitle.textContent = '胜利！';
            this.oMsg.textContent = '恭喜，你是最后的赢家！';
        } else {
            this.oTitle.textContent = '游戏结束';
            this.oMsg.textContent = '排名: 第 ' + h.rank + ' 名';
        }
        const elapsed = Date.now() - this.startTime;
        const min = Math.floor(elapsed / 60000);
        const sec = Math.floor((elapsed % 60000) / 1000);
        this.oStats.innerHTML =
            'KO: ' + h.ko + ' · 清行: ' + h.engine.lines + '<br>' +
            '分数: ' + h.engine.score.toLocaleString() + ' · 时间: ' + min + ':' + String(sec).padStart(2, '0');
        this.startBtn.textContent = '再来一局';
        this.overlay.classList.remove('hidden');
    }
}

/* ── Boot ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
