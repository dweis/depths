function Player(world, map) {
  this.world = world;
  this.map = map;
  this.isPlayer = true;
  this.speed = 5;
  this.status = 'idle';
}

Player.prototype = new Mob();

Player.prototype.update = function(delta, mobs) {
  this.alignToVelocity();

  if (this.status != 'attack') {
    if (this.body.GetLinearVelocity().Length() > 0.1) {
      this.status = 'walk';
    } else {
      this.status = 'idle'
    }
  }
}

Player.prototype.attack = function() {
  this.status = 'attack';
}
