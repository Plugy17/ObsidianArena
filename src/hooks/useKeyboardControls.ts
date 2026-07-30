// ============================================
// Obsidian Arena — Keyboard Controls Hook
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Vector2D, InputCommand } from '../logic/moba/types';

// --- Key Bindings ---
export const KEY_BINDINGS = {
  // Movement
  MOVE_UP: ['KeyW', 'ArrowUp'],
  MOVE_DOWN: ['KeyS', 'ArrowDown'],
  MOVE_LEFT: ['KeyA', 'ArrowLeft'],
  MOVE_RIGHT: ['KeyD', 'ArrowRight'],
  // Abilities
  ABILITY_Q: 'KeyQ',
  ABILITY_W: 'KeyW',
  ABILITY_E: 'KeyE',
  ABILITY_R: 'KeyR',
  // Actions
  ATTACK_MOVE: 'KeyX',
  STOP: 'KeyS',
  HOLD: 'KeyH',
  RECALL: 'KeyB',
  // Camera
  CAMERA_PAN_UP: ['KeyW', 'ArrowUp'],
  CAMERA_PAN_DOWN: ['KeyS', 'ArrowDown'],
  CAMERA_PAN_LEFT: ['KeyA', 'ArrowLeft'],
  CAMERA_PAN_RIGHT: ['KeyD', 'ArrowRight'],
} as const;

// --- Keyboard State ---
export interface KeyboardState {
  keys: Set<string>;
  mousePosition: Vector2D;
  isMouseDown: boolean;
  isShiftPressed: boolean;
}

// --- Keyboard Controls Hook ---
export const useKeyboardControls = (
  onSubmitCommand: (command: InputCommand) => void,
  canvasRef?: React.RefObject<HTMLCanvasElement | null>
) => {
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [mousePosition, setMousePosition] = useState<Vector2D>({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const keysRef = useRef<Set<string>>(new Set());
  const mousePosRef = useRef<Vector2D>({ x: 0, y: 0 });
  const lastCommandTime = useRef<number>(0);

  // --- Check if any of the keys are pressed ---
  const isPressed = useCallback(
    (keyCodes: string | readonly string[]): boolean => {
      const codes = Array.isArray(keyCodes) ? keyCodes : [keyCodes];
      return codes.some(code => keysRef.current.has(code));
    },
    []
  );

  // --- Get movement direction from keys ---
  const getMovementDirection = useCallback((): Vector2D => {
    let x = 0;
    let y = 0;

    if (isPressed(KEY_BINDINGS.MOVE_LEFT)) x -= 1;
    if (isPressed(KEY_BINDINGS.MOVE_RIGHT)) x += 1;
    if (isPressed(KEY_BINDINGS.MOVE_UP)) y -= 1;
    if (isPressed(KEY_BINDINGS.MOVE_DOWN)) y += 1;

    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const len = Math.sqrt(x * x + y * y);
      x /= len;
      y /= len;
    }

    return { x, y };
  }, [isPressed]);

  // --- Get current keyboard state ---
  const getKeyboardState = useCallback((): KeyboardState => {
    return {
      keys: new Set(keysRef.current),
      mousePosition: { ...mousePosRef.current },
      isMouseDown,
      isShiftPressed: keysRef.current.has('ShiftLeft') || keysRef.current.has('ShiftRight'),
    };
  }, [isMouseDown]);

  // --- Submit command with cooldown ---
  const submitCommand = useCallback(
    (command: InputCommand) => {
      const now = Date.now();
      if (now - lastCommandTime.current < 50) return; // 50ms cooldown
      lastCommandTime.current = now;
      onSubmitCommand(command);
    },
    [onSubmitCommand]
  );

  // --- Handle key down ---
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!keysRef.current.has(e.code)) {
        keysRef.current.add(e.code);
        setKeys(new Set(keysRef.current));
      }

      // Handle ability keys (Q, W, E, R)
      if (e.code === KEY_BINDINGS.ABILITY_Q) {
        e.preventDefault();
        submitCommand({ type: 'ability', abilityKey: 'Q' });
      } else if (e.code === KEY_BINDINGS.ABILITY_W) {
        e.preventDefault();
        submitCommand({ type: 'ability', abilityKey: 'W' });
      } else if (e.code === KEY_BINDINGS.ABILITY_E) {
        e.preventDefault();
        submitCommand({ type: 'ability', abilityKey: 'E' });
      } else if (e.code === KEY_BINDINGS.ABILITY_R) {
        e.preventDefault();
        submitCommand({ type: 'ability', abilityKey: 'R' });
      } else if (e.code === KEY_BINDINGS.STOP) {
        e.preventDefault();
        submitCommand({ type: 'stop' });
      } else if (e.code === KEY_BINDINGS.HOLD) {
        e.preventDefault();
        submitCommand({ type: 'hold' });
      } else if (e.code === KEY_BINDINGS.RECALL) {
        e.preventDefault();
        submitCommand({ type: 'recall' });
      }

      // Prevent scrolling with spacebar
      if (e.code === 'Space') {
        e.preventDefault();
      }
    },
    [submitCommand]
  );

  // --- Handle key up ---
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.code);
    setKeys(new Set(keysRef.current));
  }, []);

  // --- Handle mouse move ---
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (canvasRef?.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const pos = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        mousePosRef.current = pos;
        setMousePosition(pos);
      } else {
        const pos = { x: e.clientX, y: e.clientY };
        mousePosRef.current = pos;
        setMousePosition(pos);
      }
    },
    [canvasRef]
  );

  // --- Handle mouse down ---
  const handleMouseDown = useCallback((e: MouseEvent) => {
    setIsMouseDown(true);

    // Left click = move, Right click = attack move
    if (e.button === 0) {
      // Move command
      const isShift = keysRef.current.has('ShiftLeft') || keysRef.current.has('ShiftRight');
      submitCommand({
        type: 'move',
        position: { ...mousePosRef.current },
        isShiftQueue: isShift,
      });
    } else if (e.button === 2) {
      // Attack move command
      const isShift = keysRef.current.has('ShiftLeft') || keysRef.current.has('ShiftRight');
      submitCommand({
        type: 'attack',
        position: { ...mousePosRef.current },
        isShiftQueue: isShift,
      });
    }
  }, [submitCommand]);

  // --- Handle mouse up ---
  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
  }, []);

  // --- Setup event listeners ---
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Prevent context menu on right-click
    const handleContextMenu = (e: MouseEvent) => {
      if (e.button === 2) {
        e.preventDefault();
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handleMouseDown, handleMouseUp]);

  return {
    keys,
    mousePosition,
    isMouseDown,
    isPressed,
    getMovementDirection,
    getKeyboardState,
    isMoving: getMovementDirection().x !== 0 || getMovementDirection().y !== 0,
  };
};
