var b2Vec2 = Box2D.Common.Math.b2Vec2
  , b2Math = Box2D.Common.Math.b2Math
  , b2BodyDef = Box2D.Dynamics.b2BodyDef
  , b2Body = Box2D.Dynamics.b2Body
  , b2FixtureDef = Box2D.Dynamics.b2FixtureDef
  , b2Fixture = Box2D.Dynamics.b2Fixture
  , b2World = Box2D.Dynamics.b2World
  , b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef
  , b2MassData = Box2D.Collision.Shapes.b2MassData
  , b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
  , b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
  , b2AABB = Box2D.Collision.b2AABB
  , b2DebugDraw = Box2D.Dynamics.b2DebugDraw
  , world;

function getBodyAtMouse(mouseX, mouseY) {
  var mousePVec = new b2Vec2(mouseX, mouseY);
  var aabb = new b2AABB();
  aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001);
  aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001);
  // Query the world for overlapping shapes.
  selectedBody = null;
  world.QueryAABB(function(fixture) {
    if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
      if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
        selectedBody = fixture.GetBody();
        return false;
      }
    }
    return true;
  }, aabb);
  return selectedBody;
}

function createMonsters(world, map, mobs) {
  var i, spawnXY, mob;

  for (i = 0; i < 10; i++) {
    mob = new Cerberus(world, map);
    mob.createBody(map.getRandomSpawnXY());

    mobs.push(mob);
  }
}

function init() {
  var map, mobs = [], player;

  world = new b2World(new b2Vec2(0, 0), true);

  map = new Map(world, 18, 18);
  map.createTiles();
  createMonsters(world, map, mobs);

  player = new Player(world, map);
  player.createBody(map.getStartingPositionXY());
  mobs.push(player);

  //setup debug draw
  var debugDraw = new b2DebugDraw();
  debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
  debugDraw.SetDrawScale(512/map.mapWidth);
  debugDraw.SetFillAlpha(0.3);
  debugDraw.SetLineThickness(1.0);
  debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
  world.SetDebugDraw(debugDraw);
  window.setInterval(update, 1000 / 60);

  var canvasWidth = $('canvas').width()
    , canvasHeight = $('canvas').height();

  function mouseup(e) {
    var x = e.clientX / (canvasWidth/map.mapWidth)
      , y = e.clientY / (canvasHeight/map.mapHeight)
      , body;

    if (body = getBodyAtMouse(x, y)) {
      console.log(body);
    } else {
      player.setTarget(x, y);
    }
  }

  document.addEventListener('touchup', function(e) {
    var touches = event.changedTouches, first = touches[0];

    event.preventDefault();

    mouseup({ clientX: first.clientX, clientY: first.clientY });
  });

  $('canvas').mouseup(mouseup);

  setInterval(function() {
    var i;
    for (i = 0; i < mobs.length; i++) {
      mobs[i].update(1000/60, mobs);
    }
  }, 1000/60);
};

function update() {
   world.Step(
         1 / 60   //frame-rate
      ,  1       //velocity iterations
      ,  1       //position iterations
   );
   world.DrawDebugData();
   world.ClearForces();
};

$(function() {
  init();
});
