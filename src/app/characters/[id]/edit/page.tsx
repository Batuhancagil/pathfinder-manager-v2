'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const AdvancedPDFEditor = dynamic(() => import('../../../../components/PDF/AdvancedPDFEditor'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
});

interface Character {
  _id: string;
  name: string;
  pdfUrl: string;
  pdfFileName: string;
  createdAt: string;
}

export default function EditCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [characterId, setCharacterId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setCharacterId(resolvedParams.id);
      fetchCharacter(resolvedParams.id);
    };
    getParams();
  }, [params]);

  const fetchCharacter = async (id: string) => {
    try {
      const response = await fetch(`/api/characters/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCharacter(data.character);
      } else {
        setError('Character not found');
      }
    } catch (err) {
      setError('Failed to fetch character');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (editedFile: File) => {
    try {
      setSaving(true);
      
      const formData = new FormData();
      formData.append('pdfFile', editedFile);
      formData.append('characterName', character?.name || '');

      const response = await fetch(`/api/characters/${characterId}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save character');
      }
    } catch (err) {
      setError('Failed to save character');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Character</h1>
              <div className="text-red-600">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Character: {character.name}
              </h1>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <AdvancedPDFEditor
              pdfUrl={character.pdfUrl}
              onSave={handleSave}
            />

            {saving && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span>Saving character...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}