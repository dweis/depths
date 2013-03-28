function Mob(world, map, opts) {
  this.world = world;
  this.map = map;
  this.isPlayer = false;
  this.speed = 5;
}

Mob.prototype.alignToVelocity = function() {
  var velocity = this.body.GetLinearVelocity()
    , angle;

  if (velocity.x == 0) {
      angle = velocity.y > 0 ? 0 : Math.PI;
  } else if(velocity.y == 0) {
      angle = velocity.x > 0 ? Math.PI/2 : 3 * Math.PI/2;
  } else {
      angle = Math.atan(velocity.y / velocity.x) + Math.PI/2;
  }

  if (velocity.x > 0) {
      angle += Math.PI;
  }

  this.body.SetAngle(angle + Math.PI/2);
}

Mob.prototype.createBody = function(position) {
  var fixDef, bodyDef

  console.log(position);

  fixDef = new b2FixtureDef;
  fixDef.density = 1.0;
  fixDef.friction = 0.5;
  fixDef.restitution = 0.2;

  fixDef.shape = new b2CircleShape(0.25);

  bodyDef = new b2BodyDef;
  bodyDef.type = b2Body.b2_dynamicBody;
  bodyDef.position.x = position.x + 0.5;
  bodyDef.position.y = position.y + 0.5;

  this.body = this.world.CreateBody(bodyDef);

  this.body.CreateFixture(fixDef);

  this.createMouseJoint();
}

Mob.prototype.createMouseJoint = function() {
  var position = this.body.GetPosition();

  var md = new b2MouseJointDef();
  md.maxForce = 100 * this.speed * this.body.GetMass();
  md.frequencyHz = 60;
  md.dampingRatio = 25 * (10 - this.speed);
  md.collideConnected = true;

  md.bodyA = this.world.GetGroundBody();
  md.bodyB = this.body;
  md.target.Set(position.x, position.y);
  this.mouseJoint = this.world.CreateJoint(md);
  this.body.SetAwake(true);
}

Mob.prototype.setTarget = function(x, y) {
  this.mouseJoint.SetTarget(new b2Vec2(x, y));
}
