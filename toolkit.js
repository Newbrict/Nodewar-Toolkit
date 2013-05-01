
////////////////////////////////////////////////////////
// M""""""""M                   dP dP       oo   dP   //
// Mmmm  mmmM                   88 88            88   //
// MMMM  MMMM .d8888b. .d8888b. 88 88  .dP  dP d8888P //
// MMMM  MMMM 88'  `88 88'  `88 88 88888"   88   88   //
// MMMM  MMMM 88.  .88 88.  .88 88 88  `8b. 88   88   //
// MMMM  MMMM `88888P' `88888P' dP dP   `YP dP   dP   //
// MMMMMMMMMM                                         //
//                                                    //
// A toolkit for Nodewar to help you get started fast //
////////////////////////////////////////////////////////

ai.step = function(o) {
  return {
    torque: 1.0, // max torque
    thrust: 1.0,  // max thrust
    label: scrolling_label(o, " Check out my code! ")
  };
};

// Returns a position's distance from the edge
edge_dist = function(o, pos) {
  return o.lib.vec.dist(o.lib.vec.fromPolar([o.game.moon_field, o.lib.vec.toPolar(pos)[1]]),pos);
};

// Credit to @Malgorithms
// Get's the spot on the moon field's edge that you would
// fly out of if you continued your current trajectory
get_board_exit_pos = function(o) {
  var ddt, dt, maxt, px, py, rad_sq, t, vx, vy, _ref, _ref1;
  t = 0;
  dt = 0.05;
  ddt = 0.025;
  maxt = 10;
  v = o.me.vel;
  p = o.me.pos;
  rad_sq = Math.pow(o.game.moon_field, 2);
  while ((t < maxt) && (p[0] * p[0] + p[1] * p[1] < rad_sq)) {
    t += dt;
    p[0] += v[0] * dt;
    p[1] += v[1] * dt;
    dt += ddt;
  }
  return p;
};

// Gives you the future position of target_ship relative to ship -- limited
// to looking a maximum of pre_cog_time seconds ahead in the future
// a good number for pre_cog_time usually falls between 1.5 and 3
// The -0.1 gives you a position just past the bot, very useful for targeting
linear_position = function(o, ship, target_ship, pre_cog_time){
    var rel_vel = o.lib.vec.diff(ship.vel, target_ship.vel);
    var time_delta = collision_time(o, rel_vel, ship.pos, target_ship.pos);
        time_delta = Math.min(time_delta - 0.1, pre_cog_time);
    var pos_delta = o.lib.vec.times(rel_vel, time_delta);
    return o.lib.vec.diff(target_ship.pos, pos_delta);
};

// The minimum time before a possible collision from p1 to p2, as in
// it's unlikely the velocity is the vector between the two points!
collision_time = function(o, v, p1, p2) {
  var speed_toward = o.lib.physics.speedToward(v, p1, p2);
  var distance = o.lib.vec.dist(p1, p2);
  return (speed_toward <= 0)?Infinity:(distance / speed_toward);
};

// Get's the magnitude of a vector (ie hypotenuse)
// apparently there is already o.lib.vec.len(v)... whoops :)
magnitude = function(v) {
  return Math.sqrt(Math.pow(v[0],2)+Math.pow(v[1],2));
};

// Makes a unit vector
unit_vector = function(v) {
  var mag = magnitude(v);
  return [v[0]/mag,v[1]/mag];
};

// Makes a label that scrolls each tick ( based on the length )
scrolling_label = function(o, s) {
  split = (Math.floor(o.game.time*s.length)%s.length);
  return(s.substring(split,s.length) + s.substring(0,split));
};

// Returns the n'th closest threat from o
// b1f = include friendly ships
// b1e = include enemy ships
// b2 = include moons
// b3 = include the edge
threat_index = function(o, n, b1f, b1e, b2, b3) {
  var threats = [];
  // ships
  for (i = o.ships.length - 1; i >= 0; --i)
    if(b1f && o.ships[i].friendly || b1e && !o.ships[i].friendly)
      threats.push(o.ships[i]);
  // moons
  if(b2)
    for (i = o.moons.length - 1; i >= 0; --i)
      threats.push(o.moons[i]);
  // edge
  if(b3) {
    var edge = o.lib.vec.fromPolar([o.game.moon_field, o.lib.vec.toPolar(o.me.pos)[1]]);
    threats.push({
      pos: edge,
      dist: o.lib.vec.dist(edge,o.me.pos)
    });
  }

  threats = threats.sort(function(a, b) {
    return b.dist - a.dist;
  });

  return (threats[n] || threats[0]);
};

// Returns the threats within a radius from a position
// b1f = include friendly ships
// b1e = include enemy ships
// b2 = include moons
// b3 = include the edge
threats_within = function(o, pos, rad, b1f, b1e, b2, b3) {
  var threats = [];
  for(i=o.ships.length-1, x = o.ships; i>=0; --i)
    if(x[i].alive && 
      ( (b1e && !x[i].friendly) || (b1f && x[i].friendly) ) && o.lib.vec.dist(x[i].pos, pos)<=rad)
      threats.push(x[i]);
  if(b2)
    for (i = o.moons.length - 1; i >= 0; --i)
      if(o.lib.vec.dist(o.moons[i].pos, pos)<=rad)
        threats.push(o.moons[i]);
  if(b3) {
    var edge = o.lib.vec.fromPolar([o.game.moon_field, o.lib.vec.toPolar(pos)[1]]);
    if(o.lib.vec.dist(edge, pos)<=rad)
    threats.push({
      pos: edge,
      dist: o.lib.vec.dist(edge,o.me.pos)
    });
  }
  return threats;
};

// Returns all the living ships
living_ships = function(o) {
  var l_ships = [];
  for(i=o.ships.length-1; i>=0; --i)
    if(o.ships[i].alive)
      l_ships.push(o.ships[i]);
  return l_ships;
};

// Returns all enemy ships
enemy_ships = function(o) {
  var e_ships = [];
  for(i=o.ships.length-1; i>=0; --i)
    if(o.ships[i].alive && !o.ships[i].friendly)
      e_ships.push(o.ships[i]);
  return e_ships;
};

// Returns all friendly ships
friendly_ships = function(o) {
  var f_ships = [];
  for(i=o.ships.length-1; i>=0; --i)
    if(o.ships[i].alive && o.ships[i].friendly)
      f_ships.push(o.ships[i]);
  return f_ships;
};

// Returns all dead ships
dead_ships = function(o) {
  var d_ships = [];
  for(i=o.ships.length-1; i>=0; --i)
    if(!o.ships[i].alive)
      d_ships.push(o.ships[i]);
  return d_ships;
};

// Returns the enemy queen
enemy_queen = function(o) {
  for (i = o.ships.length; i>=0; --i)
    if(!o.ships[i].friendly && o.ships[i].queen)
      return o.ships[i];
};

// Returns the friendly queen
friendly_queen = function(o) {
  for (i = o.ships.length; i>=0; --i)
    if(o.ships[i].friendly && o.ships[i].queen)
      return o.ships[i];
};
