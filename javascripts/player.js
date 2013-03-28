function Player(world, map) {
  this.world = world;
  this.map = map;
  this.isPlayer = true;
  this.speed = 5;
}

Player.prototype = new Mob();

Player.prototype.update = function(delta, mobs) {
  this.alignToVelocity();
}
