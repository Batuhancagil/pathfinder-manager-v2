'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker'ı yapılandır
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File | null;
  onDataExtracted?: (data: any) => void;
}

export default function PDFViewer({ file, onDataExtracted }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      setLoading(true);
      setError('');

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        
        // İlk sayfayı render et
        await renderPage(pdf, 1);
        
        // PDF'den veri çıkarmaya çalış
        if (onDataExtracted) {
          extractDataFromPDF(pdf);
        }
      } catch (err) {
        setError('PDF yüklenirken hata oluştu');
        console.error('PDF load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [file, onDataExtracted]);

  const renderPage = async (pdf: any, pageNum: number) => {
    if (!canvasRef.current) return;

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Page render error:', err);
    }
  };

  const extractDataFromPDF = async (pdf: any) => {
    try {
      // Basit veri çıkarma - gerçek uygulamada daha gelişmiş OCR kullanılabilir
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(' ');
      
      // Karakter verilerini çıkarmaya çalış
      const extractedData = {
        text: text,
        // Burada daha gelişmiş parsing yapılabilir
        extractedAt: new Date().toISOString()
      };
      
      if (onDataExtracted) {
        onDataExtracted(extractedData);
      }
    } catch (err) {
      console.error('Data extraction error:', err);
    }
  };

  const goToPage = (pageNum: number) => {
    if (pdfDoc && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      renderPage(pdfDoc, pageNum);
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  if (!file) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-2 text-sm text-gray-500">PDF dosyası seçin</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">PDF yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-300 rounded-lg p-8 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      {/* PDF Controls */}
      <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Önceki
          </button>
          <span className="text-sm text-gray-600">
            Sayfa {currentPage} / {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sonraki →
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {file.name}
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="p-4 bg-white">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto border border-gray-200 rounded"
        />
      </div>
    </div>
  );
}
