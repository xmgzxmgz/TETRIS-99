/* ============================================
   TETRIS 99 - Liquid Glass Edition
   iOS 27 design - All logic self-contained
   ============================================ */
'use strict';

const COLORS = {
    I: '#32d7eb', O: '#ffd60a', T: '#bf5af2',
    S: '#30d158', Z: '#ff453a', J: '#0a84ff', L: '#ff9f0a'
};

const SHAPES = {
    I:[[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],[[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],[[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],[[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]],
    O:[[[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]]],
    T:[[[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]],[[0,0,0,0],[0,1,0,0],[0,1,1,0],[0,1,0,0]],[[0,0,0,0],[0,0,0,0],[1,1,1,0],[0,1,0,0]],[[0,0,0,0],[0,1,0,0],[1,1,0,0],[0,1,0,0]]],
    S:[[[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],[[0,0,0,0],[0,1,0,0],[0,1,1,0],[0,0,1,0]],[[0,0,0,0],[0,0,0,0],[0,1,1,0],[1,1,0,0]],[[0,0,0,0],[1,0,0,0],[1,1,0,0],[0,1,0,0]]],
    Z:[[[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],[[0,0,0,0],[0,0,1,0],[0,1,1,0],[0,1,0,0]],[[0,0,0,0],[0,0,0,0],[1,1,0,0],[0,1,1,0]],[[0,0,0,0],[0,1,0,0],[1,1,0,0],[1,0,0,0]]],
    J:[[[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]],[[0,0,0,0],[0,1,1,0],[0,1,0,0],[0,1,0,0]],[[0,0,0,0],[0,0,0,0],[1,1,1,0],[0,0,1,0]],[[0,0,0,0],[0,1,0,0],[0,1,0,0],[1,1,0,0]]],
    L:[[[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]],[[0,0,0,0],[0,1,0,0],[0,1,0,0],[0,1,1,0]],[[0,0,0,0],[0,0,0,0],[1,1,1,0],[1,0,0,0]],[[0,0,0,0],[1,1,0,0],[0,1,0,0],[0,1,0,0]]]
};

const KICKS = {
    J: {
        '01': [[-1,0],[-1,1],[0,-2],[-1,-2]], '10': [[1,0],[1,-1],[0,2],[1,2]],
        '12': [[1,0],[1,-1],[0,2],[1,2]], '21': [[-1,0],[-1,1],[0,-2],[-1,-2]],
        '23': [[1,0],[1,1],[0,-2],[1,-2]], '32': [[-1,0],[-1,-1],[0,2],[-1,2]],
        '30': [[-1,0],[-1,-1],[0,2],[-1,2]], '03': [[1,0],[1,1],[0,-2],[1,-2]]
    },
    I: {
        '01': [[-2,0],[1,0],[-2,-1],[1,2]], '10': [[2,0],[-1,0],[2,1],[-1,-2]],
        '12': [[-1,0],[2,0],[-1,2],[2,-1]], '21': [[1,0],[-2,0],[1,-2],[-2,1]],
        '23': [[2,0],[-1,0],[2,1],[-1,-2]], '32': [[-2,0],[1,0],[-2,-1],[1,2]],
        '30': [[1,0],[-2,0],[1,-2],[-2,1]], '03': [[-1,0],[2,0],[-1,2],[2,-1]]
    }
};

function getKicks(type, from, to) {
    if (type === 'O') return [[0, 0]];
    const key = '' + from + to;
    const table = type === 'I' ? KICKS.I : KICKS.J;
    return [[0, 0], ...(table[key] || [])];
}

/* ── Seven-bag generator ────────────────── */
class Bag {
    constructor() { this._bag = []; }
    next() {
        if (!this._bag.length) {
            this._bag = ['I','O','T','S','Z','J','L'];
            for (let i = 6; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this._bag[i], this._bag[j]] = [this._bag[j], this._bag[i]];
            }
        }
        return this._bag.pop();
    }
}

/* ── Engine ─────────────────────────────── */
class Engine {
    constructor(w, h) {
        this.W = w || 10;
        this.H = h || 20;
        this.board = [];
        this.bag = new Bag();
        this.cur = null;
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
        this.board = [];
        for (let i = 0; i < this.H; i++) this.board.push(this._emptyRow());
        this.next = this._makePiece();
        this._spawnNext();
    }

    _emptyRow() {
        const r = [];
        for (let i = 0; i < this.W; i++) r.push(0);
        return r;
    }

    _makePiece() {
        return { type: this.bag.next(), x: 3, y: 0, rot: 0 };
    }

    _spawnNext() {
        this.cur = this.next;
        this.next = this._makePiece();
        this.canHold = true;
        this.locking = false;
        this.lockTimer = 0;
        this.totalPieces++;
        if (this._collides(this.cur)) this.gameOver = true;
    }

    _shape(p) {
        const shapes = SHAPES[p.type];
        return shapes[p.rot % shapes.length];
    }

    _blocks(p) {
        const s = this._shape(p);
        const out = [];
        for (let r = 0; r < 4; r++)
            for (let c = 0; c < 4; c++)
                if (s[r][c]) out.push({ x: p.x + c, y: p.y + r });
        return out;
    }

    _collides(p) {
        const blocks = this._blocks(p);
        for (let i = 0; i < blocks.length; i++) {
            const b = blocks[i];
            if (b.x < 0 || b.x >= this.W || b.y >= this.H) return true;
            if (b.y >= 0 && this.board[b.y][b.x]) return true;
        }
        return false;
    }

    move(dx, dy) {
        if (!this.cur || this.gameOver) return false;
        this.cur.x += dx;
        this.cur.y += dy;
        if (this._collides(this.cur)) {
            this.cur.x -= dx;
            this.cur.y -= dy;
            return false;
        }
        if (dy === 0) { this.lockTimer = 0; this.locking = false; }
        return true;
    }

    rotate(dir) {
        if (!this.cur || this.gameOver) return false;
        if (!dir) dir = 1;
        const oldRot = this.cur.rot;
        const shapes = SHAPES[this.cur.type];
        const newRot = (oldRot + dir + shapes.length) % shapes.length;
        const kicks = getKicks(this.cur.type, oldRot, newRot);
        this.cur.rot = newRot;
        for (let i = 0; i < kicks.length; i++) {
            this.cur.x += kicks[i][0];
            this.cur.y += kicks[i][1];
            if (!this._collides(this.cur)) {
                this.lockTimer = 0;
                this.locking = false;
                return true;
            }
            this.cur.x -= kicks[i][0];
            this.cur.y -= kicks[i][1];
        }
        this.cur.rot = oldRot;
        return false;
    }

    hardDrop() {
        if (!this.cur || this.gameOver) return 0;
        let d = 0;
        while (this.move(0, 1)) d++;
        this.score += d * 2;
        this._lock();
        return d;
    }

    softDrop() {
        return this.move(0, 1);
    }

    holdPiece() {
        if (!this.canHold || !this.cur || this.gameOver) return false;
        const t = this.cur.type;
        if (this.hold) {
            const tmp = this.hold;
            this.hold = t;
            this.cur = { type: tmp, x: 3, y: 0, rot: 0 };
        } else {
            this.hold = t;
            this._spawnNext();
        }
        this.canHold = false;
        return true;
    }

    ghost() {
        if (!this.cur) return null;
        const g = { type: this.cur.type, x: this.cur.x, y: this.cur.y, rot: this.cur.rot };
        while (!this._collides(g)) g.y++;
        g.y--;
        return g;
    }

    _lock() {
        if (!this.cur) return;
        const color = COLORS[this.cur.type];
        const blocks = this._blocks(this.cur);
        for (let i = 0; i < blocks.length; i++) {
            const b = blocks[i];
            if (b.y >= 0 && b.y < this.H && b.x >= 0 && b.x < this.W) {
                this.board[b.y][b.x] = color;
            }
        }
        // T-Spin check
        let tSpin = false;
        if (this.cur.type === 'T') {
            const cx = this.cur.x, cy = this.cur.y;
            const corners = [[cx, cy], [cx + 2, cy], [cx, cy + 2], [cx + 2, cy + 2]];
            let occ = 0;
            for (let i = 0; i < 4; i++) {
                const px = corners[i][0], py = corners[i][1];
                if (px < 0 || px >= this.W || py < 0 || py >= this.H) occ++;
                else if (py >= 0 && this.board[py] && this.board[py][px]) occ++;
            }
            tSpin = occ >= 3;
        }
        this.lastWasTSpin = tSpin;
        const cleared = this._clearLines();
        this.lastClear = cleared;
        this._calcScore(cleared, tSpin);
        this._spawnNext();
    }

    _clearLines() {
        let cleared = 0;
        for (let y = this.H - 1; y >= 0; y--) {
            let full = true;
            for (let x = 0; x < this.W; x++) {
                if (!this.board[y][x]) { full = false; break; }
            }
            if (full) {
                this.board.splice(y, 1);
                this.board.unshift(this._emptyRow());
                cleared++;
                y++;
            }
        }
        if (cleared === 0) { this.combo = 0; return 0; }
        this.lines += cleared;
        this.combo++;
        this._updateLevel();
        return cleared;
    }

    _calcScore(lines, tSpin) {
        let base = 0;
        if (tSpin) {
            base = [0, 800, 1200, 1600][lines] || 0;
        } else {
            base = [0, 100, 300, 500, 800][lines] || 0;
        }
        if (this.combo > 1) base += 50 * (this.combo - 1);
        let empty = true;
        for (let y = 0; y < this.H && empty; y++)
            for (let x = 0; x < this.W && empty; x++)
                if (this.board[y][x]) empty = false;
        if (empty) base *= 10;
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
        const l = this.lastClear;
        let atk = 0;
        if (this.lastWasTSpin) {
            atk = [0, 2, 4, 6][l] || 0;
        } else {
            atk = [0, 0, 1, 2, 4][l] || 0;
        }
        if (this.combo > 1) atk += Math.min(this.combo - 1, 4);
        return atk;
    }

    receiveGarbage(n) {
        if (n <= 0) return;
        // Remove top rows
        for (let i = 0; i < n; i++) this.board.shift();
        // Add garbage at bottom
        for (let i = 0; i < n; i++) {
            const row = [];
            const hole = Math.floor(Math.random() * this.W);
            for (let x = 0; x < this.W; x++) row.push(x === hole ? 0 : '#666');
            this.board.push(row);
        }
        // If current piece now overlaps, push it up
        if (this.cur && this._collides(this.cur)) {
            this.cur.y -= n;
            if (this._collides(this.cur)) {
                this.gameOver = true;
            }
        }
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
        this.score = 0; this.level = 1; this.lines = 0; this.combo = 0;
        this.gameOver = false; this.dropTimer = 0; this.lockTimer = 0;
        this.locking = false; this.dropMs = 1000; this.lastClear = 0;
        this.lastWasTSpin = false; this.totalPieces = 0;
        this.hold = null; this.canHold = true;
        this.bag = new Bag();
        this._init();
    }
}

/* ── AI Player (much easier) ────────────── */
class AI {
    constructor(diff) {
        this.diff = diff || 'easy';
        this.engine = new Engine();
        this.alive = true;
        this.timer = 0;
        // Much slower AI - gives human player a chance
        const delays = { easy: 2500, medium: 1200, hard: 600, expert: 300 };
        this.baseDelay = delays[this.diff] || 2500;
        this.delay = this.baseDelay + Math.random() * this.baseDelay * 0.5;
        this.errRate = { easy: 0.30, medium: 0.15, hard: 0.05, expert: 0.02 }[this.diff] || 0.30;
        this.weights = {
            easy:   { h: -0.3, l: 0.5, ho: -0.2, b: -0.05, a: -0.05 },
            medium: { h: -0.6, l: 0.9, ho: -0.4, b: -0.15, a: -0.15 },
            hard:   { h: -0.9, l: 1.2, ho: -0.7, b: -0.3, a: -0.3 },
            expert: { h: -1.0, l: 1.5, ho: -1.0, b: -0.4, a: -0.4 }
        }[this.diff] || { h: -0.3, l: 0.5, ho: -0.2, b: -0.05, a: -0.05 };
    }

    update(dt) {
        if (!this.alive || this.engine.gameOver) { this.alive = false; return; }
        this.engine.update(dt);
        this.timer += dt;
        if (this.timer >= this.delay) {
            this._decide();
            this.timer = 0;
            this.delay = this.baseDelay + Math.random() * this.baseDelay * 0.5;
        }
    }

    _decide() {
        if (!this.engine.cur) return;
        if (Math.random() < this.errRate) { this._randomMove(); return; }
        const best = this._bestMove();
        if (best) {
            const cur = this.engine.cur;
            while (cur.rot !== best.rot) this.engine.rotate(1);
            const dx = best.x - cur.x;
            if (dx > 0) { for (let i = 0; i < dx; i++) this.engine.move(1, 0); }
            if (dx < 0) { for (let i = 0; i < -dx; i++) this.engine.move(-1, 0); }
            this.engine.hardDrop();
        }
    }

    _bestMove() {
        const p = this.engine.cur;
        if (!p) return null;
        let best = null, bestScore = -Infinity;
        const numRotations = SHAPES[p.type].length;
        for (let r = 0; r < numRotations; r++) {
            for (let x = -2; x < this.engine.W + 2; x++) {
                const test = { type: p.type, x: x, y: 0, rot: r };
                while (!this.engine._collides(test)) test.y++;
                test.y--;
                if (this.engine._collides(test)) continue;
                const score = this._evaluate(test);
                if (score > bestScore) { bestScore = score; best = { x: test.x, rot: r }; }
            }
        }
        return best;
    }

    _evaluate(p) {
        const eng = this.engine;
        // Copy board
        const tmp = [];
        for (let y = 0; y < eng.H; y++) {
            const row = [];
            for (let x = 0; x < eng.W; x++) row.push(eng.board[y][x]);
            tmp.push(row);
        }
        // Place piece
        const blocks = eng._blocks(p);
        for (let i = 0; i < blocks.length; i++) {
            const b = blocks[i];
            if (b.y >= 0 && b.y < eng.H && b.x >= 0 && b.x < eng.W) tmp[b.y][b.x] = 1;
        }
        // Count and clear lines
        let cl = 0;
        for (let y = eng.H - 1; y >= 0; y--) {
            let full = true;
            for (let x = 0; x < eng.W; x++) { if (!tmp[y][x]) { full = false; break; } }
            if (full) { tmp.splice(y, 1); tmp.unshift(Array(eng.W).fill(0)); cl++; y++; }
        }
        // Metrics
        const heights = [];
        let maxH = 0, holes = 0, agg = 0;
        for (let x = 0; x < eng.W; x++) {
            let h = 0, found = false;
            for (let y = 0; y < eng.H; y++) {
                if (tmp[y][x]) { if (!found) { h = eng.H - y; found = true; } }
                else if (found) holes++;
            }
            heights.push(h); if (h > maxH) maxH = h; agg += h;
        }
        let bump = 0;
        for (let i = 0; i < heights.length - 1; i++) bump += Math.abs(heights[i] - heights[i + 1]);
        const w = this.weights;
        return w.l * cl * cl + w.h * maxH + w.ho * holes + w.b * bump + w.a * agg;
    }

    _randomMove() {
        const r = Math.random();
        if (r < 0.2) this.engine.move(-1, 0);
        else if (r < 0.4) this.engine.move(1, 0);
        else if (r < 0.6) this.engine.rotate(1);
        else if (r < 0.85) this.engine.hardDrop();
        else this.engine.holdPiece();
    }

    reset() {
        this.engine.reset();
        this.alive = true;
        this.timer = 0;
        this.delay = this.baseDelay + Math.random() * this.baseDelay * 0.5;
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
    }

    init(count) {
        this.players = [];
        this.rank = (count || 98) + 1;
        this.ended = false;
        // Human player
        const h = {
            id: 'human', name: 'Player', isAI: false,
            engine: new Engine(), alive: true, rank: null,
            ko: 0, badges: 0, atkQ: [], lastLines: 0, _lastGarbageTime: 0
        };
        this.players.push(h);
        this.human = h;
        // AI players
        this.ais = [];
        const diffs = ['easy', 'easy', 'easy', 'medium', 'medium', 'hard'];
        for (let i = 0; i < (count || 98); i++) {
            const diff = diffs[Math.floor(Math.random() * diffs.length)];
            const ai = new AI(diff);
            const p = {
                id: 'ai_' + i, name: 'AI ' + (i + 1), isAI: true,
                engine: ai.engine, ai: ai, alive: true, rank: null,
                ko: 0, badges: 0, atkQ: [], lastLines: 0, diff: diff, _lastGarbageTime: 0
            };
            this.players.push(p);
            this.ais.push(p);
        }
    }

    start() {
        this.init(98);
        this.started = true;
    }

    update(dt) {
        if (!this.started || this.ended) return;
        for (let i = 0; i < this.players.length; i++) {
            const p = this.players[i];
            if (!p.alive) continue;
            const prev = p.engine.lines;
            if (p.isAI) {
                p.ai.update(dt);
                if (!p.ai.alive || p.engine.gameOver) this._eliminate(p);
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
        var now = Date.now ? Date.now() : 0;
        for (var i = 0; i < this.players.length; i++) {
            var p = this.players[i];
            if (!p.alive || p.lastLines <= 0) continue;
            // Only 2+ line clears or T-Spins send garbage
            if (p.lastLines < 2 && !p.engine.lastWasTSpin) continue;
            var atk = p.engine.attackLines();
            if (atk <= 0) continue;
            // Random chance to send (reduces spam with many AIs)
            if (Math.random() > 0.4) continue;
            var targets = this._pickTargets(p.id, 1);
            for (var j = 0; j < targets.length; j++) {
                var t = targets[j];
                if (!t.alive) continue;
                // Rate limit: max 1 garbage per 2 seconds per target
                if (t._lastGTime && now - t._lastGTime < 2000) continue;
                t._lastGTime = now;
                t.atkQ.push({ lines: 1, from: p.id });
                t.engine.receiveGarbage(1);
                if (t.engine.gameOver) this._eliminate(t, p.id);
            }
        }
    }

    _pickTargets(srcId, atk) {
        const alive = [];
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].alive && this.players[i].id !== srcId) alive.push(this.players[i]);
        }
        if (!alive.length) return [];
        const n = Math.min(4, alive.length);
        if (this.strategy === 'ko') {
            const vuln = [];
            for (let i = 0; i < alive.length; i++) {
                if (this._height(alive[i]) > 14) vuln.push(alive[i]);
            }
            vuln.sort(function(a, b) { return this._height(b) - this._height(a); }.bind(this));
            return vuln.length ? vuln.slice(0, n) : this._randN(alive, n);
        }
        if (this.strategy === 'badge') {
            const sorted = alive.slice().sort(function(a, b) { return b.badges - a.badges; });
            return sorted.slice(0, n);
        }
        return this._randN(alive, n);
    }

    _randN(arr, n) {
        const s = arr.slice();
        for (let i = s.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = s[i]; s[i] = s[j]; s[j] = tmp;
        }
        return s.slice(0, n);
    }

    _height(p) {
        const b = p.engine.board;
        for (let y = 0; y < b.length; y++) {
            for (let x = 0; x < b[y].length; x++) {
                if (b[y][x]) return b.length - y;
            }
        }
        return 0;
    }

    _eliminate(p, killerId) {
        if (!p.alive) return;
        p.alive = false;
        p.rank = this.rank--;
        if (killerId) {
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].id === killerId && this.players[i].alive) {
                    this.players[i].ko++;
                    this.players[i].badges += p.badges + 1;
                    break;
                }
            }
        }
    }

    _checkEnd() {
        let count = 0, last = null;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].alive) { count++; last = this.players[i]; }
        }
        if (count <= 1) {
            this.ended = true;
            if (last) last.rank = 1;
        }
    }

    getOpponents() {
        const out = [];
        const limit = Math.min(this.ais.length, 40);
        for (let i = 0; i < limit; i++) {
            const p = this.ais[i];
            out.push({
                id: p.id, rank: p.rank, alive: p.alive,
                height: this._height(p), targeting: false, targeted: false
            });
        }
        return out;
    }
}

