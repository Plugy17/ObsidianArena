// ============================================
// Obsidian Arena — Mobile Controls
// ============================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Vector2D, InputCommand } from '../../logic/moba/types';

// --- Touch Joystick Component ---
interface TouchJoystickProps {
  onDirection: (dir: Vector2D) => void;
  onRelease: () => void;
}

export const TouchJoystick: React.FC<TouchJoystickProps> = ({
  onDirection,
  onRelease,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 50, y: 50 });
  const basePos = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = joystickRef.current!.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      basePos.current = { x, y };
      setKnobPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
      setIsActive(true);

      // Calculate initial direction
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const dx = (x - centerX) / centerX;
      const dy = (y - centerY) / centerY;
      onDirection({ x: dx, y: dy });
    },
    [onDirection]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isActive) return;
      e.preventDefault();

      const touch = e.touches[0];
      const rect = joystickRef.current!.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = Math.min(rect.width, rect.height) / 2;

      // Clamp to circle
      const clampedDist = Math.min(distance, maxDistance);
      const angle = Math.atan2(dy, dx);
      const clampedX = centerX + Math.cos(angle) * clampedDist;
      const clampedY = centerY + Math.sin(angle) * clampedDist;

      setKnobPos({
        x: (clampedX / rect.width) * 100,
        y: (clampedY / rect.height) * 100,
      });

      // Calculate direction
      const dirX = dx / maxDistance;
      const dirY = dy / maxDistance;
      onDirection({ x: dirX, y: dirY });
    },
    [isActive, onDirection]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isActive) return;
    setIsActive(false);
    setKnobPos({ x: 50, y: 50 });
    onRelease();
  }, [isActive, onRelease]);

  return (
    <div
      ref={joystickRef}
      className="w-24 h-24 rounded-full bg-obsidian-800/50 border-2 border-purple-neon/30 relative touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Base circle */}
      <div className="absolute inset-0 rounded-full border border-purple-neon/20" />

      {/* Knob */}
      <motion.div
        className="absolute w-10 h-10 rounded-full bg-purple-neon/80 border-2 border-gold shadow-[0_0_8px_theme(colors.purple-neon)]"
        style={{
          left: `${knobPos.x}%`,
          top: `${knobPos.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: isActive ? 1 : 0.8,
          opacity: isActive ? 1 : 0.5,
        }}
      />
    </div>
  );
};

// --- Ability Button Component ---
interface AbilityButtonProps {
  keyLabel: 'Q' | 'W' | 'E' | 'R';
  name: string;
  cooldown: number; // seconds
  maxCooldown: number;
  onPress: () => void;
  icon?: string;
}

export const AbilityButton: React.FC<AbilityButtonProps> = ({
  keyLabel,
  name,
  cooldown,
  maxCooldown,
  onPress,
  icon,
}) => {
  const cooldownPercent = maxCooldown > 0 ? (cooldown / maxCooldown) * 100 : 0;
  const isOnCooldown = cooldown > 0;

  return (
    <motion.button
      type="button"
      onClick={onPress}
      disabled={isOnCooldown}
      className={`
        relative w-16 h-16 rounded-xl font-bold text-sm
        bg-obsidian-800/70 border-2
        ${
          isOnCooldown
            ? 'border-gray-600 text-gray-500 cursor-not-allowed'
            : 'border-purple-neon/50 text-white hover:border-gold hover:shadow-[0_0_12px_theme(colors.purple.neon)]'
        }
      `}
      whileTap={{ scale: isOnCooldown ? 1 : 0.9 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      {/* Key label */}
      <div className="absolute top-1 left-1 text-xs font-bold text-gold">
        {keyLabel}
      </div>

      {/* Icon or name */}
      <div className="absolute inset-0 flex items-center justify-center text-xs mt-4">
        {icon || name}
      </div>

      {/* Cooldown overlay */}
      {isOnCooldown && (
        <>
          <div
            className="absolute inset-0 bg-black/70 rounded-xl"
            style={{
              clipPath: `polygon(0 0, 100% 0, 100% ${cooldownPercent}%, 0 ${cooldownPercent}%)`,
            }}
          />
          <div className="absolute bottom-1 right-1 text-xs text-gray-400">
            {Math.ceil(cooldown)}s
          </div>
        </>
      )}
    </motion.button>
  );
};

// --- Attack Button ---
interface AttackButtonProps {
  onPress: () => void;
  isAuto?: boolean;
}

export const AttackButton: React.FC<AttackButtonProps> = ({
  onPress,
  isAuto = false,
}) => {
  return (
    <motion.button
      type="button"
      onClick={onPress}
      className={`
        w-16 h-16 rounded-full font-bold
        ${
          isAuto
            ? 'bg-gradient-to-r from-green-600 to-green-700 border-2 border-green-400 text-white'
            : 'bg-gradient-to-r from-purple-neon to-purple-neon-2 border-2 border-gold text-obsidian-950'
        }
      `}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      {isAuto ? 'Авто' : 'Атк'}
    </motion.button>
  );
};

// --- Main Mobile Controls Component ---
interface MobileControlsProps {
  onCommand: (command: InputCommand) => void;
  abilityNames: { Q: string; W: string; E: string; R: string };
  cooldowns: { Q: number; W: number; E: number; R: number };
  maxCooldowns: { Q: number; W: number; E: number; R: number };
  isAutoAttack: boolean;
  onToggleAuto: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onCommand,
  abilityNames,
  cooldowns,
  maxCooldowns,
  isAutoAttack,
  onToggleAuto,
}) => {
  const [moveDirection, setMoveDirection] = useState<Vector2D>({ x: 0, y: 0 });

  // Send move commands when direction changes
  useEffect(() => {
    if (moveDirection.x !== 0 || moveDirection.y !== 0) {
      // In a real implementation, this would send a move command
      // For now, we just track the direction
    }
  }, [moveDirection]);

  const handleAbilityPress = useCallback(
    (key: 'Q' | 'W' | 'E' | 'R') => {
      onCommand({ type: 'ability', abilityKey: key });
    },
    [onCommand]
  );

  const handleAttackPress = useCallback(() => {
    onToggleAuto();
  }, [onToggleAuto]);

  const handleJoystickDirection = useCallback(
    (dir: Vector2D) => {
      setMoveDirection(dir);
    },
    []
  );

  const handleJoystickRelease = useCallback(() => {
    setMoveDirection({ x: 0, y: 0 });
  }, []);

  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-between items-center px-4 pointer-events-none z-40 md:hidden">
      {/* Left: Movement Joystick */}
      <div className="pointer-events-auto">
        <TouchJoystick
          onDirection={handleJoystickDirection}
          onRelease={handleJoystickRelease}
        />
      </div>

      {/* Right: Abilities and Attack */}
      <div className="flex flex-col items-center gap-3 pointer-events-auto">
        {/* Ability row */}
        <div className="flex gap-2">
          <AbilityButton
            keyLabel="Q"
            name={abilityNames.Q}
            cooldown={cooldowns.Q}
            maxCooldown={maxCooldowns.Q}
            onPress={() => handleAbilityPress('Q')}
          />
          <AbilityButton
            keyLabel="W"
            name={abilityNames.W}
            cooldown={cooldowns.W}
            maxCooldown={maxCooldowns.W}
            onPress={() => handleAbilityPress('W')}
          />
          <AbilityButton
            keyLabel="E"
            name={abilityNames.E}
            cooldown={cooldowns.E}
            maxCooldown={maxCooldowns.E}
            onPress={() => handleAbilityPress('E')}
          />
          <AbilityButton
            keyLabel="R"
            name={abilityNames.R}
            cooldown={cooldowns.R}
            maxCooldown={maxCooldowns.R}
            onPress={() => handleAbilityPress('R')}
          />
        </div>

        {/* Attack button */}
        <AttackButton
          onPress={handleAttackPress}
          isAuto={isAutoAttack}
        />
      </div>
    </div>
  );
};
