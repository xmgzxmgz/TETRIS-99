/* ============================================
   TETRIS 99 - Liquid Glass Edition
   iOS 27 · Real opponent boards · T-Spin effects
   ============================================ */
'use strict';

/* ── Piece data ─────────────────────────── */
var COLORS = { I:'#32d7eb', O:'#ffd60a', T:'#bf5af2', S:'#30d158', Z:'#ff453a', J:'#0a84ff', L:'#ff9f0a' };
var GARBAGE_COLOR = '#555';

var SHAPES = {
    I:[[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],[[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],[[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],[[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]],
    O:[[[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]]],
    T:[[[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]],[[0,0,0,0],[0,1,0,0],[0,1,1,0],[0,1,0,0]],[[0,0,0,0],[0,0,0,0],[1,1,1,0],[0,1,0,0]],[[0,0,0,0],[0,1,0,0],[1,1,0,0],[0,1,0,0]]],
    S:[[[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],[[0,0,0,0],[0,1,0,0],[0,1,1,0],[0,0,1,0]],[[0,0,0,0],[0,0,0,0],[0,1,1,0],[1,1,0,0]],[[0,0,0,0],[1,0,0,0],[1,1,0,0],[0,1,0,0]]],
    Z:[[[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],[[0,0,0,0],[0,0,1,0],[0,1,1,0],[0,1,0,0]],[[0,0,0,0],[0,0,0,0],[1,1,0,0],[0,1,1,0]],[[0,0,0,0],[0,1,0,0],[1,1,0,0],[1,0,0,0]]],
    J:[[[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]],[[0,0,0,0],[0,1,1,0],[0,1,0,0],[0,1,0,0]],[[0,0,0,0],[0,0,0,0],[1,1,1,0],[0,0,1,0]],[[0,0,0,0],[0,1,0,0],[0,1,0,0],[1,1,0,0]]],
    L:[[[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]],[[0,0,0,0],[0,1,0,0],[0,1,0,0],[0,1,1,0]],[[0,0,0,0],[0,0,0,0],[1,1,1,0],[1,0,0,0]],[[0,0,0,0],[1,1,0,0],[0,1,0,0],[0,1,0,0]]]
};

var KICKS_J = {
    '01': [[-1,0],[-1,1],[0,-2],[-1,-2]], '10': [[1,0],[1,-1],[0,2],[1,2]],
    '12': [[1,0],[1,-1],[0,2],[1,2]], '21': [[-1,0],[-1,1],[0,-2],[-1,-2]],
    '23': [[1,0],[1,1],[0,-2],[1,-2]], '32': [[-1,0],[-1,-1],[0,2],[-1,2]],
    '30': [[-1,0],[-1,-1],[0,2],[-1,2]], '03': [[1,0],[1,1],[0,-2],[1,-2]]
};
var KICKS_I = {
    '01': [[-2,0],[1,0],[-2,-1],[1,2]], '10': [[2,0],[-1,0],[2,1],[-1,-2]],
    '12': [[-1,0],[2,0],[-1,2],[2,-1]], '21': [[1,0],[-2,0],[1,-2],[-2,1]],
    '23': [[2,0],[-1,0],[2,1],[-1,-2]], '32': [[-2,0],[1,0],[-2,-1],[1,2]],
    '30': [[1,0],[-2,0],[1,-2],[-2,1]], '03': [[-1,0],[2,0],[-1,2],[2,-1]]
};

function getKicks(type, from, to) {
    if (type === 'O') return [[0, 0]];
    var key = '' + from + to;
    var table = type === 'I' ? KICKS_I : KICKS_J;
    return [[0, 0]].concat(table[key] || []);
}

/* ── Bag ────────────────────────────────── */
function Bag() { this._bag = []; }
Bag.prototype.next = function() {
    if (!this._bag.length) {
        this._bag = ['I','O','T','S','Z','J','L'];
        for (var i = 6; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = this._bag[i]; this._bag[i] = this._bag[j]; this._bag[j] = t;
        }
    }
    return this._bag.pop();
};

/* ── Engine ─────────────────────────────── */
function Engine(w, h) {
    this.W = w || 10; this.H = h || 20;
    this.board = []; this.bag = new Bag();
    this.cur = null; this.next = null; this.hold = null; this.canHold = true;
    this.score = 0; this.level = 1; this.lines = 0; this.combo = 0;
    this.gameOver = false; this.dropTimer = 0; this.lockTimer = 0; this.locking = false;
    this.dropMs = 1000; this.lockMs = 500;
    this.lastClear = 0; this.lastWasTSpin = false; this.totalPieces = 0;
    this.lineFlashTimer = 0; this.lineFlashRows = [];
    this._init();
}
Engine.prototype._init = function() {
    this.board = [];
    for (var i = 0; i < this.H; i++) this.board.push(this._emptyRow());
    this.next = this._makePiece();
    this._spawnNext();
};
Engine.prototype._emptyRow = function() {
    var r = []; for (var i = 0; i < this.W; i++) r.push(0); return r;
};
Engine.prototype._makePiece = function() {
    return { type: this.bag.next(), x: 3, y: 0, rot: 0 };
};
Engine.prototype._spawnNext = function() {
    this.cur = this.next; this.next = this._makePiece();
    this.canHold = true; this.locking = false; this.lockTimer = 0;
    this.totalPieces++;
    if (this._collides(this.cur)) this.gameOver = true;
};
Engine.prototype._shape = function(p) { return SHAPES[p.type][p.rot % SHAPES[p.type].length]; };
Engine.prototype._blocks = function(p) {
    var s = this._shape(p), out = [];
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) if (s[r][c]) out.push({x: p.x + c, y: p.y + r});
    return out;
};
Engine.prototype._collides = function(p) {
    var blocks = this._blocks(p);
    for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        if (b.x < 0 || b.x >= this.W || b.y >= this.H) return true;
        if (b.y >= 0 && this.board[b.y][b.x]) return true;
    }
    return false;
};
Engine.prototype.move = function(dx, dy) {
    if (!this.cur || this.gameOver) return false;
    this.cur.x += dx; this.cur.y += dy;
    if (this._collides(this.cur)) { this.cur.x -= dx; this.cur.y -= dy; return false; }
    if (dy === 0) { this.lockTimer = 0; this.locking = false; }
    return true;
};
Engine.prototype.rotate = function(dir) {
    if (!this.cur || this.gameOver) return false;
    if (!dir) dir = 1;
    var oldRot = this.cur.rot, shapes = SHAPES[this.cur.type];
    var newRot = (oldRot + dir + shapes.length) % shapes.length;
    var kicks = getKicks(this.cur.type, oldRot, newRot);
    this.cur.rot = newRot;
    for (var i = 0; i < kicks.length; i++) {
        this.cur.x += kicks[i][0]; this.cur.y += kicks[i][1];
        if (!this._collides(this.cur)) { this.lockTimer = 0; this.locking = false; return true; }
        this.cur.x -= kicks[i][0]; this.cur.y -= kicks[i][1];
    }
    this.cur.rot = oldRot; return false;
};
Engine.prototype.hardDrop = function() {
    if (!this.cur || this.gameOver) return 0;
    var d = 0; while (this.move(0, 1)) d++;
    this.score += d * 2; this._lock(); return d;
};
Engine.prototype.softDrop = function() { return this.move(0, 1); };
Engine.prototype.holdPiece = function() {
    if (!this.canHold || !this.cur || this.gameOver) return false;
    var t = this.cur.type;
    if (this.hold) { var tmp = this.hold; this.hold = t; this.cur = {type: tmp, x: 3, y: 0, rot: 0}; }
    else { this.hold = t; this._spawnNext(); }
    this.canHold = false; return true;
};
Engine.prototype.ghost = function() {
    if (!this.cur) return null;
    var g = {type: this.cur.type, x: this.cur.x, y: this.cur.y, rot: this.cur.rot};
    while (!this._collides(g)) g.y++; g.y--; return g;
};
Engine.prototype._lock = function() {
    if (!this.cur) return;
    var color = COLORS[this.cur.type], blocks = this._blocks(this.cur);
    for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        if (b.y >= 0 && b.y < this.H && b.x >= 0 && b.x < this.W) this.board[b.y][b.x] = color;
    }
    // T-Spin
    var tSpin = false;
    if (this.cur.type === 'T') {
        var cx = this.cur.x, cy = this.cur.y;
        var corners = [[cx, cy], [cx+2, cy], [cx, cy+2], [cx+2, cy+2]];
        var occ = 0;
        for (var i = 0; i < 4; i++) {
            var px = corners[i][0], py = corners[i][1];
            if (px < 0 || px >= this.W || py < 0 || py >= this.H) occ++;
            else if (py >= 0 && this.board[py] && this.board[py][px]) occ++;
        }
        tSpin = occ >= 3;
    }
    this.lastWasTSpin = tSpin;
    var cleared = this._clearLines();
    this.lastClear = cleared;
    this._calcScore(cleared, tSpin);
    this._spawnNext();
};
Engine.prototype._clearLines = function() {
    var cleared = 0, flashRows = [];
    for (var y = this.H - 1; y >= 0; y--) {
        var full = true;
        for (var x = 0; x < this.W; x++) { if (!this.board[y][x]) { full = false; break; } }
        if (full) {
            flashRows.push(y);
            this.board.splice(y, 1); this.board.unshift(this._emptyRow());
            cleared++; y++;
        }
    }
    if (cleared > 0) { this.lineFlashTimer = 300; this.lineFlashRows = flashRows; }
    if (cleared === 0) { this.combo = 0; return 0; }
    this.lines += cleared; this.combo++; this._updateLevel();
    return cleared;
};
Engine.prototype._calcScore = function(lines, tSpin) {
    var base = 0;
    if (tSpin) { base = [0, 800, 1200, 1600][lines] || 0; }
    else { base = [0, 100, 300, 500, 800][lines] || 0; }
    if (this.combo > 1) base += 50 * (this.combo - 1);
    this.score += base * this.level;
};
Engine.prototype._updateLevel = function() {
    var nl = Math.floor(this.lines / 10) + 1;
    if (nl > this.level) { this.level = nl; this.dropMs = Math.max(50, 1000 - (this.level - 1) * 50); }
};
Engine.prototype.attackLines = function() {
    var l = this.lastClear, atk = 0;
    if (this.lastWasTSpin) { atk = [0, 2, 4, 6][l] || 0; }
    else { atk = [0, 0, 1, 2, 4][l] || 0; }
    if (this.combo > 1) atk += Math.min(this.combo - 1, 4);
    return atk;
};
Engine.prototype.receiveGarbage = function(n) {
    if (n <= 0) return;
    for (var i = 0; i < n; i++) this.board.shift();
    for (var i = 0; i < n; i++) {
        var row = [], hole = Math.floor(Math.random() * this.W);
        for (var x = 0; x < this.W; x++) row.push(x === hole ? 0 : GARBAGE_COLOR);
        this.board.push(row);
    }
    if (this.cur && this._collides(this.cur)) {
        this.cur.y -= n;
        if (this._collides(this.cur)) this.gameOver = true;
    }
};
Engine.prototype.update = function(dt) {
    if (this.gameOver || !this.cur) return;
    if (this.lineFlashTimer > 0) this.lineFlashTimer -= dt;
    this.dropTimer += dt;
    if (this.dropTimer >= this.dropMs) {
        if (!this.move(0, 1)) { if (!this.locking) { this.locking = true; this.lockTimer = 0; } }
        this.dropTimer = 0;
    }
    if (this.locking) { this.lockTimer += dt; if (this.lockTimer >= this.lockMs) this._lock(); }
};
Engine.prototype.reset = function() {
    this.score = 0; this.level = 1; this.lines = 0; this.combo = 0;
    this.gameOver = false; this.dropTimer = 0; this.lockTimer = 0;
    this.locking = false; this.dropMs = 1000; this.lastClear = 0;
    this.lastWasTSpin = false; this.totalPieces = 0;
    this.hold = null; this.canHold = true; this.lineFlashTimer = 0;
    this.bag = new Bag(); this._init();
};

/* ── AI (slower, easier) ────────────────── */
function AI(diff) {
    this.diff = diff || 'easy';
    this.engine = new Engine();
    this.alive = true; this.timer = 0;
    var delays = { easy: 2500, medium: 1200, hard: 600, expert: 300 };
    this.baseDelay = delays[this.diff] || 2500;
    this.delay = this.baseDelay + Math.random() * this.baseDelay * 0.5;
    this.errRate = { easy: 0.30, medium: 0.15, hard: 0.05, expert: 0.02 }[this.diff] || 0.30;
}
AI.prototype.update = function(dt) {
    if (!this.alive || this.engine.gameOver) { this.alive = false; return; }
    this.engine.update(dt);
    this.timer += dt;
    if (this.timer >= this.delay) { this._decide(); this.timer = 0; this.delay = this.baseDelay + Math.random() * this.baseDelay * 0.5; }
};
AI.prototype._decide = function() {
    if (!this.engine.cur) return;
    if (Math.random() < this.errRate) { this._random(); return; }
    var best = this._bestMove();
    if (best) {
        var c = this.engine.cur;
        while (c.rot !== best.rot) this.engine.rotate(1);
        var dx = best.x - c.x;
        for (var i = 0; i < Math.abs(dx); i++) this.engine.move(dx > 0 ? 1 : -1, 0);
        this.engine.hardDrop();
    }
};
AI.prototype._bestMove = function() {
    var p = this.engine.cur; if (!p) return null;
    var best = null, bestS = -Infinity, nr = SHAPES[p.type].length;
    for (var r = 0; r < nr; r++) {
        for (var x = -2; x < this.engine.W + 2; x++) {
            var t = {type: p.type, x: x, y: 0, rot: r};
            while (!this.engine._collides(t)) t.y++; t.y--;
            if (this.engine._collides(t)) continue;
            var s = this._eval(t);
            if (s > bestS) { bestS = s; best = {x: t.x, rot: r}; }
        }
    }
    return best;
};
AI.prototype._eval = function(p) {
    var eng = this.engine, tmp = [];
    for (var y = 0; y < eng.H; y++) { var row = []; for (var x = 0; x < eng.W; x++) row.push(eng.board[y][x]); tmp.push(row); }
    var blocks = eng._blocks(p);
    for (var i = 0; i < blocks.length; i++) { var b = blocks[i]; if (b.y >= 0 && b.y < eng.H) tmp[b.y][b.x] = 1; }
    var cl = 0;
    for (var y = eng.H - 1; y >= 0; y--) {
        var full = true;
        for (var x = 0; x < eng.W; x++) { if (!tmp[y][x]) { full = false; break; } }
        if (full) { tmp.splice(y, 1); tmp.unshift(Array(eng.W).fill(0)); cl++; y++; }
    }
    var maxH = 0, holes = 0, heights = [];
    for (var x = 0; x < eng.W; x++) {
        var h = 0, found = false;
        for (var y = 0; y < eng.H; y++) {
            if (tmp[y][x]) { if (!found) { h = eng.H - y; found = true; } }
            else if (found) holes++;
        }
        heights.push(h); if (h > maxH) maxH = h;
    }
    var bump = 0;
    for (var i = 0; i < heights.length - 1; i++) bump += Math.abs(heights[i] - heights[i + 1]);
    return cl * cl * 2 - maxH * 0.5 - holes * 0.8 - bump * 0.2;
};
AI.prototype._random = function() {
    var r = Math.random();
    if (r < 0.2) this.engine.move(-1, 0);
    else if (r < 0.4) this.engine.move(1, 0);
    else if (r < 0.6) this.engine.rotate(1);
    else if (r < 0.85) this.engine.hardDrop();
    else this.engine.holdPiece();
};
AI.prototype.reset = function() { this.engine.reset(); this.alive = true; this.timer = 0; };

/* ── Battle ─────────────────────────────── */
function Battle() {
    this.players = []; this.human = null; this.ais = [];
    this.started = false; this.ended = false; this.rank = 99; this.strategy = 'random';
}
Battle.prototype.init = function(count) {
    this.players = []; this.rank = (count || 50) + 1; this.ended = false;
    var h = { id:'human', name:'Player', isAI:false, engine:new Engine(), alive:true, rank:null, ko:0, badges:0, atkQ:[], lastLines:0, _lastGT:0 };
    this.players.push(h); this.human = h;
    this.ais = [];
    var diffs = ['easy','easy','easy','medium','medium','hard'];
    for (var i = 0; i < (count || 50); i++) {
        var diff = diffs[Math.floor(Math.random() * diffs.length)];
        var ai = new AI(diff);
        var p = { id:'ai_'+i, name:'AI '+(i+1), isAI:true, engine:ai.engine, ai:ai, alive:true, rank:null, ko:0, badges:0, atkQ:[], lastLines:0, diff:diff, _lastGT:0 };
        this.players.push(p); this.ais.push(p);
    }
};
Battle.prototype.start = function() { this.init(50); this.started = true; };
Battle.prototype.update = function(dt) {
    if (!this.started || this.ended) return;
    for (var i = 0; i < this.players.length; i++) {
        var p = this.players[i]; if (!p.alive) continue;
        var prev = p.engine.lines;
        if (p.isAI) { p.ai.update(dt); if (!p.ai.alive || p.engine.gameOver) this._elim(p); }
        else { p.engine.update(dt); if (p.engine.gameOver) this._elim(p); }
        p.lastLines = p.engine.lines - prev;
    }
    this._processAttacks(); this._checkEnd();
};
Battle.prototype._processAttacks = function() {
    for (var i = 0; i < this.players.length; i++) {
        var p = this.players[i]; if (!p.alive || p.lastLines < 2) continue;
        if (p.lastLines < 2 && !p.engine.lastWasTSpin) continue;
        if (Math.random() > 0.35) continue;
        var targets = this._pickTargets(p.id);
        for (var j = 0; j < targets.length; j++) {
            var t = targets[j]; if (!t.alive) continue;
            if (t._lastGT && Date.now() - t._lastGT < 2500) continue;
            t._lastGT = Date.now(); t.atkQ.push({lines: 1, from: p.id});
            t.engine.receiveGarbage(1);
            if (t.engine.gameOver) this._elim(t, p.id);
        }
    }
};
Battle.prototype._pickTargets = function(srcId) {
    var alive = [];
    for (var i = 0; i < this.players.length; i++) if (this.players[i].alive && this.players[i].id !== srcId) alive.push(this.players[i]);
    if (!alive.length) return [];
    var n = Math.min(4, alive.length), s = alive.slice();
    for (var i = s.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i+1)); var t = s[i]; s[i] = s[j]; s[j] = t; }
    return s.slice(0, n);
};
Battle.prototype._height = function(p) {
    var b = p.engine.board;
    for (var y = 0; y < b.length; y++) for (var x = 0; x < b[y].length; x++) if (b[y][x]) return b.length - y;
    return 0;
};
Battle.prototype._elim = function(p, kid) {
    if (!p.alive) return; p.alive = false; p.rank = this.rank--;
    if (kid) { for (var i = 0; i < this.players.length; i++) { if (this.players[i].id === kid && this.players[i].alive) { this.players[i].ko++; this.players[i].badges += p.badges + 1; break; } } }
};
Battle.prototype._checkEnd = function() {
    var c = 0, last = null;
    for (var i = 0; i < this.players.length; i++) { if (this.players[i].alive) { c++; last = this.players[i]; } }
    if (c <= 1) { this.ended = true; if (last) last.rank = 1; }
};
Battle.prototype.getOpponents = function() {
    var out = [], limit = Math.min(this.ais.length, 40);
    for (var i = 0; i < limit; i++) {
        var p = this.ais[i];
        out.push({ id:p.id, rank:p.rank, alive:p.alive, height:this._height(p), engine:p.engine });
    }
    return out;
};

