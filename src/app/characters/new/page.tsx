'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const PDFUpload = dynamic(() => import('../../../components/PDF/PDFUpload'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
});

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

export default function NewCharacterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPDF, setSelectedPDF] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

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

  const handlePDFSelect = (file: File | null) => {
    setSelectedPDF(file);
  };

  const handleDataExtracted = (data: any) => {
    setExtractedData(data);
    console.log('Extracted data from PDF:', data);
    
    // PDF'den çıkarılan verileri form'a otomatik doldur
    if (data.text) {
      const text = data.text;
      
      // Pathfinder specific parsing
      const extractedInfo = parsePathfinderCharacterSheet(text);
      
      if (extractedInfo.name) {
        setFormData(prev => ({ ...prev, name: extractedInfo.name }));
      }
      
      if (extractedInfo.race) {
        setFormData(prev => ({ ...prev, race: extractedInfo.race }));
      }
      
      if (extractedInfo.class) {
        setFormData(prev => ({ ...prev, class: extractedInfo.class }));
      }
      
      if (extractedInfo.level) {
        setFormData(prev => ({ ...prev, level: extractedInfo.level }));
      }
      
      if (extractedInfo.background) {
        setFormData(prev => ({ ...prev, background: extractedInfo.background }));
      }
      
      if (extractedInfo.alignment) {
        setFormData(prev => ({ ...prev, alignment: extractedInfo.alignment }));
      }
      
      if (extractedInfo.abilityScores) {
        setFormData(prev => ({ 
          ...prev, 
          abilityScores: { ...prev.abilityScores, ...extractedInfo.abilityScores }
        }));
      }
      
      if (extractedInfo.hitPoints) {
        setFormData(prev => ({ ...prev, hitPoints: extractedInfo.hitPoints }));
      }
      
      if (extractedInfo.armorClass) {
        setFormData(prev => ({ ...prev, armorClass: extractedInfo.armorClass }));
      }
      
      if (extractedInfo.speed) {
        setFormData(prev => ({ ...prev, speed: extractedInfo.speed }));
      }
    }
  };

  const parsePathfinderCharacterSheet = (text: string) => {
    const result: any = {};
    
    // Character Name - look for "Character Name" followed by text
    const nameMatch = text.match(/Character Name\s+([A-Za-z\s]+)/i);
    if (nameMatch) {
      result.name = nameMatch[1].trim();
    }
    
    // Level - look for "Level" followed by number
    const levelMatch = text.match(/Level\s+(\d+)/i);
    if (levelMatch) {
      result.level = parseInt(levelMatch[1]);
    }
    
    // Hit Points - look for "Hit Points" or "HP" followed by number
    const hpMatch = text.match(/(?:Hit Points|HP)\s+(\d+)/i);
    if (hpMatch) {
      result.hitPoints = parseInt(hpMatch[1]);
    }
    
    // Armor Class - look for "Armor Class" followed by number
    const acMatch = text.match(/Armor Class\s+(\d+)/i);
    if (acMatch) {
      result.armorClass = parseInt(acMatch[1]);
    }
    
    // Speed - look for "Speed" followed by number and "feet"
    const speedMatch = text.match(/Speed\s+(\d+)\s*feet/i);
    if (speedMatch) {
      result.speed = parseInt(speedMatch[1]);
    }
    
    // Ability Scores - look for specific patterns
    const abilityScores: any = {};
    
    // Strength
    const strMatch = text.match(/Strength\s+(\d+)/i);
    if (strMatch) {
      abilityScores.strength = parseInt(strMatch[1]);
    }
    
    // Dexterity
    const dexMatch = text.match(/Dexterity\s+(\d+)/i);
    if (dexMatch) {
      abilityScores.dexterity = parseInt(dexMatch[1]);
    }
    
    // Constitution
    const conMatch = text.match(/Constitution\s+(\d+)/i);
    if (conMatch) {
      abilityScores.constitution = parseInt(conMatch[1]);
    }
    
    // Intelligence
    const intMatch = text.match(/Intelligence\s+(\d+)/i);
    if (intMatch) {
      abilityScores.intelligence = parseInt(intMatch[1]);
    }
    
    // Wisdom
    const wisMatch = text.match(/Wisdom\s+(\d+)/i);
    if (wisMatch) {
      abilityScores.wisdom = parseInt(wisMatch[1]);
    }
    
    // Charisma
    const chaMatch = text.match(/Charisma\s+(\d+)/i);
    if (chaMatch) {
      abilityScores.charisma = parseInt(chaMatch[1]);
    }
    
    if (Object.keys(abilityScores).length > 0) {
      result.abilityScores = abilityScores;
    }
    
    // Race detection - look for common Pathfinder races
    const races = [
      'human', 'elf', 'dwarf', 'halfling', 'gnome', 'half-orc', 'tiefling',
      'aasimar', 'catfolk', 'changeling', 'dhampir', 'duskwalker', 'fetchling',
      'goblin', 'hobgoblin', 'kobold', 'leshy', 'lizardfolk', 'orc', 'ratfolk',
      'tengu', 'undine', 'versatile heritage'
    ];
    
    const foundRace = races.find(race => 
      text.toLowerCase().includes(race.toLowerCase())
    );
    if (foundRace) {
      result.race = foundRace;
    }
    
    // Class detection - look for common Pathfinder classes
    const classes = [
      'alchemist', 'barbarian', 'bard', 'champion', 'cleric', 'druid',
      'fighter', 'gunslinger', 'inventor', 'investigator', 'kineticist',
      'magus', 'monk', 'oracle', 'psychic', 'ranger', 'rogue', 'sorcerer',
      'summoner', 'swashbuckler', 'thaumaturge', 'witch', 'wizard'
    ];
    
    const foundClass = classes.find(cls => 
      text.toLowerCase().includes(cls.toLowerCase())
    );
    if (foundClass) {
      result.class = foundClass;
    }
    
    // Background detection
    const backgrounds = [
      'acolyte', 'acrobat', 'animal whisperer', 'artisan', 'barkeep',
      'barrister', 'bounty hunter', 'charlatan', 'criminal', 'cultist',
      'detective', 'diplomat', 'field medic', 'fortune teller', 'gambler',
      'gladiator', 'guard', 'herbalist', 'hermit', 'hunter', 'laborer',
      'merchant', 'noble', 'nomad', 'occultist', 'pilot', 'pirate',
      'prisoner', 'scholar', 'scout', 'sailor', 'soldier', 'street urchin',
      'tinker', 'warrior'
    ];
    
    const foundBackground = backgrounds.find(bg => 
      text.toLowerCase().includes(bg.toLowerCase())
    );
    if (foundBackground) {
      result.background = foundBackground;
    }
    
    // Alignment detection
    const alignments = [
      'lawful good', 'neutral good', 'chaotic good',
      'lawful neutral', 'neutral', 'chaotic neutral',
      'lawful evil', 'neutral evil', 'chaotic evil'
    ];
    
    const foundAlignment = alignments.find(align => 
      text.toLowerCase().includes(align.toLowerCase())
    );
    if (foundAlignment) {
      result.alignment = foundAlignment.replace(' ', '-');
    }
    
    console.log('Parsed character data:', result);
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: Implement actual character creation with PDF upload
      const characterData = {
        ...formData,
        pdfFile: selectedPDF,
        extractedData: extractedData
      };
      
      console.log('Creating character with PDF:', characterData);
      
      // For now, just redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to create character. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Character</h1>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* PDF Upload */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">PDF Karakter Sayfası</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Mevcut karakter sayfanızı PDF olarak yükleyin. Sistem otomatik olarak verileri çıkarmaya çalışacak.
                </p>
                <PDFUpload 
                  onFileSelect={handlePDFSelect}
                  onDataExtracted={handleDataExtracted}
                />
                
                {/* Extracted Data Display */}
                {extractedData && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-sm font-medium text-green-800 mb-2">
                      ✅ PDF'den Veri Çıkarıldı
                    </h3>
                    <p className="text-sm text-green-700">
                      PDF analiz edildi ve form otomatik olarak dolduruldu. 
                      Gerekirse manuel olarak düzenleyebilirsiniz.
                    </p>
                    {extractedData.text && (
                      <details className="mt-2">
                        <summary className="text-xs text-green-600 cursor-pointer">
                          Çıkarılan metni göster
                        </summary>
                        <pre className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border max-h-32 overflow-y-auto">
                          {extractedData.text.substring(0, 500)}...
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>

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
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Character'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
