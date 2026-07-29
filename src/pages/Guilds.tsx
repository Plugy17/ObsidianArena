// ============================================
// Obsidian Arena — Guilds Page
// ============================================

import { motion } from 'framer-motion';
import { Shield, Plus, Users } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { GuildList } from '../components/game/GuildList';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Guilds: React.FC = () => {
  const { guilds, joinedGuild, user, joinGuild } = useUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-neon" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gradient-purple mb-2 flex items-center">
            <Shield size={28} className="mr-2 text-gold" />
            Гильдии
          </h1>
          <p className="text-text-secondary">
            Присоединяйтесь к гильдии или создавайте свою!
          </p>
        </div>
        <Button
          variant="gold"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => {}}
        >
          Создать
        </Button>
      </motion.div>

      {/* Joined Guild Info */}
      {joinedGuild && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="glass-gold" padding="md">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-gold">
                <Shield size={24} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-lg">{joinedGuild.name}</h3>
                  <span className="text-xs px-1.5 py-0.5 bg-gold/20 text-gold rounded-full">
                    [{joinedGuild.tag}]
                  </span>
                </div>
                <p className="text-sm text-text-secondary">
                  {joinedGuild.description}
                </p>
                <div className="flex items-center space-x-4 mt-1 text-xs text-text-tertiary">
                  <span className="flex items-center">
                    <Users size={12} className="mr-1" />
                    {joinedGuild.memberCount}/{joinedGuild.maxMembers}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Guild List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-bold text-text-primary mb-3">
          Доступные гильдии
        </h2>
        <GuildList
          guilds={guilds}
          joinedGuild={joinedGuild}
          userBalance={user.obsidianBalance}
          onJoinGuild={joinGuild}
        />
      </motion.div>
    </div>
  );
};