/* ── Main Renderer ──────────────────────── */
function Renderer(cv, nCv, hCv) {
    this.cv = cv; this.ctx = cv.getContext('2d');
    this.nCv = nCv; this.nCtx = nCv.getContext('2d');
    this.hCv = hCv; this.hCtx = hCv.getContext('2d');
    this.cell = 28; this.effects = []; this.tspinFlash = 0;
}
Renderer.prototype.resize = function(eng) {
    var par = this.cv.parentElement;
    var maxW = par ? par.clientWidth - 20 : 400;
    var maxH = window.innerHeight - 140;
    this.cell = Math.floor(Math.min(maxW / eng.W, maxH / eng.H));
    if (this.cell < 16) this.cell = 16;
    if (this.cell > 40) this.cell = 40;
    this.cv.width = eng.W * this.cell;
    this.cv.height = eng.H * this.cell;
};
Renderer.prototype.render = function(eng) {
    var ctx = this.ctx, c = this.cell, W = eng.W, H = eng.H;
    ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 1;
    for (var x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(x*c, 0); ctx.lineTo(x*c, H*c); ctx.stroke(); }
    for (var y = 0; y <= H; y++) { ctx.beginPath(); ctx.moveTo(0, y*c); ctx.lineTo(W*c, y*c); ctx.stroke(); }
    // Placed blocks
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) if (eng.board[y][x]) this._cell(ctx, x, y, eng.board[y][x]);
    // Line flash
    if (eng.lineFlashTimer > 0) {
        var alpha = eng.lineFlashTimer / 300;
        ctx.save(); ctx.globalAlpha = alpha * 0.7; ctx.fillStyle = '#fff';
        for (var i = 0; i < eng.lineFlashRows.length; i++) {
            ctx.fillRect(0, eng.lineFlashRows[i] * c, W * c, c);
        }
        ctx.restore();
    }
    // Ghost
    if (eng.cur) {
        var g = eng.ghost();
        if (g) { var gb = eng._blocks(g); for (var i = 0; i < gb.length; i++) if (gb[i].y >= 0) this._cell(ctx, gb[i].x, gb[i].y, COLORS[g.type], 0.15); }
    }
    // Current
    if (eng.cur) {
        var color = COLORS[eng.cur.type], blocks = eng._blocks(eng.cur);
        for (var i = 0; i < blocks.length; i++) if (blocks[i].y >= 0) this._cell(ctx, blocks[i].x, blocks[i].y, color);
    }
    // Effects
    var now = Date.now(), kept = [];
    for (var i = 0; i < this.effects.length; i++) {
        var e = this.effects[i], age = now - e.t;
        if (age > e.d) continue; kept.push(e);
        ctx.save(); ctx.globalAlpha = 1 - age / e.d;
        ctx.fillStyle = e.color || '#fff'; ctx.font = 'bold 20px -apple-system, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(e.text, this.cv.width / 2, 60 - (age / e.d) * 40);
        ctx.restore();
    }
    this.effects = kept;
    // T-Spin flash
    if (this.tspinFlash > 0) {
        this.tspinFlash -= 16;
        ctx.save(); ctx.globalAlpha = this.tspinFlash / 500;
        ctx.fillStyle = '#bf5af2'; ctx.fillRect(0, 0, W * c, H * c);
        ctx.restore();
    }
};
Renderer.prototype._cell = function(ctx, x, y, color, alpha) {
    var c = this.cell, px = x * c, py = y * c, ins = 1, r = Math.min(5, c / 4);
    ctx.save(); if (alpha) ctx.globalAlpha = alpha;
    // Rounded rect
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(px+r+ins, py+ins); ctx.lineTo(px+c-r-ins, py+ins);
    ctx.quadraticCurveTo(px+c-ins, py+ins, px+c-ins, py+r+ins);
    ctx.lineTo(px+c-ins, py+c-r-ins);
    ctx.quadraticCurveTo(px+c-ins, py+c-ins, px+c-r-ins, py+c-ins);
    ctx.lineTo(px+r+ins, py+c-ins);
    ctx.quadraticCurveTo(px+ins, py+c-ins, px+ins, py+c-r-ins);
    ctx.lineTo(px+ins, py+r+ins);
    ctx.quadraticCurveTo(px+ins, py+ins, px+r+ins, py+ins);
    ctx.closePath(); ctx.fill();
    // Glass highlight (top half)
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(px+r+ins, py+ins); ctx.lineTo(px+c-r-ins, py+ins);
    ctx.quadraticCurveTo(px+c-ins, py+ins, px+c-ins, py+r+ins);
    ctx.lineTo(px+c-ins, py+c*0.4); ctx.lineTo(px+ins, py+c*0.4);
    ctx.lineTo(px+ins, py+r+ins);
    ctx.quadraticCurveTo(px+ins, py+ins, px+r+ins, py+ins);
    ctx.closePath(); ctx.fill();
    ctx.restore();
};
Renderer.prototype.renderPreview = function(ctx, cvs, piece) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, 0, cvs.width, cvs.height);
    if (!piece) return;
    var shape = SHAPES[piece.type][0], cs = Math.min(cvs.width / 5, cvs.height / 5);
    var ox = (cvs.width - 4 * cs) / 2, oy = (cvs.height - 4 * cs) / 2;
    var color = COLORS[piece.type];
    for (var r = 0; r < 4; r++) for (var c2 = 0; c2 < 4; c2++) {
        if (!shape[r][c2]) continue;
        var px = ox + c2 * cs, py = oy + r * cs, rr = 3;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(px+rr+1, py+1); ctx.lineTo(px+cs-rr-1, py+1);
        ctx.quadraticCurveTo(px+cs-1, py+1, px+cs-1, py+rr+1);
        ctx.lineTo(px+cs-1, py+cs-rr-1);
        ctx.quadraticCurveTo(px+cs-1, py+cs-1, px+cs-rr-1, py+cs-1);
        ctx.lineTo(px+rr+1, py+cs-1);
        ctx.quadraticCurveTo(px+1, py+cs-1, px+1, py+cs-rr-1);
        ctx.lineTo(px+1, py+rr+1);
        ctx.quadraticCurveTo(px+1, py+1, px+rr+1, py+1);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(px+2, py+2, cs-4, cs*0.35);
    }
};
Renderer.prototype.addEffect = function(text, color) {
    this.effects.push({ text: text, color: color || '#fff', t: Date.now(), d: 800 });
};

