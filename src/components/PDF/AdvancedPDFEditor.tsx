'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, PDFForm, PDFTextField } from 'pdf-lib';

interface AdvancedPDFEditorProps {
  file?: File | null;
  pdfUrl?: string;
  onSave?: (editedPdf: File) => void;
}

interface FormField {
  name: string;
  value: string;
  type: 'text' | 'checkbox' | 'radio';
}

export default function AdvancedPDFEditor({ file, pdfUrl, onSave }: AdvancedPDFEditorProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (file || pdfUrl) {
      loadPDF();
    }
  }, [file, pdfUrl]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      let pdfBytes;
      
      if (file) {
        pdfBytes = await file.arrayBuffer();
      } else if (pdfUrl) {
        const response = await fetch(pdfUrl);
        pdfBytes = await response.arrayBuffer();
      }

      if (!pdfBytes) return;

      const pdfDoc = await PDFDocument.load(pdfBytes);
      setPdfDoc(pdfDoc);

      // Extract form fields
      const form = pdfDoc.getForm();
      const fields: FormField[] = [];

      // Get form field names
      const fieldNames = form.getFields().map(field => field.getName());
      
      fieldNames.forEach(fieldName => {
        try {
          const field = form.getField(fieldName);
          if (field instanceof PDFTextField) {
            fields.push({
              name: fieldName,
              value: field.getText() || '',
              type: 'text'
            });
          } else {
            // For other field types, try to get value
            fields.push({
              name: fieldName,
              value: '',
              type: 'text'
            });
          }
        } catch (error) {
          console.warn(`Could not process field ${fieldName}:`, error);
        }
      });

      setFormFields(fields);
    } catch (error) {
      console.error('Error loading PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormFields(prev => 
      prev.map(field => 
        field.name === fieldName ? { ...field, value } : field
      )
    );
  };

  const handleSave = async () => {
    if (!pdfDoc || !onSave) return;
    
    try {
      setSaving(true);
      
      // Create a copy of the PDF document
      const pdfBytes = await pdfDoc.save();
      const newPdfDoc = await PDFDocument.load(pdfBytes);
      const form = newPdfDoc.getForm();

      // Update form fields
      formFields.forEach(field => {
        try {
          const formField = form.getField(field.name);
          if (formField instanceof PDFTextField) {
            formField.setText(field.value);
          }
          // Add other field types as needed
        } catch (error) {
          console.warn(`Could not update field ${field.name}:`, error);
        }
      });

      // Generate the updated PDF
      const updatedPdfBytes = await newPdfDoc.save();
      
      // Create a new File object
      const fileName = file?.name || 'edited-character.pdf';
      const editedFile = new File([updatedPdfBytes as unknown as ArrayBuffer], fileName, { type: 'application/pdf' });
      
      // Call the save callback
      onSave(editedFile);
      
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('Error saving PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfDoc) return;
    
    try {
      setSaving(true);
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = file?.name || 'edited-character.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      {/* PDF Preview */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h3 className="text-lg font-medium">PDF Preview</h3>
        </div>
        <div className="p-4">
          <iframe
            ref={iframeRef}
            src={file ? URL.createObjectURL(file) : pdfUrl}
            className="w-full h-96 border border-gray-200 rounded"
            title="PDF Preview"
          />
        </div>
      </div>

      {/* Form Fields Editor */}
      {formFields.length > 0 ? (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Edit Form Fields</h3>
          <div className="space-y-4">
            {formFields.map((field, index) => (
              <div key={index} className="flex items-center space-x-4">
                <label className="text-sm font-medium w-48 text-gray-700">
                  {field.name}:
                </label>
                {field.type === 'text' ? (
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter value"
                  />
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={field.value === 'true'}
                      onChange={(e) => handleFieldChange(field.name, e.target.checked ? 'true' : 'false')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Checked</span>
                  </label>
                ) : (
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter value"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No fillable form fields found in this PDF. You can still view the PDF, but editing is not available.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleDownload}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Download PDF
        </button>
        <button
          onClick={handleSave}
          disabled={saving || formFields.length === 0}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
