PlayerView = function(model, scene, player, mapView) {
  this.model = model;
  //this.inputHandler = inputHandler;
  this.target = new THREE.Vector3();
  this.player = player;
  this.mapView = mapView;

  this.setAnimation('Idle');

  this.tmpQuaternion = new THREE.Quaternion();

  this.model.threeData.scale = new THREE.Vector3(0.025, 0.025, 0.025);
  this.model.threeData.position.y = 0.25;

  var light = new THREE.PointLight( 0xFFFFFF, 1.5, 5 );
  light.position.set( 0, 0.5, -0.5);

  this.object = new THREE.Object3D();
  this.object.useQuaternion = true;
  this.object.position = new THREE.Vector3(0,0,0);
  this.object.add(this.model.threeData);
  this.object.add(light);

  scene.threeData.add(this.object);

  this.createCamera();
}

PlayerView.prototype.update = function() {
  var position = this.player.body.GetPosition()
    , angle = this.player.body.GetAngle();

  this.controls.update();

  this.mapView.translateToMapPosition(this.object, position.x, position.y);

  this.tmpQuaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), -(Math.PI / 2));
  this.model.threeData.quaternion.copy(this.tmpQuaternion);
  this.tmpQuaternion.setFromAxisAngle(new THREE.Vector3(0,0,-1), angle - (Math.PI / 2));
  this.model.threeData.quaternion.multiply(this.tmpQuaternion);

  if (this.player.body.GetLinearVelocity().Length() > 0.1) {
    this.setAnimation('Walk');
  } else {
    this.setAnimation('Idle');

  }
}

PlayerView.prototype.setAnimation = function(animation) {
  var that = this;
  if (this.animation != animation) {
    console.log('Setting animation', animation);

    this.model.traverse(function(obj) {
      if (obj instanceof SkinnedMeshObject) {

        that.animation = animation;

        obj.set('payload.animationState', 'pause');
        obj.set('payload.animationName', animation);
        obj.set('payload.animationState', 'play');
      }
    });
  }
}

PlayerView.prototype.getCamera = function() {
  return this.camera;
}

PlayerView.prototype.createCamera = function() {
  this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 10000 );
  this.camera.up.set(0, 1, 0);

  this.camera.position.x = 0;
  this.camera.position.y = 2;
  this.camera.position.z = -1;

  var lookAt = new THREE.Vector3(0, 0.5, 0);
  this.camera.lookAt(lookAt);

  this.object.add(this.camera);

  this.controls = new THREE.OrbitControls(this.camera);

  this.controls.minDistance = 0.5;
  this.controls.maxDistance = 2;
}