/* ── Opponents View (real mini boards) ──── */
function OpponentsView(el) {
    this.el = el; this.cards = {}; this.renderIdx = 0;
}
OpponentsView.prototype.update = function(opps, frame) {
    // Only render a batch each frame for performance
    var batchSize = 8;
    var start = (this.renderIdx * batchSize) % opps.length;
    for (var i = 0; i < opps.length; i++) {
        var o = opps[i];
        if (!this.cards[o.id]) {
            var card = document.createElement('div');
            card.className = 'opponent-card';
            var cvs = document.createElement('canvas');
            cvs.width = 50; cvs.height = 100;
            card.appendChild(cvs);
            this.el.appendChild(card);
            this.cards[o.id] = { el: card, ctx: cvs.getContext('2d'), cvs: cvs };
        }
        // Update class
        var c = this.cards[o.id];
        c.el.className = 'opponent-card' + (!o.alive ? ' eliminated' : '');
        // Only render mini board for batch
        if (i >= start && i < start + batchSize && o.alive && o.engine) {
            this._renderMini(c.ctx, o.engine, 50, 100);
        }
    }
    this.renderIdx++;
};
OpponentsView.prototype._renderMini = function(ctx, eng, w, h) {
    ctx.fillStyle = 'rgba(5,5,15,0.9)'; ctx.fillRect(0, 0, w, h);
    var cs = Math.min(w / eng.W, h / eng.H);
    var ox = (w - eng.W * cs) / 2;
    // Draw placed blocks (bottom portion only for performance)
    var startRow = Math.max(0, eng.H - 15);
    for (var y = startRow; y < eng.H; y++) {
        for (var x = 0; x < eng.W; x++) {
            if (eng.board[y][x]) {
                ctx.fillStyle = eng.board[y][x];
                ctx.fillRect(ox + x * cs, (y - startRow) * cs, cs - 0.5, cs - 0.5);
            }
        }
    }
    // Draw current piece
    if (eng.cur) {
        var blocks = eng._blocks(eng.cur);
        ctx.fillStyle = COLORS[eng.cur.type];
        for (var i = 0; i < blocks.length; i++) {
            var b = blocks[i];
            if (b.y >= startRow && b.y < eng.H) {
                ctx.fillRect(ox + b.x * cs, (b.y - startRow) * cs, cs - 0.5, cs - 0.5);
            }
        }
    }
};

