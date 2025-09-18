// Core geometry types for Asteroids TTY game

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  dx: number;
  dy: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Utility functions for geometry operations
export function addVelocityToPosition(position: Position, velocity: Velocity): Position {
  return {
    x: position.x + velocity.dx,
    y: position.y + velocity.dy
  };
}

export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function wrapPosition(position: Position, screenWidth: number, screenHeight: number): Position {
  let { x, y } = position;

  // Wrap X coordinate
  if (x >= screenWidth) {
    x = x - screenWidth;
  } else if (x < 0) {
    x = screenWidth + x;
  }

  // Wrap Y coordinate
  if (y >= screenHeight) {
    y = y - screenHeight;
  } else if (y < 0) {
    y = screenHeight + y;
  }

  return { x, y };
}

export function scaleVelocity(velocity: Velocity, scale: number): Velocity {
  return {
    dx: velocity.dx * scale,
    dy: velocity.dy * scale
  };
}

export function getVelocityMagnitude(velocity: Velocity): number {
  return Math.sqrt(velocity.dx * velocity.dx + velocity.dy * velocity.dy);
}

export function normalizeVelocity(velocity: Velocity): Velocity {
  const magnitude = getVelocityMagnitude(velocity);
  if (magnitude === 0) {
    return { dx: 0, dy: 0 };
  }
  return {
    dx: velocity.dx / magnitude,
    dy: velocity.dy / magnitude
  };
}

export function addVelocities(vel1: Velocity, vel2: Velocity): Velocity {
  return {
    dx: vel1.dx + vel2.dx,
    dy: vel1.dy + vel2.dy
  };
}

// Rotation and direction utilities
export function rotationToDirection(rotation: number): Velocity {
  const radians = (rotation * Math.PI) / 180;
  return {
    dx: Math.sin(radians),
    dy: -Math.cos(radians) // Negative because Y increases downward
  };
}

export function normalizeRotation(rotation: number): number {
  while (rotation >= 360) rotation -= 360;
  while (rotation < 0) rotation += 360;
  return rotation;
}

export function applyThrust(currentVelocity: Velocity, rotation: number, thrustPower: number): Velocity {
  const thrustDirection = rotationToDirection(rotation);
  const thrustVelocity = scaleVelocity(thrustDirection, thrustPower);
  return addVelocities(currentVelocity, thrustVelocity);
}

// Collision detection utilities
export function isPointInRectangle(point: Position, bounds: Rectangle): boolean {
  return (
    point.x >= bounds.x &&
    point.x < bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y < bounds.y + bounds.height
  );
}

export function getCharacterBounds(position: Position, characterSize: number = 1): Rectangle {
  return {
    x: Math.floor(position.x),
    y: Math.floor(position.y),
    width: characterSize,
    height: characterSize
  };
}