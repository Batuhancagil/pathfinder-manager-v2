'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const AdvancedPDFEditor = dynamic(() => import('../../components/PDF/AdvancedPDFEditor'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
});

export default function TestPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setMessage('PDF loaded successfully!');
    } else {
      setMessage('Please select a valid PDF file.');
    }
  };

  const handleSave = (editedFile: File) => {
    setMessage(`PDF saved successfully! File size: ${editedFile.size} bytes`);
    console.log('Saved file:', editedFile);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">PDF Editor Test</h1>
            
            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select PDF File
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            {/* Message */}
            {message && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{message}</p>
              </div>
            )}

            {/* PDF Editor */}
            {file && (
              <AdvancedPDFEditor
                file={file}
                onSave={handleSave}
              />
            )}

            {/* Instructions */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Test Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Fillable PDF dosyası seçin</li>
                <li>Form alanlarını düzenleyin</li>
                <li>"Save Changes" butonuna tıklayın</li>
                <li>Console'da kaydedilen dosyayı kontrol edin</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
