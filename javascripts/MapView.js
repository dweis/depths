function MapView(tileSet, scene, map) {
  this.tileSet = tileSet;
  this.scene = scene;
  this.map = map;

  this.scaleFactor = 1;

  this.tiles = [];
}

MapView.prototype.getWorldWidth = function() {
  return this.map.mapWidth * this.scaleFactor;
}

MapView.prototype.getWorldHeight = function() {
  return this.map.mapWidth * this.scaleFactor;
}

MapView.prototype.getTile = function(idx) {
  var type = 'Dirt0'
    , ne, nw, se, sw
    , n, e, s, w;

  if (this.map.map[idx] == 0) {
    n = this.map.map[idx - this.map.mapWidth] || 0;
    e = this.map.map[idx + 1] || 0;
    s = this.map.map[idx + this.map.mapWidth] || 0;
    w = this.map.map[idx - 1] || 0;

    if (n != this.map.cells.WALL && e != this.map.cells.WALL && s != this.map.cells.WALL && w != this.map.cells.WALL) {
      type = 'Dirt104';
    } else if (n != this.map.cells.WALL && e != this.map.cells.WALL && s != this.map.cells.WALL) {
      type = 'Dirt103E';
    } else if (e != this.map.cells.WALL && s != this.map.cells.WALL && w != this.map.cells.WALL) {
      type = 'Dirt103S';
    } else if (s != this.map.cells.WALL && w != this.map.cells.WALL && n != this.map.cells.WALL) {
      type = 'Dirt103W';
    } else if (w != this.map.cells.WALL && n != this.map.cells.WALL && e != this.map.cells.WALL) {
      type = 'Dirt103N';
    } else if (n != this.map.cells.WALL && e != this.map.cells.WALL) {
      type = 'Dirt102NE';
    } else if (e != this.map.cells.WALL && s != this.map.cells.WALL) {
      type = 'Dirt102SE';
    } else if (s != this.map.cells.WALL && w != this.map.cells.WALL) {
      type = 'Dirt102SW';
    } else if (w != this.map.cells.WALL && n != this.map.cells.WALL) {
      type = 'Dirt102NW';
    } else if (n != this.map.cells.WALL && s != this.map.cells.WALL) {
      type = 'Dirt102NS-A';
    } else if (w != this.map.cells.WALL && e != this.map.cells.WALL) {
      type = 'Dirt102WE-A';
    } else if (e != this.map.cells.WALL) {
      type = 'DirtCo101E';
    } else if (w != this.map.cells.WALL) {
      type = 'DirtCo101W';
    } else if (n != this.map.cells.WALL) {
      type = 'DirtCo101N';
    } else if (s != this.map.cells.WALL) {
      type = 'DirtCo101S';
    } else {
      type = 'Dirt100';

      ne = this.map.map[idx - this.map.mapWidth + 1] || 0;
      se = this.map.map[idx + this.map.mapWidth + 1] || 0;
      sw = this.map.map[idx + this.map.mapWidth - 1] || 0;
      nw = this.map.map[idx - this.map.mapWidth - 1] || 0;

      if (ne != this.map.cells.WALL && se != this.map.cells.WALL && sw != this.map.cells.WALL && nw != this.map.cells.WALL) {
        type = 'DirtCo100';
      } else if (ne != this.map.cells.WALL && se != this.map.cells.WALL && sw != this.map.cells.WALL) {
        type = 'DirtCo100NE-SW-SE';
      } else if (se != this.map.cells.WALL && sw != this.map.cells.WALL && nw != this.map.cells.WALL) {
        type = 'DirtCo100NW-SW-SE';
      } else if (sw != this.map.cells.WALL && nw != this.map.cells.WALL && ne != this.map.cells.WALL) {
        type = 'DirtCo100NW-NE-SW';
      } else if (nw != this.map.cells.WALL && ne != this.map.cells.WALL && se != this.map.cells.WALL) {
        type = 'DirtCo100NW-NE-SE';
      } else if (ne != this.map.cells.WALL && nw != this.map.cells.WALL) {
        type = 'DirtCo100NW-NE';
      } else if (ne != this.map.cells.WALL && se != this.map.cells.WALL) {
        type = 'DirtCo100NE-SE';
      } else if (ne != this.map.cells.WALL && sw != this.map.cells.WALL) {
        type = 'DirtCo100NE-SW';
      } else if (nw != this.map.cells.WALL && se != this.map.cells.WALL) {
        type = 'DirtCo100NW-SE';
      } else if (nw != this.map.cells.WALL && sw != this.map.cells.WALL) {
        type = 'DirtCo100NW-SW';
      } else if (se != this.map.cells.WALL && sw != this.map.cells.WALL) {
        type = 'DirtCo100SW-SE'
      } else if (se != this.map.cells.WALL) {
        type = 'DirtCo100SE';
      } else if (ne != this.map.cells.WALL) {
        type = 'DirtCo100NE';
      } else if (nw != this.map.cells.WALL) {
        type = 'DirtCo100NW';
      } else if (sw != this.map.cells.WALL) {
        type = 'DirtCo100SW';
      }
    }
  }

  if (!this.tiles[type]) {
    console.log('Missing tile: %s', type);
    return this.tiles['Dirt0'];
  }

  return this.tiles[type];
}

MapView.prototype.init = function() {
  var that = this;
  this.tileSet.load({ success_hierarchy: function(tileSet) {
    that.tileSet.traverse(function(obj) {
      if (obj instanceof MeshObject) {
        var name = obj.entityModel.get('name');
        console.log('Tile Added:', name);

        that.tiles[name] = obj.threeData;
      }
    });

    for (var y = 0; y < that.map.mapHeight; y++) {
      for (x = 0; x < that.map.mapWidth; x++) {
        var idx = y * that.map.mapWidth + x;
        var tile = that.getTile(idx);

        var threeObj = tile.clone();

        threeObj.scale = new THREE.Vector3(0.4, 0.4, 0.4);

        that.translateToMapPosition(threeObj, x + 0.5, y + 0.5);

        that.scene.threeData.add(threeObj);
      }
    }
  }});
}

MapView.prototype.translateToMapPosition = function(obj, x, y) {
  obj.position.x = x * this.scaleFactor;
  obj.position.z = y * this.scaleFactor;
}
