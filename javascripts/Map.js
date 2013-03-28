var b2Vec2 = Box2D.Common.Math.b2Vec2
  , b2BodyDef = Box2D.Dynamics.b2BodyDef
  , b2Body = Box2D.Dynamics.b2Body
  , b2FixtureDef = Box2D.Dynamics.b2FixtureDef
  , b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef
  , b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape

function Map(world, mapWidth, mapHeight) {
  this.world = world;
  this.mapWidth = mapWidth || 20;
  this.mapHeight = mapHeight || 20;
  this.cells = {
    WALL: 0,
    CORRIDOR: 1,
    ROOM: 2,
    DOOR: 3,
    ENTRANCE: 4,
    EXIT: 5
  };

  var r = dungCarv({
    mapWidth: this.mapWidth,
    mapHeight: this.mapHeight,
    padding: 1,
    randomness: 10 / 100.0,
    twistness: 20 / 100.0,
    rooms: 25 / 100.0,
    roomSize: [
      { min: 4, max: 10, prob: 1 } 
    ],
    roomRound: false,
    loops: 0 / 100.0,
    spaces: 0,
    loopSpaceRepeat: 2,
    eraseRoomDeadEnds: true,
    spacesBeforeLoops: false
  });

  for (var i in r.map) {
    if (r.map[i] == this.cells.ENTRANCE)  {
      this.startX = i % this.mapWidth;
      this.startY = Math.floor(i / this.mapHeight);
    }
  }

  this.map = r.map;
}

Map.prototype.createTiles = function() {
  var i;
  for (i = 0; i < this.map.length; i++) {
    this.createTile(i);
  }
}

Map.prototype.getStartingPosition = function() {
  return this.startY * this.mapWidth + this.startX;
}

Map.prototype.positionToXY = function(idx) {
  var xy = { x: idx % this.mapWidth
           , y: Math.floor(idx / this.mapWidth) };

  return xy;
}

Map.prototype.getStartingPositionXY = function() {
  return this.positionToXY(this.getStartingPosition());
}

Map.prototype.getRandomSpawnXY = function() {
  var that = this;

  getRandomPosition = function() {
    var x = Math.floor(Math.random() * that.mapWidth)
      , y = Math.floor(Math.random() * that.mapHeight)
      , pos = y * that.mapHeight + x;

    if (that.map[pos] == that.cells.CORRIDOR) {
      return { x: x, y: y };
    } else {
      return getRandomPosition();
    }
  }

  return getRandomPosition();
}

Map.prototype.createTile = function(pos) {
  var xy = this.positionToXY(pos)
    , tile = this.map[pos]
    , fixDef
    , bodyDef

  if (tile != this.cells.WALL) return;

  fixDef = new b2FixtureDef;
  fixDef.density = 1.0;
  fixDef.friction = 0.5;
  fixDef.restitution = 0.2;

  fixDef.shape = new b2PolygonShape;
  fixDef.shape.SetAsBox(0.5, 0.5);

  bodyDef = new b2BodyDef;
  bodyDef.type = b2Body.b2_staticBody;
  bodyDef.position.x = xy.x + 0.5;
  bodyDef.position.y = xy.y + 0.5;

  this.world.CreateBody(bodyDef).CreateFixture(fixDef);
}
