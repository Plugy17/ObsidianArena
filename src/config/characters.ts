// ============================================
// Obsidian Arena — Character Definitions
// ============================================

export type Role = 'Tank' | 'Fighter' | 'Assassin' | 'Mage' | 'Marksman' | 'Support';
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface Ability {
  key: 'Q' | 'W' | 'E' | 'R';
  name: string;
  description: string;
}

export interface Character {
  id: string;
  name: string;
  role: Role;
  rarity: Rarity;
  stats: { hp: number; atk: number; def: number; spd: number };
  abilities: Ability[];
  avatar: string;
}

export const characters: Character[] = [
  {
    id: 'knight',
    name: 'Obsidian Knight',
    role: 'Tank',
    rarity: 'Legendary',
    stats: { hp: 4200, atk: 170, def: 290, spd: 82 },
    abilities: [
      { key: 'Q', name: 'Shield Slam', description: 'Снижает урон и оглушает.' },
      { key: 'W', name: 'Iron Wall', description: 'Увеличивает защиту союзников.' },
      { key: 'E', name: 'Charge', description: 'Рывок к цели с провокацией.' },
      { key: 'R', name: 'Fortress', description: 'Барикад вокруг Нескуса.' },
    ],
    avatar: '/avatars/obsidian-knight.png',
  },
  {
    id: 'zara',
    name: 'Заряза',
    role: 'Assassin',
    rarity: 'Legendary',
    stats: { hp: 2800, atk: 310, def: 120, spd: 145 },
    abilities: [
      { key: 'Q', name: 'Shadow Step', description: 'Мгновенный рывок за спину врага.' },
      { key: 'W', name: 'Poison Blade', description: 'Наносит урон и отравление.' },
      { key: 'E', name: 'Dodge', description: 'Уклонение от атаки с контратем.' },
      { key: 'R', name: 'Death Mark', description: 'Помечает врага и наносит массовый урон.' },
    ],
    avatar: '/avatars/zara.png',
  },
  {
    id: 'broneboi',
    name: 'Бронебой',
    role: 'Tank',
    rarity: 'Epic',
    stats: { hp: 3800, atk: 140, def: 260, spd: 75 },
    abilities: [
      { key: 'Q', name: 'Heavy Smash', description: 'Наносит урон и замедляет.' },
      { key: 'W', name: 'Shield Bash', description: 'Оглушает цель и блокирует урон.' },
      { key: 'E', name: 'Taunt', description: 'Привлекает внимание врагов.' },
      { key: 'R', name: 'Unstoppable', description: 'Неуязвимость на 4 секунды.' },
    ],
    avatar: '/avatars/broneboi.png',
  },
  {
    id: 'luna',
    name: 'Лунная Стихия',
    role: 'Support',
    rarity: 'Rare',
    stats: { hp: 2200, atk: 95, def: 110, spd: 120 },
    abilities: [
      { key: 'Q', name: 'Moon Beam', description: 'Луч лунного света с лечением.' },
      { key: 'W', name: 'Protective Aura', description: 'Аура защиты для союзников.' },
      { key: 'E', name: 'Teleport', description: 'Мгновенное перемещение к союзнику.' },
      { key: 'R', name: 'Lunar Blessing', description: 'Воскрешает и лечит всех союзников.' },
    ],
    avatar: '/avatars/luna.png',
  },
  {
    id: 'pyromancer',
    name: 'Пиромант',
    role: 'Mage',
    rarity: 'Epic',
    stats: { hp: 2400, atk: 280, def: 95, spd: 100 },
    abilities: [
      { key: 'Q', name: 'Fireball', description: 'Огненный шар с высоким уроном.' },
      { key: 'W', name: 'Flame Wall', description: 'Стена огня, замедляющая врагов.' },
      { key: 'E', name: 'Ignite', description: 'Зажигает цель на 5 секунд.' },
      { key: 'R', name: 'Meteor Strike', description: 'Метеоритный дождь с огромным уроном.' },
    ],
    avatar: '/avatars/pyromancer.png',
  },
  {
    id: 'hunter',
    name: 'Лесной Охотник',
    role: 'Marksman',
    rarity: 'Rare',
    stats: { hp: 2300, atk: 260, def: 100, spd: 130 },
    abilities: [
      { key: 'Q', name: 'Precise Shot', description: ' Точечный выстрел с пробиванием.' },
      { key: 'W', name: 'Rapid Fire', description: ' Быстрая очередь из 3 выстрелов.' },
      { key: 'E', name: 'Escape', description: 'Отодвигает врага и уходит назад.' },
      { key: 'R', name: 'Barrage', description: 'Автоматический огонь по всем врагам.' },
    ],
    avatar: '/avatars/hunter.png',
  },
  {
    id: 'shadow-walker',
    name: 'Теневой Странник',
    role: 'Assassin',
    rarity: 'Epic',
    stats: { hp: 2500, atk: 290, def: 110, spd: 155 },
    abilities: [
      { key: 'Q', name: 'Shadow Blink', description: 'Исчезает и атакует с тени.' },
      { key: 'W', name: 'Shadow Clone', description: 'Создаёт клон-приманку.' },
      { key: 'E', name: 'Silent Strike', description: 'Наносит урон без оповещения.' },
      { key: 'R', name: 'Nightmare', description: 'Помещает всех врагов во сон.' },
    ],
    avatar: '/avatars/shadow-walker.png',
  },
  {
    id: 'storm-caller',
    name: 'Призрачный Буревестник',
    role: 'Mage',
    rarity: 'Legendary',
    stats: { hp: 2600, atk: 320, def: 105, spd: 115 },
    abilities: [
      { key: 'Q', name: 'Lightning Bolt', description: 'Молния с цепочкой.' },
      { key: 'W', name: 'Static Field', description: 'Поле статического электричества.' },
      { key: 'E', name: 'Thunderclap', description: 'Удар молнией в точке.' },
      { key: 'R', name: 'Storm', description: 'Бесконечный шторм на 8 секунд.' },
    ],
    avatar: '/avatars/storm-caller.png',
  },
  {
    id: 'berserker',
    name: 'Бerserker',
    role: 'Fighter',
    rarity: 'Rare',
    stats: { hp: 3400, atk: 240, def: 180, spd: 110 },
    abilities: [
      { key: 'Q', name: 'Cleave', description: 'Разрезает всех врагов в радиусе.' },
      { key: 'W', name: 'Rage', description: 'Увеличивает урон при низком HP.' },
      { key: 'E', name: 'Execute', description: 'Мгновенно убивает цель с HP < 20%.' },
      { key: 'R', name: 'Frenzy', description: 'Скорость атаки x3 на 6 секунд.' },
    ],
    avatar: '/avatars/berserker.png',
  },
  {
    id: 'frost-weaver',
    name: 'Холодный Плетёж',
    role: 'Mage',
    rarity: 'Epic',
    stats: { hp: 2300, atk: 270, def: 100, spd: 105 },
    abilities: [
      { key: 'Q', name: 'Ice Shard', description: 'Ледяной оскол с замедлением.' },
      { key: 'W', name: 'Frozen Ground', description: 'Замораживает землю под ногами.' },
      { key: 'E', name: 'Ice Block', description: 'Неуязвимость на 3 секунды.' },
      { key: 'R', name: 'Blizzard', description: 'Метель с непрерывным уроном.' },
    ],
    avatar: '/avatars/frost-weaver.png',
  },
  {
    id: 'lightbringer',
    name: 'Несущий Света',
    role: 'Support',
    rarity: 'Legendary',
    stats: { hp: 2800, atk: 150, def: 160, spd: 125 },
    abilities: [
      { key: 'Q', name: 'Divine Light', description: 'Световой луч с исцелением.' },
      { key: 'W', name: 'Sanctuary', description: 'Щит, поглощающий урон.' },
      { key: 'E', name: 'Purify', description: 'Очищает и лечит союзника.' },
      { key: 'R', name: 'Resurrection', description: 'Воскрешает союзника с 50% HP.' },
    ],
    avatar: '/avatars/lightbringer.png',
  },
  {
    id: 'void-reaper',
    name: 'Жнец Пустоты',
    role: 'Fighter',
    rarity: 'Legendary',
    stats: { hp: 3600, atk: 280, def: 200, spd: 135 },
    abilities: [
      { key: 'Q', name: 'Void Slash', description: 'Резак из тьмы с оттягиванием.' },
      { key: 'W', name: 'Dimensional Rift', description: 'Создаёт разлом в пространстве.' },
      { key: 'E', name: 'Life Steal', description: 'Кражет HP у цели.' },
      { key: 'R', name: 'Apocalypse', description: 'Массовый урон и замедление врагов.' },
    ],
    avatar: '/avatars/void-reaper.png',
  },
  {
    id: 'thunder-guard',
    name: 'Громохран',
    role: 'Tank',
    rarity: 'Epic',
    stats: { hp: 4000, atk: 160, def: 280, spd: 85 },
    abilities: [
      { key: 'Q', name: 'Thunder Clap', description: 'Удар молнией с оглушением.' },
      { key: 'W', name: 'Lightning Shield', description: 'Щит из молний с отражением.' },
      { key: 'E', name: 'Ground Slam', description: 'Наносит урон и замедляет.' },
      { key: 'R', name: 'Storm Armor', description: 'Броня из бури на 10 секунд.' },
    ],
    avatar: '/avatars/thunder-guard.png',
  },
];
