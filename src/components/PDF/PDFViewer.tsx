'use client';

import React, { useState } from 'react';

interface PDFViewerProps {
  file: File | null;
  pdfUrl?: string;
}

export default function PDFViewer({ file, pdfUrl }: PDFViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // File değiştiğinde yeni URL oluştur
  React.useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url); // Cleanup
    } else if (pdfUrl) {
      setObjectUrl(pdfUrl);
    } else {
      setObjectUrl(null);
    }
  }, [file, pdfUrl]);

  if (!file && !pdfUrl) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-2 text-sm text-gray-500">PDF dosyası seçin</p>
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">PDF yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      {/* PDF Header */}
      <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
        <div className="text-sm text-gray-600">
          PDF Görüntüleyici
        </div>
        <div className="text-sm text-gray-500">
          {file?.name || 'PDF Dosyası'}
        </div>
      </div>

      {/* PDF iframe */}
      <div className="p-4 bg-white">
        <iframe
          src={objectUrl}
          className="w-full h-96 border border-gray-200 rounded"
          title="PDF Viewer"
        />
      </div>
    </div>
  );
}
