function Cerberus(world, map) {
  this.world = world;
  this.map = map;
  this.isPlayer = false;
  this.speed = 0.5;
}

Cerberus.prototype = new Mob();

Cerberus.prototype.update = function(delta, mobs) {
  var i, distance;

  for (i = 0; i < mobs.length; i++) {
    if (mobs[i].isPlayer) {
      distance = b2Math.SubtractVV(mobs[i].body.GetPosition(), this.body.GetPosition()).Length();

      if (distance < 5) {
        this.isActive = true;
        this.setTarget(mobs[i].body.GetPosition().x, mobs[i].body.GetPosition().y);
        this.alignToVelocity();
      } else {
        if (this.isActive) {
          this.setTarget(this.body.GetPosition().x, this.body.GetPosition().y);
          this.isActive = false;
        }
      }
    }
  }
}


