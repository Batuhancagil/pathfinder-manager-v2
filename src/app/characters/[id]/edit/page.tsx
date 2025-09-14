'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface CharacterFormData {
  name: string;
  race: string;
  class: string;
  level: number;
  background: string;
  alignment: string;
  experience: number;
  hitPoints: number;
  armorClass: number;
  speed: number;
  initiative: number;
  proficiencyBonus: number;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  skills: {
    [key: string]: {
      value: number;
      proficient: boolean;
    };
  };
}

const SKILLS = [
  'acrobatics', 'animalHandling', 'arcana', 'athletics', 'deception',
  'history', 'insight', 'intimidation', 'investigation', 'medicine',
  'nature', 'perception', 'performance', 'persuasion', 'religion',
  'sleightOfHand', 'stealth', 'survival'
];

export default function EditCharacterPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    race: '',
    class: '',
    level: 1,
    background: '',
    alignment: '',
    experience: 0,
    hitPoints: 0,
    armorClass: 10,
    speed: 30,
    initiative: 0,
    proficiencyBonus: 2,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    },
    skills: {}
  });

  useEffect(() => {
    // TODO: Implement actual character fetching
    setTimeout(() => {
      setFormData({
        name: 'Aragorn',
        race: 'Human',
        class: 'Ranger',
        level: 5,
        background: 'Folk Hero',
        alignment: 'Lawful Good',
        experience: 6500,
        hitPoints: 45,
        armorClass: 16,
        speed: 30,
        initiative: 3,
        proficiencyBonus: 3,
        abilityScores: {
          strength: 16,
          dexterity: 14,
          constitution: 14,
          intelligence: 12,
          wisdom: 15,
          charisma: 13
        },
        skills: {
          athletics: { value: 6, proficient: true },
          perception: { value: 6, proficient: true },
          survival: { value: 6, proficient: true }
        }
      });
      setLoading(false);
    }, 1000);
  }, [params.id]);

  const handleInputChange = (field: string, value: string | number) => {
    if (field.startsWith('abilityScores.')) {
      const ability = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        abilityScores: {
          ...prev.abilityScores,
          [ability]: value as number
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSkillChange = (skillName: string, field: 'value' | 'proficient', value: unknown) => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillName]: {
          value: field === 'value' ? (value as number) : (prev.skills?.[skillName]?.value || 0),
          proficient: field === 'proficient' ? (value as boolean) : (prev.skills?.[skillName]?.proficient || false)
        }
      }
    }));
  };

  const getAbilityModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // TODO: Implement actual character update
      console.log('Updating character:', formData);
      
      // For now, just redirect to character detail
      router.push(`/characters/${params.id}`);
    } catch (err) {
      setError('Failed to update character. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Character</h1>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Character Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Race</label>
                    <select
                      value={formData.race}
                      onChange={(e) => handleInputChange('race', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select Race</option>
                      <option value="human">Human</option>
                      <option value="elf">Elf</option>
                      <option value="dwarf">Dwarf</option>
                      <option value="halfling">Halfling</option>
                      <option value="gnome">Gnome</option>
                      <option value="half-orc">Half-Orc</option>
                      <option value="tiefling">Tiefling</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Class</label>
                    <select
                      value={formData.class}
                      onChange={(e) => handleInputChange('class', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select Class</option>
                      <option value="barbarian">Barbarian</option>
                      <option value="bard">Bard</option>
                      <option value="cleric">Cleric</option>
                      <option value="druid">Druid</option>
                      <option value="fighter">Fighter</option>
                      <option value="monk">Monk</option>
                      <option value="paladin">Paladin</option>
                      <option value="ranger">Ranger</option>
                      <option value="rogue">Rogue</option>
                      <option value="sorcerer">Sorcerer</option>
                      <option value="warlock">Warlock</option>
                      <option value="wizard">Wizard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Level</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.level}
                      onChange={(e) => handleInputChange('level', parseInt(e.target.value))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Background</label>
                    <select
                      value={formData.background}
                      onChange={(e) => handleInputChange('background', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Select Background</option>
                      <option value="acolyte">Acolyte</option>
                      <option value="criminal">Criminal</option>
                      <option value="folk-hero">Folk Hero</option>
                      <option value="noble">Noble</option>
                      <option value="sage">Sage</option>
                      <option value="soldier">Soldier</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Alignment</label>
                    <select
                      value={formData.alignment}
                      onChange={(e) => handleInputChange('alignment', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Select Alignment</option>
                      <option value="lawful-good">Lawful Good</option>
                      <option value="neutral-good">Neutral Good</option>
                      <option value="chaotic-good">Chaotic Good</option>
                      <option value="lawful-neutral">Lawful Neutral</option>
                      <option value="neutral">Neutral</option>
                      <option value="chaotic-neutral">Chaotic Neutral</option>
                      <option value="lawful-evil">Lawful Evil</option>
                      <option value="neutral-evil">Neutral Evil</option>
                      <option value="chaotic-evil">Chaotic Evil</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ability Scores */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Ability Scores</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {Object.entries(formData.abilityScores).map(([ability, score]) => (
                    <div key={ability} className="text-center">
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {ability}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={score}
                        onChange={(e) => handleInputChange(`abilityScores.${ability}`, parseInt(e.target.value))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center"
                      />
                      <div className="mt-1 text-sm text-gray-500">
                        {getAbilityModifier(score) >= 0 ? '+' : ''}{getAbilityModifier(score)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Skills</h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {SKILLS.map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.skills[skill]?.proficient || false}
                        onChange={(e) => handleSkillChange(skill, 'proficient', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700 capitalize">
                        {skill.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <input
                        type="number"
                        value={formData.skills[skill]?.value || 0}
                        onChange={(e) => handleSkillChange(skill, 'value', parseInt(e.target.value))}
                        className="w-16 text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Combat Stats */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Combat Stats</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hit Points</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.hitPoints}
                      onChange={(e) => handleInputChange('hitPoints', parseInt(e.target.value))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Armor Class</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.armorClass}
                      onChange={(e) => handleInputChange('armorClass', parseInt(e.target.value))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Speed</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.speed}
                      onChange={(e) => handleInputChange('speed', parseInt(e.target.value))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Initiative</label>
                    <input
                      type="number"
                      value={formData.initiative}
                      onChange={(e) => handleInputChange('initiative', parseInt(e.target.value))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}

              <div className="flex justify-end space-x-4">
                <Link
                  href={`/characters/${params.id}`}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