/* ── Renderer ───────────────────────────── */
class Renderer {
    constructor(cv, nCv, hCv) {
        this.cv = cv;
        this.ctx = cv.getContext('2d');
        this.nCv = nCv;
        this.nCtx = nCv.getContext('2d');
        this.hCv = hCv;
        this.hCtx = hCv.getContext('2d');
        this.cell = 28;
        this.effects = [];
    }

    resize(eng) {
        const wrapper = this.cv.parentElement;
        const maxW = Math.min(300, wrapper ? wrapper.clientWidth : 300);
        const maxH = Math.min(620, window.innerHeight - 200);
        this.cell = Math.floor(Math.min(maxW / eng.W, maxH / eng.H));
        if (this.cell < 12) this.cell = 12;
        this.cv.width = eng.W * this.cell;
        this.cv.height = eng.H * this.cell;
    }

    render(eng) {
        const ctx = this.ctx, c = this.cell, W = eng.W, H = eng.H;
        ctx.clearRect(0, 0, this.cv.width, this.cv.height);
        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(x*c, 0); ctx.lineTo(x*c, H*c); ctx.stroke(); }
        for (let y = 0; y <= H; y++) { ctx.beginPath(); ctx.moveTo(0, y*c); ctx.lineTo(W*c, y*c); ctx.stroke(); }
        // Placed blocks
        for (let y = 0; y < H; y++)
            for (let x = 0; x < W; x++)
                if (eng.board[y][x]) this._drawCell(ctx, x, y, eng.board[y][x]);
        // Ghost
        if (eng.cur) {
            const g = eng.ghost();
            if (g) {
                const gb = eng._blocks(g);
                for (let i = 0; i < gb.length; i++)
                    if (gb[i].y >= 0) this._drawCell(ctx, gb[i].x, gb[i].y, COLORS[g.type], 0.15);
            }
        }
        // Current piece
        if (eng.cur) {
            const color = COLORS[eng.cur.type];
            const blocks = eng._blocks(eng.cur);
            for (let i = 0; i < blocks.length; i++)
                if (blocks[i].y >= 0) this._drawCell(ctx, blocks[i].x, blocks[i].y, color);
        }
        // Effects
        const now = Date.now();
        const kept = [];
        for (let i = 0; i < this.effects.length; i++) {
            const e = this.effects[i];
            const age = now - e.t;
            if (age > e.d) continue;
            kept.push(e);
            ctx.save();
            ctx.globalAlpha = 1 - age / e.d;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('+' + e.v, this.cv.width / 2, 50 - (age / e.d) * 30);
            ctx.restore();
        }
        this.effects = kept;
    }

    _drawCell(ctx, x, y, color, alpha) {
        const c = this.cell;
        const px = x * c, py = y * c;
        const inset = 1;
        const r = Math.min(5, c / 4);
        ctx.save();
        if (alpha) ctx.globalAlpha = alpha;
        // Main fill with rounded rect
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(px + r + inset, py + inset);
        ctx.lineTo(px + c - r - inset, py + inset);
        ctx.quadraticCurveTo(px + c - inset, py + inset, px + c - inset, py + r + inset);
        ctx.lineTo(px + c - inset, py + c - r - inset);
        ctx.quadraticCurveTo(px + c - inset, py + c - inset, px + c - r - inset, py + c - inset);
        ctx.lineTo(px + r + inset, py + c - inset);
        ctx.quadraticCurveTo(px + inset, py + c - inset, px + inset, py + c - r - inset);
        ctx.lineTo(px + inset, py + r + inset);
        ctx.quadraticCurveTo(px + inset, py + inset, px + r + inset, py + inset);
        ctx.closePath();
        ctx.fill();
        // Glass highlight (top)
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.moveTo(px + r + inset, py + inset);
        ctx.lineTo(px + c - r - inset, py + inset);
        ctx.quadraticCurveTo(px + c - inset, py + inset, px + c - inset, py + r + inset);
        ctx.lineTo(px + c - inset, py + c * 0.4);
        ctx.lineTo(px + inset, py + c * 0.4);
        ctx.lineTo(px + inset, py + r + inset);
        ctx.quadraticCurveTo(px + inset, py + inset, px + r + inset, py + inset);
        ctx.closePath();
        ctx.fill();
        // Subtle inner shadow (bottom-right)
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(px + c * 0.5, py + c - inset - 2, c * 0.5 - inset, 2);
        ctx.fillRect(px + c - inset - 2, py + c * 0.5, 2, c * 0.5 - inset);
        ctx.restore();
    }

    renderPreview(ctx, cvs, piece) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        if (!piece) return;
        const shape = SHAPES[piece.type][0];
        const cs = Math.min(cvs.width / 5, cvs.height / 5);
        const ox = (cvs.width - 4 * cs) / 2;
        const oy = (cvs.height - 4 * cs) / 2;
        const color = COLORS[piece.type];
        for (let r = 0; r < 4; r++)
            for (let c2 = 0; c2 < 4; c2++)
                if (shape[r][c2]) {
                    const px = ox + c2 * cs, py = oy + r * cs;
                    const rr = 3;
                    ctx.fillStyle = color;
                    ctx.beginPath();
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
                    ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx.fillRect(px + 2, py + 2, cs - 4, cs * 0.35);
                }
    }

    addDropEffect(dist) {
        this.effects.push({ v: dist * 2, t: Date.now(), d: 500 });
    }
}

