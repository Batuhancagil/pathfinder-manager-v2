'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker setup
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface PDFEditorProps {
  file: File | null;
  pdfUrl?: string;
  onSave?: (editedPdf: File) => void;
}

interface FormField {
  id: string;
  name: string;
  value: string;
  type: 'text' | 'checkbox' | 'radio';
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export default function PDFEditor({ file, pdfUrl, onSave }: PDFEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file || pdfUrl) {
      loadPDF();
    }
  }, [file, pdfUrl]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      let pdfSource;
      
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        pdfSource = { data: arrayBuffer };
      } else if (pdfUrl) {
        pdfSource = pdfUrl;
      }

      const pdf = await pdfjsLib.getDocument(pdfSource).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      
      // Extract form fields
      await extractFormFields(pdf);
      
      // Render first page
      await renderPage(pdf, 1);
    } catch (error) {
      console.error('Error loading PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractFormFields = async (pdf: any) => {
    const fields: FormField[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      
      // This is a simplified approach - in reality, you'd need to parse
      // the PDF's form field annotations more thoroughly
      const textContent = await page.getTextContent();
      
      // Look for potential form fields in text content
      textContent.items.forEach((item: any) => {
        if (item.str && item.str.includes('_')) {
          fields.push({
            id: `field_${pageNum}_${fields.length}`,
            name: item.str,
            value: '',
            type: 'text',
            x: item.transform[4],
            y: viewport.height - item.transform[5],
            width: 100,
            height: 20,
            page: pageNum
          });
        }
      });
    }
    
    setFormFields(fields);
  };

  const renderPage = async (pdf: any, pageNum: number) => {
    if (!canvasRef.current) return;
    
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
  };

  const handleFieldClick = (field: FormField) => {
    setEditingField(field);
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormFields(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, value } : field
      )
    );
  };

  const handleSave = async () => {
    if (!pdfDoc || !onSave) return;
    
    try {
      setLoading(true);
      
      // In a real implementation, you would use PDF-lib to create a new PDF
      // with the updated form field values
      console.log('Saving PDF with form data:', formFields);
      
      // For now, we'll just show a success message
      alert('PDF saved successfully! (This is a demo - actual PDF generation would require PDF-lib)');
      
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('Error saving PDF');
    } finally {
      setLoading(false);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      renderPage(pdfDoc, currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      renderPage(pdfDoc, currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Loading PDF...</span>
      </div>
    );
  }

  if (!pdfDoc) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No PDF loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PDF Viewer */}
      <div className="relative border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{ maxHeight: '600px' }}
        />
        
        {/* Form Fields Overlay */}
        {formFields
          .filter(field => field.page === currentPage)
          .map(field => (
            <div
              key={field.id}
              className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-50 cursor-pointer"
              style={{
                left: `${field.x}px`,
                top: `${field.y}px`,
                width: `${field.width}px`,
                height: `${field.height}px`,
              }}
              onClick={() => handleFieldClick(field)}
            >
              <input
                type="text"
                value={field.value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                className="w-full h-full bg-transparent border-none outline-none text-sm"
                placeholder={field.name}
              />
            </div>
          ))}
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save PDF'}
        </button>
      </div>

      {/* Form Fields List */}
      {formFields.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Form Fields</h3>
          <div className="space-y-2">
            {formFields.map(field => (
              <div key={field.id} className="flex items-center space-x-2">
                <label className="text-sm font-medium w-32">{field.name}:</label>
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Enter value"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
