// ============================================
// Obsidian Arena — Guild List Component
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  Trophy,
  Star,
  Lock,
} from 'lucide-react';
import type { Guild } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useState } from 'react';

export interface GuildListProps {
  guilds: Guild[];
  joinedGuild: Guild | null;
  userBalance: number;
  onJoinGuild: (guildId: string) => Promise<boolean>;
}

export const GuildList: React.FC<GuildListProps> = ({
  guilds,
  userBalance,
  onJoinGuild,
}) => {
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!selectedGuild) return;

    setIsJoining(true);
    setJoinError(null);

    try {
      const success = await onJoinGuild(selectedGuild.id);
      if (!success) {
        if (userBalance < selectedGuild.joinFee) {
          setJoinError(
            `Недостаточно средств! Требуется ${selectedGuild.joinFee} OBS`
          );
        } else {
          setJoinError('Не удалось вступить в гильдию');
        }
      } else {
        setSelectedGuild(null);
      }
    } catch {
      setJoinError('Ошибка при вступлении в гильдию');
    } finally {
      setIsJoining(false);
    }
  };

  const getProgressPercent = (guild: Guild): number => {
    const expForNextLevel = guild.level * 1000;
    return Math.min(100, (guild.experience / expForNextLevel) * 100);
  };

  return (
    <>
      <div className="space-y-4">
        {guilds.length === 0 ? (
          <div className="text-center py-12 glass-purple rounded-xl">
            <Shield size={48} className="mx-auto text-text-tertiary mb-3" />
            <p className="text-text-secondary">Гильдий пока нет</p>
          </div>
        ) : (
          <AnimatePresence>
            {guilds.map((guild, index) => (
              <motion.div
                key={guild.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  variant={
                    guild.isJoined ? 'glass-gold' : 'glass-purple'
                  }
                  padding="md"
                  hoverable
                  onClick={() => setSelectedGuild(guild)}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Guild Info */}
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center border-2"
                        style={{
                          borderColor: guild.isJoined
                            ? '#daa520'
                            : '#8a2be2',
                          backgroundColor: guild.isJoined
                            ? 'rgba(218, 165, 32, 0.15)'
                            : 'rgba(138, 43, 226, 0.15)',
                        }}
                      >
                        <Shield size={24} />
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-lg">
                            {guild.name}
                          </h3>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: 'rgba(138, 43, 226, 0.2)',
                              color: '#8a2be2',
                            }}
                          >
                            [{guild.tag}]
                          </span>
                          {guild.isJoined && (
                            <Star
                              size={14}
                              className="text-gold"
                              fill="currentColor"
                            />
                          )}
                        </div>

                        <p className="text-sm text-text-secondary">
                          {guild.description}
                        </p>

                        <div className="flex items-center space-x-4 mt-2 text-xs text-text-tertiary">
                          <span className="flex items-center">
                            <Users size={12} className="mr-1" />
                            {guild.memberCount}/{guild.maxMembers}
                          </span>
                          <span className="flex items-center">
                            <Trophy size={12} className="mr-1" />
                            Уровень {guild.level}
                          </span>
                          <span className="flex items-center">
                            <Lock size={12} className="mr-1" />
                            Сбор: {guild.joinFee} OBS
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Progress & Action */}
                    <div className="flex flex-col items-end space-y-2">
                      {/* Progress bar */}
                      <div className="w-24">
                        <div className="flex justify-between text-xs text-text-tertiary mb-1">
                          <span>Опыт</span>
                          <span>{guild.experience}</span>
                        </div>
                        <div className="w-full h-1.5 bg-obsidian-700/50 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-purple-neon to-gold rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${getProgressPercent(guild)}%`,
                            }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>

                      {/* Action button */}
                      {guild.isJoined ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          animate={false}
                        >
                          В гильдии
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="gold"
                          onClick={(e) => {
                            e?.stopPropagation();
                            setSelectedGuild(guild);
                          }}
                          animate={false}
                        >
                          Вступить
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Guild Detail Modal */}
      <Modal
        isOpen={!!selectedGuild}
        onClose={() => setSelectedGuild(null)}
        title={selectedGuild?.name || ''}
        size="md"
      >
        {selectedGuild && (
          <div className="space-y-4">
            {/* Guild Header */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center border-2 border-gold">
                <Shield size={32} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold">{selectedGuild.name}</h3>
                  <span className="text-sm px-2 py-0.5 bg-purple-neon/20 text-purple-neon rounded-full">
                    [{selectedGuild.tag}]
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  {selectedGuild.description}
                </p>
              </div>
            </div>

            {/* Guild Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-purple p-3 rounded-xl text-center">
                <Users size={20} className="mx-auto text-purple-neon mb-1" />
                <p className="text-2xl font-bold">{selectedGuild.memberCount}</p>
                <p className="text-xs text-text-secondary">Участников</p>
              </div>
              <div className="glass-purple p-3 rounded-xl text-center">
                <Trophy size={20} className="mx-auto text-gold mb-1" />
                <p className="text-2xl font-bold">{selectedGuild.level}</p>
                <p className="text-xs text-text-secondary">Уровень</p>
              </div>
            </div>

            {/* Experience */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">Опыт гильдии</span>
                <span className="text-text-primary">
                  {selectedGuild.experience} / {selectedGuild.level * 1000}
                </span>
              </div>
              <div className="w-full h-2 bg-obsidian-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-neon to-gold rounded-full"
                  style={{
                    width: `${getProgressPercent(selectedGuild)}%`,
                  }}
                />
              </div>
            </div>

            {/* Join Fee */}
            <div className="glass-purple p-3 rounded-xl">
              <p className="text-sm text-text-secondary mb-1">
                Вступительный сбор
              </p>
              <p className="text-xl font-bold text-gold">
                {selectedGuild.joinFee} OBS
              </p>
              {userBalance < selectedGuild.joinFee && (
                <p className="text-xs text-red-400 mt-1">
                  Недостаточно средств!
                </p>
              )}
            </div>

            {/* Join Error */}
            {joinError && (
              <motion.p
                className="text-sm text-red-400 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {joinError}
              </motion.p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setSelectedGuild(null)}
              >
                Закрыть
              </Button>
              {!selectedGuild.isJoined && (
                <Button
                  variant="gold"
                  fullWidth
                  onClick={handleJoin}
                  loading={isJoining}
                  disabled={
                    isJoining || userBalance < selectedGuild.joinFee
                  }
                >
                  Вступить за {selectedGuild.joinFee} OBS
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
