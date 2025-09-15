'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const PDFUpload = dynamic(() => import('../../../components/PDF/PDFUpload'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
});


export default function NewCharacterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPDF, setSelectedPDF] = useState<File | null>(null);


  const handlePDFSelect = (file: File | null) => {
    setSelectedPDF(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // TODO: Implement actual character creation with PDF upload
      const characterData = {
        pdfFile: selectedPDF
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
            <p className="text-sm text-gray-500 mb-4">Version: 2.0 - PDF Only</p>
            
            {/* PDF Upload */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">PDF Karakter Sayfası</h2>
              <p className="text-sm text-gray-600 mb-4">
                Mevcut karakter sayfanızı PDF olarak yükleyin. PDF dosyası kaydedilecek ve görüntülenecektir.
              </p>
              <PDFUpload 
                onFileSelect={handlePDFSelect}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedPDF}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Character'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
