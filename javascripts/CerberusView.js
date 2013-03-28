CerberusView = function(instance, scene, cerberus, mapView) {
  this.instance = instance;
  this.scene = scene;
  this.cerberus = cerberus;
  this.mapView = mapView;
  this.animation = undefined;

  this.setAnimation('CIdle');
  this.tmpQuaternion = new THREE.Quaternion();

  this.scene.addChildObject(instance);

  cerberus.view = this;
}

CerberusView.prototype.update = function(delta) {
  var position = this.cerberus.body.GetPosition()
    , angle = this.cerberus.body.GetAngle();

  this.mapView.translateToMapPosition(this.instance.threeData, position.x, position.y);

  this.tmpQuaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), -(Math.PI / 2));
  this.instance.threeData.quaternion.copy(this.tmpQuaternion);
  this.tmpQuaternion.setFromAxisAngle(new THREE.Vector3(0,0,-1), angle - (Math.PI / 2));
  this.instance.threeData.quaternion.multiply(this.tmpQuaternion);

  if (this.cerberus.body.GetLinearVelocity().Length() > 0.1) {
    this.setAnimation('CWalk');
  } else {
    this.setAnimation('CIdle');
  }
}

CerberusView.prototype.setAnimation = function(animation) {
  var that = this;
  if (this.animation != animation) {
    console.log('Setting animation', animation);

    this.instance.traverse(function(obj) {
      if (obj instanceof SkinnedMeshObject) {

        that.animation = animation;

        obj.set('payload.animationState', 'pause');
        obj.set('payload.animationName', animation);
        obj.set('payload.animationState', 'play');
      }
    });
  }
}
