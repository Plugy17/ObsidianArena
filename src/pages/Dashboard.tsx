// ============================================
// Obsidian Arena — Dashboard Page
// ============================================

import { motion } from 'framer-motion';
import { Trophy, Sword, Shield, Zap, Star, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { CharacterCard } from '../components/game/CharacterCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Dashboard: React.FC = () => {
  const { user, characters, selectedCharacter, selectCharacter, setActiveTab } =
    useUser();

  if (!user || !selectedCharacter) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-neon" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="p-4 space-y-6 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <Card variant="glass-purple" padding="lg" className="text-center">
          <motion.h1
            className="text-3xl font-bold text-gradient-purple mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Добро пожаловать, {user.firstName}!
          </motion.h1>
          <motion.p
            className="text-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Твоя авантюра в Obsidian Arena начинается здесь.
          </motion.p>
        </Card>
      </motion.div>

      {/* Selected Character */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold text-text-primary mb-3 flex items-center">
          <Sparkles size={20} className="mr-2 text-gold" />
          Выбранный персонаж
        </h2>
        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <CharacterCard
              character={selectedCharacter}
              isSelected={true}
              showStats={true}
              size="lg"
            />
          </div>
        </div>
      </motion.div>

      {/* Character Selection */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold text-text-primary mb-3 flex items-center">
          <Sword size={20} className="mr-2 text-purple-neon" />
          Выбор персонажа
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              isSelected={character.isSelected}
              onSelect={() => selectCharacter(character.id)}
              showStats={true}
              size="md"
            />
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold text-text-primary mb-3 flex items-center">
          <Star size={20} className="mr-2 text-gold" />
          Быстрые действия
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button
            variant="primary"
            size="md"
            fullWidth
            icon={<Sword size={18} />}
            onClick={() => setActiveTab('arena')}
          >
            На арену
          </Button>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            icon={<Shield size={18} />}
            onClick={() => setActiveTab('inventory')}
          >
            Инвентарь
          </Button>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            icon={<Trophy size={18} />}
            onClick={() => setActiveTab('guilds')}
          >
            Гильдии
          </Button>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            icon={<Zap size={18} />}
            onClick={() => setActiveTab('market')}
          >
            Маркет
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
