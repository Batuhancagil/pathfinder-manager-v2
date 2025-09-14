'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Character {
  id: string;
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

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement actual character fetching
    setTimeout(() => {
      setCharacter({
        id: params.id as string,
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

  const getAbilityModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Character not found</h1>
          <p className="text-gray-600 mt-2">The character you're looking for doesn't exist.</p>
          <Link
            href="/characters"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
          >
            Back to Characters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{character.name}</h1>
              <p className="text-gray-600">
                {character.race} {character.class} (Level {character.level})
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href={`/characters/${character.id}/edit`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
              >
                Edit Character
              </Link>
              <Link
                href="/characters"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Back to Characters
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Basic Info */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Character Information</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Background</dt>
                      <dd className="text-sm text-gray-900">{character.background}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Alignment</dt>
                      <dd className="text-sm text-gray-900">{character.alignment}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Experience Points</dt>
                      <dd className="text-sm text-gray-900">{character.experience.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Proficiency Bonus</dt>
                      <dd className="text-sm text-gray-900">+{character.proficiencyBonus}</dd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ability Scores */}
              <div className="mt-6 bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Ability Scores</h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {Object.entries(character.abilityScores).map(([ability, score]) => (
                      <div key={ability} className="text-center">
                        <dt className="text-sm font-medium text-gray-500 capitalize">
                          {ability}
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900">{score}</dd>
                        <dd className="text-sm text-gray-600">
                          {getAbilityModifier(score) >= 0 ? '+' : ''}{getAbilityModifier(score)}
                        </dd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="mt-6 bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Skills</h2>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(character.skills).map(([skill, data]) => (
                      <div key={skill} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {skill.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="flex items-center space-x-2">
                          {data.proficient && (
                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                              Proficient
                            </span>
                          )}
                          <span className="text-sm font-bold text-gray-900">
                            +{data.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Combat Stats */}
            <div>
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Combat Stats</h2>
                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Hit Points</dt>
                      <dd className="text-2xl font-bold text-gray-900">{character.hitPoints}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Armor Class</dt>
                      <dd className="text-2xl font-bold text-gray-900">{character.armorClass}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Speed</dt>
                      <dd className="text-2xl font-bold text-gray-900">{character.speed} ft</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Initiative</dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {character.initiative >= 0 ? '+' : ''}{character.initiative}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
