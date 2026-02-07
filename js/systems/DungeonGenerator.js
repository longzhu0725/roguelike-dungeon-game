/**
 * Random Walker 地牢生成器
 * 使用随机游走算法生成由图块组成的地牢地图
 */

class DungeonGenerator {
    constructor(width, height, tileSize) {
        this.width = width;           // 地图宽度（图块数）
        this.height = height;         // 地图高度（图块数）
        this.tileSize = tileSize;     // 单个图块大小（像素）
        
        // 地牢生成参数
        this.roomCount = 20;          // 房间数量（增加）
        this.roomMinSize = 5;         // 房间最小尺寸（增大）
        this.roomMaxSize = 10;        // 房间最大尺寸（增大）
        this.extraCorridorChance = 0.5; // 额外走廊概率（增加）
        this.corridorWidth = 2;       // 走廊宽度（新增，默认2格）
        
        // 地图数据: 0=墙壁, 1=地板, 2=走廊
        this.map = [];
        
        // 生成的房间列表
        this.rooms = [];
        
        // 玩家起始位置
        this.playerStartPos = { x: 0, y: 0 };
    }
    
    /**
     * 生成地牢地图的主方法
     * @returns {Object} 包含地图数据、房间列表、玩家起始位置
     */
    generate() {
        this.initializeMap();
        this.generateRooms();
        this.connectRooms();
        this.placePlayerStart();
        
        return {
            map: this.map,
            rooms: this.rooms,
            playerStart: this.playerStartPos,
            width: this.width,
            height: this.height,
            tileSize: this.tileSize
        };
    }
    
