import React, { useState, useRef } from 'react';
import { storage, auth } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, CheckCircle2, Loader2, Video as VideoIcon, Plus } from 'lucide-react';

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

interface Props {
  onUploadComplete: (uploads: { url: string; fileName: string }[]) => void;
}

export default function VideoUpload({ onUploadComplete }: Props) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: UploadingFile[] = selectedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file: file as File,
      progress: 0,
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startUploads = async () => {
    if (files.length === 0 || !auth.currentUser) return;
    setIsUploading(true);

    const uploadPromises = files.map(fileObj => {
      if (fileObj.status !== 'pending') return Promise.resolve(null);

      return new Promise<{ url: string; fileName: string } | null>((resolve) => {
        const storageRef = ref(storage, `uploads/${auth.currentUser!.uid}/${Date.now()}_${fileObj.file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, fileObj.file);

        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'uploading' } : f));

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress: p } : f));
          },
          (err) => {
            setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error', error: err.message } : f));
            resolve(null);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'completed', url: downloadURL, progress: 100 } : f));
            resolve({ url: downloadURL, fileName: fileObj.file.name });
          }
        );
      });
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((r): r is { url: string; fileName: string } => r !== null);
    
    if (successfulUploads.length > 0) {
      onUploadComplete(successfulUploads);
    }
    setIsUploading(false);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="w-full space-y-6">
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center transition-all cursor-pointer group ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400 hover:bg-indigo-50/30'}`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*"
          multiple
          className="hidden"
        />
        <div className="bg-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Add Video Sources</h3>
        <p className="text-slate-500 text-sm mt-1">Select one or multiple files for batch processing</p>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {files.map((fileObj) => (
              <div key={fileObj.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                      <VideoIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[300px]">{fileObj.file.name}</h4>
                      <p className="text-[10px] text-slate-400">{(fileObj.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  {fileObj.status !== 'uploading' && !isUploading && (
                    <button onClick={() => removeFile(fileObj.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {fileObj.status === 'completed' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                </div>

                {fileObj.status === 'uploading' && (
                  <div className="space-y-2">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${fileObj.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...</span>
                      <span>{Math.round(fileObj.progress)}%</span>
                    </div>
                  </div>
                )}
                {fileObj.error && <p className="text-red-500 text-[10px] mt-1 font-medium">{fileObj.error}</p>}
              </div>
            ))}

            {!isUploading && files.some(f => f.status === 'pending') && (
              <button 
                onClick={startUploads}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                Upload {files.filter(f => f.status === 'pending').length} Files
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
