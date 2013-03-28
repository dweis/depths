/* 
  ===========================================================================

  dungCarv

  ===========================================================================

  Copyright 2009 Łukasz Jasiński
 
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
 
  http://www.apache.org/licenses/LICENSE-2.0
 
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  ===========================================================================

  For minified version check dungCarv.min.js file.

  ===========================================================================
*/ 



// Extending array prototype by function which returns random array cell,
// removing it from array.

Array.prototype.rnd = function() {
  if (this.length == 0) return null;
  var r = Math.floor(Math.random() * this.length);
  return this.splice(r, 1).pop();
}

// Extending Math namespace by function which returns random value
// within [A, B] range (including A and B).

Math.rnd = function(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

/* MAIN FUNCTION */
function dungCarv(options) {
  // Set default values for some options (if they are undefined).
  if (!options.padding) options.padding = 1;
  if (!options.randomness) options.randomness = 0.0;
  if (!options.twistness) options.twistness = 0.0;
  if (!options.loops) options.loops = 0.0;
  if (!options.spaces) options.spaces = 0;
  if (!options.loopSpaceRepeat) options.loopSpaceRepeat = 1;
  if (!options.roomSize) options.roomSize = [];
  // Set probability of placing rooms to 0 if there are no room sizes specified.
  if (!options.rooms || options.roomSize.length == 0) options.rooms = 0.0;

  // Some options have to be set.
  if (!options.mapWidth || !options.mapHeight) {
    return {
      success: false
    };
  }

  /* Main object - dungeon carver */
  
  // To prevent name collisions object is created with object initializer
  // inside anonymous namespace.

  return ({
    /* Constants */
    
    // It is impossible to use const keyword, because it doesn't work in IE.
    // The solution is to use normal variables and pretend they are constants.

    MAP_WIDTH:       options.mapWidth,
    MAP_HEIGHT:      options.mapHeight,

    TILE_WALL:       0,
    TILE_CORRIDOR:   1,
    TILE_ROOM:       2,
    TILE_DOOR:       3,
    TILE_ENTRANCE:   4,
    TILE_EXIT:       5,
    TILE_ROOM_TMP:   9998,
    TILE_WALL_TMP:   9999,

    BOUND_TOP:       options.padding,
    BOUND_RIGHT:     options.mapWidth - options.padding - 1,
    BOUND_BOTTOM:    options.mapHeight - options.padding - 1,
    BOUND_LEFT:      options.padding,

    DIR_NONE:        0,
    DIR_UP:          1,
    DIR_RIGHT:       2,
    DIR_DOWN:        3,
    DIR_LEFT:        4,

    /* Variables */

    map:             [],
    queue:           [],
    success:         false,
    started:         false,
    finished:        false,
    dir:             this.DIR_NONE,
    elem:            null,

    /* Functions */

    // create() function is called after creating object.
    // It calls other functions in order to generate and return
    // dungeon map.

    create: function() {
      // First step: fill whole map with walls.
      this.fill(this.TILE_WALL);
      // Second step: generate basic maze with rooms.
      this.generate();
      // Third step: make some loops and erase some dead-ends in
      // order to make more space between rooms and corridors.
      if (options.loopSpaceRepeat > 0 && options.spacesBeforeLoops && options.spaces > 0)
        this.makeSpaces();
      for (var i = 0; i < options.loopSpaceRepeat; i++) {
        if (options.loops > 0.0)
          this.makeLoops();
        if (options.spaces > 0)
          this.makeSpaces();
      }
      // Fourth step: erase single-tile dead-ends growing from rooms.
      if (options.eraseRoomDeadEnds)
        this.eraseRoomDeadEnds();

      // Return generated map.
      return this.returnValue();
    },

    // generate() contains main loop of maze generating routine

    generate: function() {
      while (!this.finished) {
        this.step();
      }
    },

    // step() executes single step in main loop of maze generation
    // routine. It is easier to maintain this procedure when it is
    // stored in other function, called from main loop.

    step: function() {
      // First step. If dungCarv() function was called without
      // data describing entrance coordinates, these coordinates
      // will be chosen randomly.
      if (!this.started) {
        var x;
        var y;
        if (!options.entrance || !options.entrance.x || !options.entrance.y) {
          x = Math.rnd(this.BOUND_LEFT, this.BOUND_RIGHT);
          y = Math.rnd(this.BOUND_TOP, this.BOUND_BOTTOM);
        } else {
          x = options.entrance.x;
          y = options.entrance.y;
        }

        this.started = true;
        this.queue.push({x:x,y:y});

        this.set(x, y, this.TILE_ENTRANCE);
        return;
      }

      // Option "randomness" in action - if there is selected element and queue
      // isn't empty, it is possible that another element will be chosen.
      if (this.elem && this.queue.length > 0 && Math.random() < options.randomness) {
        var x = this.elem.x;
        var y = this.elem.y;
        this.elem = this.queue.rnd();
        this.queue.push({x:x,y:y});
      }

      // If there is no selected element, we have to select one.
      // If there are no elements to select left, we finished carving maze.
      if (!this.elem) {
        if (this.queue.length == 0) {
          this.finished = true;
          return;
        } else {
          this.elem = this.queue.rnd();
        }
      }

      // Check for avaible ways to carve. If there are no ways, drop
      // selected element - it is useless now.
      var dirs = this.avaibleDir(this.elem.x, this.elem.y);
      if (dirs.length == 0) {
        this.elem = null;
        return;
      }

      // Option "twistness" in action - if carver can't carve in current
      // directory anymore OR obtained random value is lower than "twistness",
      // there is a need to change carving direction.
      if (dirs.indexOf(this.dir) == -1 || Math.random() < options.twistness)
        this.dir = dirs.rnd();

      // Just move in valid direction.
      switch (this.dir) {
      case this.DIR_UP:
        this.elem.y--;
        break;
      case this.DIR_RIGHT:
        this.elem.x++;
        break;
      case this.DIR_DOWN:
        this.elem.y++;
        break;
      case this.DIR_LEFT:
        this.elem.x--;
        break;
      }

      // Check if there should be room placed now.
      if (Math.random() < options.rooms) {
        // Check if it is possible to place room.
        if (this.placeRoom(this.elem.x, this.elem.y, this.dir)) {
          this.queue.push({x:this.elem.x,y:this.elem.y});
          this.elem = null;
          return;
        }
      }

      // There is a new corridor in this place, store it in map array.
      this.set(this.elem.x, this.elem.y, this.TILE_CORRIDOR);

      // Insert new element in queue - carver will back to it later.
      this.queue.push({x:this.elem.x,y:this.elem.y});
    },

    // This function places room in given place (if possible)
    placeRoom: function(ex, ey, dir) {
      // Randomly choose room size.
      var s = Math.random();
      var t = 0.0;
      var n = -1;
      var rs;

      for (var i = 0; i < options.roomSize.length; i++) {
        rs = options.roomSize[i];
        t += rs.prob;
        if (t > s) {
          n = i;
          break;
        }
      }

      // n == -1 may happen when total probability of choosing room sizes 
      // doesn't sum up to 1.0 (when options.roomSize array is invalid). 
      // For example:
      // 
      //   options.roomSize = [
      //     { min: 3, max: 5, prob: 0.3 },
      //     { min: 6, max: 10, prob: 0.3 },
      //     { min: 11, max: 15, prob: 0.3 }
      //   ]
      //
      // Probability to choose each of these sizes is 3/10. Variable 's'
      // determines which size will be chosen:
      //
      // - when 0.0 <= s < 0.3, first size will be chosen
      // - when 0.3 <= s < 0.6, second size will be chosen
      // - when 0.6 <= s < 0.9, third size will be chosen
      //
      // Variable 's' has value in range [0.0, 1.0). In this case,
      // if value of variable 's' is higher or equal than 0.9,
      // no room will be chosen and value of variable 'n' will be -1.
      //
      // Probablity in options.roomSize array ALWAYS must sum up to 1.0!
      if (n == -1) return false;

      // Randomly choose width and height of room (in range determined
      // by selected room size).
      rs = options.roomSize[n];
      var w = Math.rnd(rs.min, rs.max);
      var h = Math.rnd(rs.min, rs.max);

      // Find all possible places to carve room with given parameters
      // (width, height, entrance coordinates ex and ey, direction dir).
      var placements = [];
      var bounds = {};
      
      switch (dir) {
      case this.DIR_UP:
        bounds = { t: ey - h, r: ex, b: ey - h, l: ex - w + 1 };
        break;
      case this.DIR_RIGHT:
        bounds = { t: ey - h + 1, r: ex + 1, b: ey, l: ex + 1 };
        break;
      case this.DIR_DOWN:
        bounds = { t: ey + 1, r: ex, b: ey + 1, l: ex - w + 1 };
        break;
      case this.DIR_LEFT:
        bounds = { t: ey - h + 1, r: ex - w + 1, b: ey, l: ex - w + 1 };
        break;
      }

      for (var sx = bounds.l; sx <= bounds.r; sx++) {
        for (var sy = bounds.t; sy <= bounds.b; sy++) {
          var is_ok = true;
          for (var x = sx - 1; x <= sx + w; x++) {
            for (var y = sy - 1; y <= sy + h; y++) {
              if (!this.testTile(x, y, [this.TILE_WALL])) {
                is_ok = false;
                break;
              }
              if (!is_ok) break;
            }
          }
          if (is_ok) {
            placements.push({x:sx,y:sy});
          }
        }
      }

      // placements array is empty if there is no place for room
      // with given parameters.
      if (placements.length == 0) return false;

      // Place corridor at entrance.
      this.set(ex, ey, this.TILE_CORRIDOR);

      // Choose one of places randomly.
      var placement = placements.rnd();

      // Fill area with temporary room tiles.
      for (var x = placement.x; x < placement.x + w; x++) {
        for (var y = placement.y; y < placement.y + h; y++) {
          this.set(x, y, this.TILE_ROOM_TMP);
        }
      }

      // Carve room in this place.
      for (var x = placement.x; x < placement.x + w; x++) {
        for (var y = placement.y; y < placement.y + h; y++) {
          // Check if we should round corner of this room.
          if (!options.roomRound || !this.roundCorner(x, y, placement.x, placement.y, w, h)) {
            // All tiles placed on edge of room should be added to
            // queue, so new corridors and rooms will be able to
            // grow from them.
            if (x == placement.x || x == placement.x + w - 1
            ||  y == placement.y || y == placement.y + h - 1) {
              this.queue.push({x:x,y:y});
            }
            this.set(x, y, this.TILE_ROOM);
          } else {
            this.set(x, y, this.TILE_WALL);
          }
        }
      }

      // Room is ready :)
      return true;
    },

    // This function is used when room is being placed and checks if
    // specific tile should be removed from room in order to make
    // room with rounded (cave-like) corners.
    roundCorner: function(x, y, sx, sy, w, h) {
      return false;
      // TODO
    },

    // Make loops in dungeon.
    // Function finds dead-ends (corridor tiles with only one adjacent
    // corridor or room tile), marks some of them and runs generate
    // routine again. Marked tiles are treat as walls, so it is possible
    // that generator will connect corridors or rooms with them.
    // After generating maze, function will replace marked tiles with
    // corridors again. 
    makeLoops: function() {
      var deadend = [];
      // marked array will contain list of all corridor tiles.
      // All these tiles will be added to maze-generator queue.
      var marked = [];
      // Mark all tiles.
      for (var x = this.BOUND_LEFT; x <= this.BOUND_RIGHT; x++) {
        for (var y = this.BOUND_TOP; y <= this.BOUND_BOTTOM; y++) {
          marked[this.xy(x,y)] = true;
        }
      }

      for (var x = this.BOUND_LEFT; x <= this.BOUND_RIGHT; x++) {
        for (var y = this.BOUND_TOP; y <= this.BOUND_BOTTOM; y++) {
          var pos = this.xy(x, y);
          // Test if tile is wall.
          if (this.testTile(x, y, [this.TILE_WALL])) {
            marked[pos] = false;
          } else {
            // Remove tile only when:
            // - rolled value lower than probability;
            // - tile has only one adjacent corridor or room tile.
            var adj = this.adjacent(x, y);
            if (adj.length == 1 && Math.random() < options.loops) {
              var t = adj.pop();
              // Unmark this tile and adjacent tile.
              marked[pos] = false;
              marked[this.xy(t.x, t.y)] = false;

              // This tile will be replaced with wall (removed).
              deadend.push({x:x,y:y});

              var s = this.map[this.xy(t.x, t.y)];
              this.set(t.x, t.y, this.TILE_WALL);
              // Unmark tiles adjacent diagonally.
              var d = this.diagonal(x, y);
              for (var i = 0; i < d.length; i++) {
                marked[this.xy(d[i].x, d[i].y)] = false;
              }
              this.set(t.x, t.y, s);
            }
          }
        }
      }

      // Return if there were no dead-ends removed.
      if (deadend.length == 0) return;

      // Push all marked tiles into queue.
      for (var x = this.BOUND_LEFT; x <= this.BOUND_RIGHT; x++) {
        for (var y = this.BOUND_TOP; y <= this.BOUND_BOTTOM; y++) {
          if (marked[this.xy(x, y)])
            this.queue.push({x:x,y:y});
        }
      }

      // Remove dead-ends.
      for (var i = 0; i < deadend.length; i++) {
        this.set(deadend[i].x, deadend[i].y, this.TILE_WALL_TMP);
      }

      // Run generate routine again.
      this.finished = false;
      this.generate();

      // Restore removed dead-ends.
      for (var i = 0; i < deadend.length; i++) {
        this.set(deadend[i].x, deadend[i].y, this.TILE_CORRIDOR);
      }
    },

    // This function removes all dead-ends in order to make more space.
    // Routine is repeated few times (based on options.spaces argument).
    makeSpaces: function() {
      for (var i = 0; i < options.spaces; i++) {
        var deadend = [];
        for (var x = this.BOUND_LEFT; x <= this.BOUND_RIGHT; x++) {
          for (var y = this.BOUND_TOP; y <= this.BOUND_BOTTOM; y++) {
            // Check only corridors.
            if (!this.testTile(x, y, [this.TILE_CORRIDOR])) continue;
            // Get adjacent corridor of room tiles.
            var adj = this.adjacent(x, y);
            // Check if tile has only one adjacent corridor or room tile.
            if (adj.length != 1) continue;
            deadend.push({x:x,y:y});
          }
        }
        for (var j = 0; j < deadend.length; j++) {
          this.set(deadend[j].x, deadend[j].y, this.TILE_WALL);
        }
      }
    },

    // This function removes all dead-ends connected directly with rooms.
    eraseRoomDeadEnds: function() {
      for (var x = this.BOUND_LEFT; x <= this.BOUND_RIGHT; x++) {
        for (var y = this.BOUND_TOP; y <= this.BOUND_BOTTOM; y++) {
          // Check only corridors.
          if (!this.testTile(x, y, [this.TILE_CORRIDOR])) continue;
          // Get adjacent corridor of room tiles.
          var adj = this.adjacent(x, y);
          // Check if tile has only one adjacent corridor or room tile.
          if (adj.length != 1) continue;
          // Check if adjacent tile is room.
          if (this.testTile(adj[0].x, adj[0].y, [this.TILE_ROOM]));
          // Remove tile.
          this.set(x, y, this.TILE_WALL);
        }
      }
    },

    // Simple functions used to manage map array easier.
    set: function(x, y, tile) {
      this.map[this.xy(x, y)] = tile;
    },

    xy: function(x, y) {
      return x + y * options.mapWidth;
    },

    // avaibleDir() checks every direction to determine all directions avaible 
    // for carving (for given point x,y).
    avaibleDir: function(x, y) {
      var d = [];
      if (this.canCarve(x, y - 1)) d.push(this.DIR_UP);
      if (this.canCarve(x + 1, y)) d.push(this.DIR_RIGHT);
      if (this.canCarve(x, y + 1)) d.push(this.DIR_DOWN);
      if (this.canCarve(x - 1, y)) d.push(this.DIR_LEFT);
      return d;
    },

    // canCarve() returns true when target tile and all tiles around
    // target tile are occupied by wall. Examples (^ shows position of carver
    // before digging next corridor):
    //
    // ### 1. Valid. Carver can carve here.
    // ### 
    // .^. 
    // 
    // ... 2. Invalid. Carving will create loop.
    // ### 
    // .^. 
    // 
    // ### 3. Invalid. There is no wall on target tile.
    // #.# 
    // .^. 
    // 
    // ##. 4. Invalid. Carver refuse to create corridor tiles
    // ###    connected diagonally (due to aesthetical reasons).
    // .^. 
    // 
    canCarve: function(x, y, dir) {
      if (!this.testTile(x, y, [this.TILE_WALL])) return false;
      var a = this.adjacent(x, y);
      var d = this.diagonal(x, y);
      if (a.length != 1) return false;
      if (d.length != 0) return false;
      return true;
    },

    // This function finds all corridor or room tiles connected to given
    // tile and returns array containing coordinates of these tiles.
    adjacent: function(x, y) {
      var res = [];
      var test = [this.TILE_ROOM, this.TILE_CORRIDOR, this.TILE_ENTRANCE];
      if (this.testTile(x, y - 1, test)) res.push({x:x,y:y-1});
      if (this.testTile(x + 1, y, test)) res.push({x:x+1,y:y});
      if (this.testTile(x, y + 1, test)) res.push({x:x,y:y+1});
      if (this.testTile(x - 1, y, test)) res.push({x:x-1,y:y});
      return res;
    },

    // This function finds all corridor or room tiles adjacent diagonally to
    // given tile and returns array containing coordinates of these tiles.
    diagonal: function(x, y) {
      var res = [];
      var test = [this.TILE_WALL, this.TILE_WALL_TMP];
      if (!this.testTile(x-1, y-1, test) && this.testTile(x-1, y, test) && this.testTile(x, y-1, test)) res.push({x:x-1,y:y-1});
      if (!this.testTile(x+1, y-1, test) && this.testTile(x+1, y, test) && this.testTile(x, y-1, test)) res.push({x:x+1,y:y-1});
      if (!this.testTile(x+1, y+1, test) && this.testTile(x+1, y, test) && this.testTile(x, y+1, test)) res.push({x:x+1,y:y+1});
      if (!this.testTile(x-1, y+1, test) && this.testTile(x-1, y, test) && this.testTile(x, y+1, test)) res.push({x:x-1,y:y+1});
      return res;
    },

    // testTile() is simple function which checks content of tile.
    // It return false:
    // - when tile is outside defined bounds
    // - when tile content is different than every tile in array
    //   passed as argument to testTile()

    testTile: function(x, y, tiles) {
      if (x < this.BOUND_LEFT || x > this.BOUND_RIGHT) return false;
      if (y < this.BOUND_TOP || y > this.BOUND_BOTTOM) return false;
      return tiles.indexOf(this.map[this.xy(x, y)]) != -1;
    },

    // This function generates object which will be returned to user after
    // creating dungeon.

    returnValue: function() {
      this.success = true;
      var rv = {
        success: this.success
      };

      if (this.success) {
        rv.map = this.map;

        if (options.returnRoomData)
          rv.roomData = this.generateRoomData();

        if (options.returnDoorData)
          rv.doorData = this.generateDoorData();

        if (options.returnStatistics)
          rv.statistics = this.generateStatistics();
      }

      return rv;
    },

    // Fill whole map with given tile.
    fill: function(tile) {
      var xy = this.xy;
      for (var x = 0; x < this.MAP_WIDTH; x++) {
        for (var y = 0; y < this.MAP_HEIGHT; y++) {
          this.map[xy(x,y)] = tile;
        }
      }
    }

  // end of anonymous namespace...
  }).create();
}