    /**
     * 初始化地图：全部填充为墙壁
     */
    initializeMap() {
        this.map = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(0); // 0 = 墙壁
            }
            this.map.push(row);
        }
        this.rooms = [];
    }
    
    /**
     * 生成房间：使用随机游走算法
     */
    generateRooms() {
        let attempts = 0;
        const maxAttempts = this.roomCount * 50;
        
        while (this.rooms.length < this.roomCount && attempts < maxAttempts) {
            attempts++;
            
            // 随机生成房间尺寸和位置
            const roomWidth = Phaser.Math.Between(this.roomMinSize, this.roomMaxSize);
            const roomHeight = Phaser.Math.Between(this.roomMinSize, this.roomMaxSize);
            const roomX = Phaser.Math.Between(1, this.width - roomWidth - 1);
            const roomY = Phaser.Math.Between(1, this.height - roomHeight - 1);
            
            const newRoom = {
                x: roomX,
                y: roomY,
                width: roomWidth,
                height: roomHeight,
                centerX: Math.floor(roomX + roomWidth / 2),
                centerY: Math.floor(roomY + roomHeight / 2)
            };
            
            // 检查房间是否重叠
            if (this.isRoomValid(newRoom)) {
                this.createRoom(newRoom);
                this.rooms.push(newRoom);
            }
        }
        
        console.log(`生成了 ${this.rooms.length} 个房间（目标: ${this.roomCount}）`);
    }
    
    /**
     * 检查房间是否有效（不与其他房间重叠）
     */
    isRoomValid(room) {
        const padding = 0; // 房间之间的最小间距（减少为0，允许房间相邻）
        
        for (let existingRoom of this.rooms) {
            if (
                room.x - padding < existingRoom.x + existingRoom.width + padding &&
                room.x + room.width + padding > existingRoom.x - padding &&
                room.y - padding < existingRoom.y + existingRoom.height + padding &&
                room.y + room.height + padding > existingRoom.y - padding
            ) {
                return false; // 重叠
            }
        }
        return true;
    }
    
    /**
     * 在地图上创建房间（将墙壁变为地板）
     */
    createRoom(room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                this.map[y][x] = 1; // 1 = 地板
            }
        }
    }
    
    /**
     * 连接房间：使用L形走廊连接每个房间到前一个房间
     */
    connectRooms() {
        for (let i = 1; i < this.rooms.length; i++) {
            const currentRoom = this.rooms[i];
            const prevRoom = this.rooms[i - 1];
            
            // 随机选择先水平后垂直，或先垂直后水平
            if (Math.random() < 0.5) {
                this.createHorizontalCorridor(prevRoom.centerX, currentRoom.centerX, prevRoom.centerY);
                this.createVerticalCorridor(prevRoom.centerY, currentRoom.centerY, currentRoom.centerX);
            } else {
                this.createVerticalCorridor(prevRoom.centerY, currentRoom.centerY, prevRoom.centerX);
                this.createHorizontalCorridor(prevRoom.centerX, currentRoom.centerX, currentRoom.centerY);
            }
        }
        
        // 额外连接：随机添加一些房间之间的额外走廊
        for (let i = 2; i < this.rooms.length; i++) {
            if (Math.random() < this.extraCorridorChance) {
                const roomA = this.rooms[i];
                const roomB = this.rooms[Phaser.Math.Between(0, i - 2)];
                
                if (Math.random() < 0.5) {
                    this.createHorizontalCorridor(roomA.centerX, roomB.centerX, roomA.centerY);
                    this.createVerticalCorridor(roomA.centerY, roomB.centerY, roomB.centerX);
                } else {
                    this.createVerticalCorridor(roomA.centerY, roomB.centerY, roomA.centerX);
                    this.createHorizontalCorridor(roomA.centerX, roomB.centerX, roomB.centerY);
                }
            }
        }
    }
    
    /**
     * 创建水平走廊
     */
    createHorizontalCorridor(x1, x2, y) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const halfWidth = Math.floor(this.corridorWidth / 2);
        
        for (let x = minX; x <= maxX; x++) {
            for (let w = -halfWidth; w <= halfWidth; w++) {
                const corridorY = y + w;
                if (corridorY >= 0 && corridorY < this.height && x >= 0 && x < this.width) {
                    this.map[corridorY][x] = this.map[corridorY][x] === 0 ? 2 : this.map[corridorY][x]; // 2 = 走廊
                }
            }
        }
    }
    
    /**
     * 创建垂直走廊
     */
    createVerticalCorridor(y1, y2, x) {
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        const halfWidth = Math.floor(this.corridorWidth / 2);
        
        for (let y = minY; y <= maxY; y++) {
            for (let w = -halfWidth; w <= halfWidth; w++) {
                const corridorX = x + w;
                if (y >= 0 && y < this.height && corridorX >= 0 && corridorX < this.width) {
                    this.map[y][corridorX] = this.map[y][corridorX] === 0 ? 2 : this.map[y][corridorX]; // 2 = 走廊
                }
            }
        }
    }
    
    /**
     * 设置玩家起始位置（第一个房间的中心）
     */
    placePlayerStart() {
        if (this.rooms.length > 0) {
            const startRoom = this.rooms[0];
            this.playerStartPos = {
                x: (startRoom.centerX + 0.5) * this.tileSize,
                y: (startRoom.centerY + 0.5) * this.tileSize
            };
        }
    }
    
    /**
     * 获取随机空位（用于生成敌人或物品）
     */
    getRandomEmptyPosition() {
        if (this.rooms.length < 2) return null;
        
        // 选择除第一个房间外的随机房间
        const randomRoom = this.rooms[Phaser.Math.Between(1, this.rooms.length - 1)];
        
        return {
            x: (randomRoom.centerX + Phaser.Math.Between(-1, 1)) * this.tileSize + this.tileSize / 2,
            y: (randomRoom.centerY + Phaser.Math.Between(-1, 1)) * this.tileSize + this.tileSize / 2
        };
    }
    
    /**
     * 调试：打印地图到控制台
     */
    debugPrint() {
        let output = '';
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.map[y][x];
                if (tile === 0) output += '#';
                else if (tile === 1) output += '.';
                else if (tile === 2) output += '+';
            }
            output += '\n';
        }
        console.log(output);
    }
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DungeonGenerator;
}