/* ── Opponents Grid ─────────────────────── */
class OpponentsView {
    constructor(el) { this.el = el; this.cards = {}; }
    update(opps) {
        for (let i = 0; i < opps.length; i++) {
            const o = opps[i];
            if (!this.cards[o.id]) {
                const card = document.createElement('div');
                card.className = 'opponent-card';
                const rank = document.createElement('div');
                rank.className = 'opponent-card__rank';
                card.appendChild(rank);
                const cvs = document.createElement('canvas');
                cvs.width = 76; cvs.height = 96;
                card.appendChild(cvs);
                this.el.appendChild(card);
                this.cards[o.id] = { el: card, rank: rank, ctx: cvs.getContext('2d') };
            }
            const c = this.cards[o.id];
            c.el.className = 'opponent-card' + (!o.alive ? ' eliminated' : '');
            c.rank.textContent = o.rank || '-';
            const ctx = c.ctx;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, 76, 96);
            const h = Math.min(o.height, 20);
            if (h > 0) {
                const barH = (h / 20) * 96;
                const hue = Math.max(0, 120 - (h / 20) * 120);
                ctx.fillStyle = 'hsl(' + hue + ',70%,50%)';
                ctx.fillRect(4, 96 - barH, 68, barH);
            }
        }
    }
}