/* ── Toast ──────────────────────────────── */
function toast(msg) {
    var el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg; el.classList.remove('show'); void el.offsetWidth;
    el.classList.add('show'); clearTimeout(el._t);
    el._t = setTimeout(function() { el.classList.remove('show'); }, 2500);
}

/* ── Game ───────────────────────────────── */
function Game() {
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
    this.running = false; this.lastTime = 0; this.keys = {}; this.keyTimers = {};
    this.startTime = 0; this.frame = 0;
    this._setup(); this._showStart(); this._loop(performance.now());
}
Game.prototype._setup = function() {
    var self = this;
    document.addEventListener('keydown', function(e) { self._keyDown(e); });
    document.addEventListener('keyup', function(e) { self._keyUp(e); });
    window.addEventListener('keydown', function(e) {
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key) >= 0) e.preventDefault();
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
            });
        })(btns[i]);
    }
    window.addEventListener('resize', function() { if (self.battle.human) self.renderer.resize(self.battle.human.engine); });
};
Game.prototype._showStart = function() {
    this.oTitle.textContent = 'TETRIS 99';
    this.oMsg.textContent = '50 人对战 · Liquid Glass 风格\n点击开始或按空格键';
    this.oStats.textContent = '';
    this.startBtn.textContent = '开始游戏';
    this.overlay.classList.remove('hidden');
};
Game.prototype._start = function() {
    this.battle.start(); this.running = true; this.startTime = Date.now();
    this.overlay.classList.add('hidden');
    this.renderer.resize(this.battle.human.engine);
};
Game.prototype._keyDown = function(e) {
    if (!this.running) { if (e.key === ' ' || e.key === 'Enter') this._start(); return; }
    var eng = this.battle.human.engine;
    switch (e.key) {
        case 'ArrowLeft': eng.move(-1, 0); this._setRepeat('ArrowLeft', function() { eng.move(-1, 0); }); break;
        case 'ArrowRight': eng.move(1, 0); this._setRepeat('ArrowRight', function() { eng.move(1, 0); }); break;
        case 'ArrowDown': if (eng.softDrop()) eng.score++; this._setRepeat('ArrowDown', function() { if (eng.softDrop()) eng.score++; }); break;
        case 'ArrowUp': case 'x': case 'X': eng.rotate(1); break;
        case 'z': case 'Z': eng.rotate(-1); break;
        case ' ': var d = eng.hardDrop(); if (d) this.renderer.addEffect('+' + d * 2, '#0a84ff'); break;
        case 'c': case 'C': eng.holdPiece(); break;
    }
};
Game.prototype._keyUp = function(e) {
    this.keys[e.key] = false;
    if (this.keyTimers[e.key]) { clearInterval(this.keyTimers[e.key]); delete this.keyTimers[e.key]; }
};
Game.prototype._setRepeat = function(key, fn) {
    if (this.keyTimers[key]) return; this.keys[key] = true; var self = this;
    setTimeout(function() { if (self.keys[key]) self.keyTimers[key] = setInterval(function() { if (self.keys[key]) fn(); else { clearInterval(self.keyTimers[key]); delete self.keyTimers[key]; } }, 50); }, 170);
};
Game.prototype._loop = function(now) {
    var dt = now - this.lastTime; this.lastTime = now;
    if (dt > 100) dt = 16; this.frame++;

    if (this.running && !this.battle.ended) {
        this.battle.update(dt);
        var h = this.battle.human;
        // Stats
        var alive = 0;
        for (var i = 0; i < this.battle.players.length; i++) if (this.battle.players[i].alive) alive++;
        document.getElementById('stat-rank').textContent = h.alive ? alive : h.rank;
        document.getElementById('stat-ko').textContent = h.ko;
        document.getElementById('stat-score').textContent = h.engine.score.toLocaleString();
        // Combo
        var comboEl = document.getElementById('comboDisplay');
        comboEl.textContent = h.engine.combo;
        if (h.engine.combo > 0) { comboEl.classList.add('bump'); setTimeout(function() { comboEl.classList.remove('bump'); }, 150); }
        // T-Spin effect (only trigger once per clear)
        if (h.engine.lastWasTSpin && h.engine.lastClear > 0 && !this._tspinShown) {
            this.renderer.tspinFlash = 400;
            this.renderer.addEffect('T-SPIN!', '#bf5af2');
            this._tspinShown = true;
        }
        if (h.engine.lastClear === 0) this._tspinShown = false;
        // Attack queue
        var aq = document.getElementById('attackQueue');
        if (this._lastAtk !== h.atkQ.length) {
            this._lastAtk = h.atkQ.length; aq.innerHTML = '';
            for (var j = 0; j < Math.min(h.atkQ.length, 8); j++) { var bar = document.createElement('div'); bar.className = 'atk-bar'; aq.appendChild(bar); }
        }
        // Opponents (batch render)
        if (this.frame % 3 === 0) this.oppView.update(this.battle.getOpponents(), this.frame);
        // Preview
        this.renderer.renderPreview(this.renderer.nCtx, this.nCv, h.engine.next ? {type: h.engine.next.type} : null);
        this.renderer.renderPreview(this.renderer.hCtx, this.hCv, h.engine.hold ? {type: h.engine.hold} : null);
        if (this.battle.ended) { this.running = false; this._showEnd(); }
    }
    if (this.battle.human) this.renderer.render(this.battle.human.engine);
    var self = this;
    requestAnimationFrame(function(t) { self._loop(t); });
};
Game.prototype._showEnd = function() {
    var h = this.battle.human;
    if (h.alive) { this.oTitle.textContent = '胜利！'; this.oMsg.textContent = '你是最后的赢家！'; }
    else { this.oTitle.textContent = '游戏结束'; this.oMsg.textContent = '排名: 第 ' + h.rank + ' 名'; }
    var elapsed = Date.now() - this.startTime, min = Math.floor(elapsed / 60000), sec = Math.floor((elapsed % 60000) / 1000);
    this.oStats.innerHTML = 'KO: ' + h.ko + ' · 清行: ' + h.engine.lines + '<br>分数: ' + h.engine.score.toLocaleString() + ' · 时间: ' + min + ':' + (sec < 10 ? '0' : '') + sec;
    this.startBtn.textContent = '再来一局';
    this.overlay.classList.remove('hidden');
};

/* ── Boot ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() { window.game = new Game(); });
