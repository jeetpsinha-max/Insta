import React, { useState, useEffect } from 'react';
import { FileText, Search, X, ExternalLink, Check, RefreshCw, Sparkles, Link2 } from 'lucide-react';
import { GoogleDocItem } from '../types';

interface GoogleDocPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoc: (doc: { id: string; title: string; text: string; webViewLink?: string }) => void;
}

export const GoogleDocPickerModal: React.FC<GoogleDocPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectDoc
}) => {
  const [docs, setDocs] = useState<GoogleDocItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [docUrlInput, setDocUrlInput] = useState<string>('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadDocsList();
    }
  }, [isOpen]);

  const loadDocsList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/docs/list');
      const data = await res.json();
      if (data.docs) {
        setDocs(data.docs);
        if (data.docs.length > 0 && !selectedDocId) {
          handleSelectDocItem(data.docs[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load Google Docs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDocItem = async (doc: GoogleDocItem) => {
    setSelectedDocId(doc.id);
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/docs/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: doc.id })
      });
      const data = await res.json();
      setPreviewText(data.text || '');
    } catch (err) {
      setPreviewText(doc.contentSnippet || 'Unable to preview text');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCustomUrlImport = async () => {
    if (!docUrlInput.trim()) return;
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/docs/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docUrl: docUrlInput })
      });
      const data = await res.json();
      if (data.id) {
        onSelectDoc({
          id: data.id,
          title: data.title || 'Imported Google Doc',
          text: data.text || '',
          webViewLink: data.webViewLink
        });
        onClose();
      }
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmDoc = () => {
    const currentDoc = docs.find(d => d.id === selectedDocId);
    if (currentDoc) {
      onSelectDoc({
        id: currentDoc.id,
        title: currentDoc.title,
        text: previewText,
        webViewLink: currentDoc.webViewLink
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  const filteredDocs = docs.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.contentSnippet && d.contentSnippet.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div id="google-doc-picker-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Select Google Document</h3>
              <p className="text-xs text-slate-400">Import your document content to spark Gemini social posts</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Left Column: Doc List & Search */}
          <div className="md:col-span-5 flex flex-col h-full overflow-hidden border-r border-slate-800 pr-0 md:pr-4">
            
            {/* Direct Doc URL Paste */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center">
                <Link2 className="w-3.5 h-3.5 mr-1 text-blue-400" /> Paste Google Doc Link
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="https://docs.google.com/document/d/..."
                  value={docUrlInput}
                  onChange={(e) => setDocUrlInput(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleCustomUrlImport}
                  disabled={!docUrlInput.trim() || previewLoading}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all"
                >
                  Fetch
                </button>
              </div>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Google Docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Docs List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mb-2" />
                  <span>Loading Google Docs from Drive...</span>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No documents found matching "{searchQuery}"
                </div>
              ) : (
                filteredDocs.map((doc) => {
                  const isSelected = selectedDocId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDocItem(doc)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-md'
                          : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-blue-400'}`} />
                          <h4 className="font-semibold text-xs line-clamp-1">{doc.title}</h4>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-1" />}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 pl-6">
                        {doc.contentSnippet}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Doc Preview & Confirm */}
          <div className="md:col-span-7 flex flex-col h-full overflow-hidden bg-slate-950/50 rounded-xl p-4 border border-slate-800">
            <h4 className="font-semibold text-xs text-slate-300 mb-2 flex items-center justify-between">
              <span>DOCUMENT CONTENT PREVIEW</span>
              {selectedDocId && (
                <a
                  href={`https://docs.google.com/document/d/${selectedDocId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center text-[11px]"
                >
                  Open in Google Docs <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </h4>

            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mb-2" />
                  <span>Extracting document text...</span>
                </div>
              ) : previewText ? (
                previewText
              ) : (
                <span className="text-slate-500 italic">Select a Google Doc from the left panel to preview content.</span>
              )}
            </div>

            {/* Footer buttons */}
            <div className="mt-4 flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDoc}
                disabled={!selectedDocId || previewLoading}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Import into Gemini Spark</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
