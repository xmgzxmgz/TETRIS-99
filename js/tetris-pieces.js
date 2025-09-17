/**
 * 俄罗斯方块形状定义和相关工具函数
 * 包含7种经典方块形状及其旋转状态
 */

// 方块颜色定义
const PIECE_COLORS = {
    I: '#00ffff', // 青色
    O: '#ffff00', // 黄色
    T: '#800080', // 紫色
    S: '#00ff00', // 绿色
    Z: '#ff0000', // 红色
    J: '#0000ff', // 蓝色
    L: '#ffa500'  // 橙色
};

// 方块形状定义 (4x4网格，0表示空，1表示有方块)
const PIECE_SHAPES = {
    I: [
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],
    O: [
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ]
    ],
    T: [
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 1, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],
    S: [
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 1, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],
    Z: [
        [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 1, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [1, 0, 0, 0]
        ]
    ],
    J: [
        [
            [0, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 1, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0]
        ]
    ],
    L: [
        [
            [0, 0, 0, 0],
            [0, 0, 1, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [1, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ]
};

/**
 * 方块类 - 表示一个俄罗斯方块
 */
class TetrisPiece {
    /**
     * 构造函数
     * @param {string} type - 方块类型 (I, O, T, S, Z, J, L)
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    constructor(type, x = 3, y = 0) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.color = PIECE_COLORS[type];
        this.shape = PIECE_SHAPES[type];
    }

    /**
     * 获取当前旋转状态的形状
     * @returns {Array} 4x4的二维数组
     */
    getCurrentShape() {
        return this.shape[this.rotation];
    }

    /**
     * 旋转方块
     * @param {number} direction - 旋转方向 (1为顺时针，-1为逆时针)
     */
    rotate(direction = 1) {
        const newRotation = (this.rotation + direction + this.shape.length) % this.shape.length;
        this.rotation = newRotation;
    }

    /**
     * 移动方块
     * @param {number} dx - X方向移动距离
     * @param {number} dy - Y方向移动距离
     */
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    /**
     * 获取方块占用的所有坐标
     * @returns {Array} 坐标数组 [{x, y}, ...]
     */
    getBlocks() {
        const blocks = [];
        const shape = this.getCurrentShape();
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (shape[row][col]) {
                    blocks.push({
                        x: this.x + col,
                        y: this.y + row
                    });
                }
            }
        }
        
        return blocks;
    }

    /**
     * 复制方块
     * @returns {TetrisPiece} 新的方块实例
     */
    clone() {
        const piece = new TetrisPiece(this.type, this.x, this.y);
        piece.rotation = this.rotation;
        return piece;
    }

    /**
     * 检查是否为T-Spin
     * @param {Array} board - 游戏板状态
     * @returns {boolean} 是否为T-Spin
     */
    isTSpin(board) {
        if (this.type !== 'T') return false;
        
        // 检查T方块周围的角落是否被占用
        const corners = [
            {x: this.x, y: this.y},
            {x: this.x + 2, y: this.y},
            {x: this.x, y: this.y + 2},
            {x: this.x + 2, y: this.y + 2}
        ];
        
        let occupiedCorners = 0;
        corners.forEach(corner => {
            if (corner.x < 0 || corner.x >= 10 || corner.y < 0 || corner.y >= 20 ||
                (board[corner.y] && board[corner.y][corner.x])) {
                occupiedCorners++;
            }
        });
        
        return occupiedCorners >= 3;
    }
}

/**
 * 方块生成器 - 使用7-bag随机算法
 */
class PieceGenerator {
    constructor() {
        this.bag = [];
        this.refillBag();
    }

    /**
     * 重新填充方块袋
     */
    refillBag() {
        const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        this.bag = [...pieces];
        
        // Fisher-Yates洗牌算法
        for (let i = this.bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
    }

    /**
     * 获取下一个方块
     * @returns {TetrisPiece} 新的方块实例
     */
    getNext() {
        if (this.bag.length === 0) {
            this.refillBag();
        }
        
        const type = this.bag.pop();
        return new TetrisPiece(type);
    }

    /**
     * 预览接下来的几个方块
     * @param {number} count - 预览数量
     * @returns {Array} 方块类型数组
     */
    preview(count = 5) {
        const preview = [];
        const tempBag = [...this.bag];
        
        for (let i = 0; i < count; i++) {
            if (tempBag.length === 0) {
                const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
                tempBag.push(...pieces);
                
                // 洗牌
                for (let j = tempBag.length - 1; j > 0; j--) {
                    const k = Math.floor(Math.random() * (j + 1));
                    [tempBag[j], tempBag[k]] = [tempBag[k], tempBag[j]];
                }
            }
            
            preview.push(tempBag.pop());
        }
        
        return preview;
    }
}

/**
 * 踢墙数据 - 用于SRS旋转系统
 */
const WALL_KICK_DATA = {
    'JLSTZ': {
        '0->1': [[-1, 0], [-1, 1], [0, -2], [-1, -2]],
        '1->0': [[1, 0], [1, -1], [0, 2], [1, 2]],
        '1->2': [[1, 0], [1, -1], [0, 2], [1, 2]],
        '2->1': [[-1, 0], [-1, 1], [0, -2], [-1, -2]],
        '2->3': [[1, 0], [1, 1], [0, -2], [1, -2]],
        '3->2': [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '3->0': [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '0->3': [[1, 0], [1, 1], [0, -2], [1, -2]]
    },
    'I': {
        '0->1': [[-2, 0], [1, 0], [-2, -1], [1, 2]],
        '1->0': [[2, 0], [-1, 0], [2, 1], [-1, -2]],
        '1->2': [[-1, 0], [2, 0], [-1, 2], [2, -1]],
        '2->1': [[1, 0], [-2, 0], [1, -2], [-2, 1]],
        '2->3': [[2, 0], [-1, 0], [2, 1], [-1, -2]],
        '3->2': [[-2, 0], [1, 0], [-2, -1], [1, 2]],
        '3->0': [[1, 0], [-2, 0], [1, -2], [-2, 1]],
        '0->3': [[-1, 0], [2, 0], [-1, 2], [2, -1]]
    }
};

/**
 * 获取踢墙测试数据
 * @param {string} pieceType - 方块类型
 * @param {number} fromRotation - 原旋转状态
 * @param {number} toRotation - 目标旋转状态
 * @returns {Array} 踢墙测试偏移量数组
 */
function getWallKickData(pieceType, fromRotation, toRotation) {
    if (pieceType === 'O') return [[0, 0]]; // O方块不需要踢墙
    
    const key = `${fromRotation}->${toRotation}`;
    const dataKey = pieceType === 'I' ? 'I' : 'JLSTZ';
    
    return [[0, 0], ...(WALL_KICK_DATA[dataKey][key] || [])];
}