/* ── Toast ──────────────────────────────── */
function toast(msg) {
    var el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function() { el.classList.remove('show'); }, 2500);
}

/* ── Game Controller ────────────────────── */
class Game {
    constructor() {
        this.cv = document.getElementById('gameCanvas');
        this.nCv = document.getElementById('nextCanvas');
        this.hCv = document.getElementById('holdCanvas');
        this.overlay = document.getElementById('overlay');
        this.startBtn = document.getElementById('startBtn');
        this.oTitle = document.getElementById('overlayTitle');
        this.oMsg = document.getElementById('overlayMessage');
        this.oStats = document.getElementById('overlayStats');
        this.renderer = new Renderer(this.cv, this.nCv, this.hCv);
        this.battle = new Battle();
        this.oppView = new OpponentsView(document.getElementById('opponentsGrid'));
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
        var self = this;
        document.addEventListener('keydown', function(e) { self._keyDown(e); });
        document.addEventListener('keyup', function(e) { self._keyUp(e); });
        window.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') e.preventDefault();
        });
        this.startBtn.addEventListener('click', function() { self._start(); });
        var btns = document.querySelectorAll('.pill-btn');
        for (var i = 0; i < btns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    self.battle.strategy = btn.dataset.strategy;
                    var all = document.querySelectorAll('.pill-btn');
                    for (var j = 0; j < all.length; j++) all[j].classList.remove('active');
                    btn.classList.add('active');
                    toast('策略: ' + btn.textContent);
                });
            })(btns[i]);
        }
        window.addEventListener('resize', function() {
            if (self.battle.human) self.renderer.resize(self.battle.human.engine);
        });
    }

    _showStart() {
        this.oTitle.textContent = 'TETRIS 99';
        this.oMsg.textContent = '99 人对战 · Liquid Glass 风格\n点击开始或按空格键';
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
        var eng = this.battle.human.engine;
        switch (e.key) {
            case 'ArrowLeft':
                eng.move(-1, 0);
                this._setRepeat('ArrowLeft', function() { eng.move(-1, 0); });
                break;
            case 'ArrowRight':
                eng.move(1, 0);
                this._setRepeat('ArrowRight', function() { eng.move(1, 0); });
                break;
            case 'ArrowDown':
                if (eng.softDrop()) eng.score++;
                this._setRepeat('ArrowDown', function() { if (eng.softDrop()) eng.score++; });
                break;
            case 'ArrowUp': case 'x': case 'X':
                eng.rotate(1); break;
            case 'z': case 'Z':
                eng.rotate(-1); break;
            case ' ':
                var d = eng.hardDrop();
                if (d) this.renderer.addDropEffect(d);
                break;
            case 'c': case 'C':
                eng.holdPiece(); break;
        }
    }

    _keyUp(e) {
        this.keys[e.key] = false;
        if (this.keyTimers[e.key]) { clearInterval(this.keyTimers[e.key]); delete this.keyTimers[e.key]; }
    }

    _setRepeat(key, fn) {
        if (this.keyTimers[key]) return;
        this.keys[key] = true;
        var self = this;
        setTimeout(function() {
            if (self.keys[key]) {
                self.keyTimers[key] = setInterval(function() {
                    if (self.keys[key]) fn();
                    else { clearInterval(self.keyTimers[key]); delete self.keyTimers[key]; }
                }, 50);
            }
        }, 170);
    }

    _loop(now) {
        var dt = now - this.lastTime;
        this.lastTime = now;
        if (dt > 100) dt = 16; // cap delta on tab switch

        if (this.running && !this.battle.ended) {
            this.battle.update(dt);
            var h = this.battle.human;
            // Update stats
            var aliveCount = 0;
            for (var i = 0; i < this.battle.players.length; i++) {
                if (this.battle.players[i].alive) aliveCount++;
            }
            var rank = h.alive ? (function() {
                var r = 0;
                for (var i = 0; i < this.battle.players.length; i++) {
                    if (this.battle.players[i].alive && this.battle.players[i].ko > h.ko) r++;
                }
                return aliveCount - r;
            }).call(this) : h.rank;
            document.getElementById('stat-rank').textContent = rank || aliveCount;
            document.getElementById('stat-ko').textContent = h.ko;
            document.getElementById('stat-score').textContent = h.engine.score.toLocaleString();
            // Combo
            var comboEl = document.getElementById('comboDisplay');
            comboEl.textContent = h.engine.combo;
            if (h.engine.combo > 0) { comboEl.classList.add('bump'); setTimeout(function() { comboEl.classList.remove('bump'); }, 150); }
            // Attack queue
            var aq = document.getElementById('attackQueue');
            if (this._lastAtk !== h.atkQ.length) {
                this._lastAtk = h.atkQ.length;
                aq.innerHTML = '';
                for (var j = 0; j < Math.min(h.atkQ.length, 8); j++) {
                    var bar = document.createElement('div');
                    bar.className = 'attack-bar';
                    aq.appendChild(bar);
                }
            }
            // Opponents
            this.oppView.update(this.battle.getOpponents());
            // Preview
            this.renderer.renderPreview(this.renderer.nCtx, this.nCv, h.engine.next ? { type: h.engine.next.type } : null);
            this.renderer.renderPreview(this.renderer.hCtx, this.hCv, h.engine.hold ? { type: h.engine.hold } : null);
            // End check
            if (this.battle.ended) { this.running = false; this._showEnd(); }
        }
        // Render
        if (this.battle.human) this.renderer.render(this.battle.human.engine);
        var self = this;
        requestAnimationFrame(function(t) { self._loop(t); });
    }

    _showEnd() {
        var h = this.battle.human;
        if (h.alive) {
            this.oTitle.textContent = '胜利！';
            this.oMsg.textContent = '恭喜，你是最后的赢家！';
        } else {
            this.oTitle.textContent = '游戏结束';
            this.oMsg.textContent = '排名: 第 ' + h.rank + ' 名';
        }
        var elapsed = Date.now() - this.startTime;
        var min = Math.floor(elapsed / 60000);
        var sec = Math.floor((elapsed % 60000) / 1000);
        this.oStats.innerHTML = 'KO: ' + h.ko + ' · 清行: ' + h.engine.lines + '<br>分数: ' + h.engine.score.toLocaleString() + ' · 时间: ' + min + ':' + (sec < 10 ? '0' : '') + sec;
        this.startBtn.textContent = '再来一局';
        this.overlay.classList.remove('hidden');
    }
}

/* ── Boot ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
    window.game = new Game();
});
