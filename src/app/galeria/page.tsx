"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Play } from 'lucide-react';
import Link from 'next/link';

interface GalleryFolder {
  id: string;
  name: string;
  description: string;
}

interface GalleryItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  title: string;
  description: string;
  folder_id: string | null;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [galleryRes, foldersRes] = await Promise.all([
        supabase.from('gallery_content').select('*').order('created_at', { ascending: false }),
        supabase.from('gallery_folders').select('*').order('name', { ascending: true })
      ]);
      
      if (!galleryRes.error && galleryRes.data) {
        setItems(galleryRes.data);
      }
      if (!foldersRes.error && foldersRes.data) {
        setFolders(foldersRes.data);
        if (foldersRes.data.length > 0) {
          setActiveFolderId(foldersRes.data[0].id);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredItems = items.filter(item => 
    item.folder_id === activeFolderId
  );

  return (
    <main className="min-h-screen bg-brand-white text-brand-nordic-blue font-sans">
      {/* Header */}
      <header className="py-12 px-6 md:px-12 border-b border-brand-light-gray bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-brand-nordic-blue hover:text-brand-soft-gold transition-colors font-bold uppercase tracking-widest text-sm"
          >
            <ChevronLeft size={20} />
            Volver
          </Link>
          <h1 className="font-cinzel text-2xl md:text-4xl tracking-[0.2em] text-brand-pine-green">
            GALERÍA <span className="text-brand-soft-gold">NORDEN</span>
          </h1>
          <div className="w-20 hidden md:block"></div> {/* Spacer for symmetry */}
        </div>
      </header>

      <section className="py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Folders Navigation */}
          {!loading && folders.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mb-20">
              {folders.map(folder => (
                <button 
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`px-8 py-3 rounded-full font-cinzel text-xs tracking-widest transition-all ${
                    activeFolderId === folder.id 
                    ? 'bg-brand-soft-gold text-brand-nordic-blue shadow-xl scale-105 font-bold' 
                    : 'bg-white text-brand-nordic-blue/60 hover:bg-brand-soft-gold/20'
                  }`}
                >
                  {folder.name.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-soft-gold border-t-transparent"></div>
              <p className="font-cinzel tracking-widest text-brand-nordic-blue/40">CARGANDO GALERÍA...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="group bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-brand-light-gray transition-all hover:-translate-y-2"
                >
                  <div className="aspect-[4/3] relative bg-brand-pine-green/5 overflow-hidden">
                    {item.type === 'image' ? (
                      <img 
                        src={item.url} 
                        alt={item.title || 'Imagen de Galería Norden Zelt'} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <video 
                          src={item.url} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                          <div className="bg-brand-soft-gold text-brand-nordic-blue p-4 rounded-full shadow-xl">
                            <Play size={32} fill="currentColor" />
                          </div>
                        </div>
                        {/* Interactive overlay for video */}
                        <video 
                           src={item.url}
                           className="absolute inset-0 w-full h-full object-cover opacity-0 hover:opacity-100 transition-opacity"
                           controls
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-8 space-y-3">
                    <h3 className="font-cinzel text-xl text-brand-pine-green tracking-wide">
                      {item.title || 'Norden Zelt'}
                    </h3>
                    <div className="h-0.5 w-12 bg-brand-soft-gold"></div>
                    <p className="text-sm text-brand-nordic-blue/70 leading-relaxed italic">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
              
              {filteredItems.length === 0 && (
                <div className="col-span-full py-40 text-center space-y-6">
                  <p className="font-cinzel text-2xl text-brand-nordic-blue/30 tracking-widest italic">
                    PRÓXIMAMENTE MÁS CONTENIDO
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer simple for Gallery */}
      <footer className="py-12 bg-brand-pine-green text-white text-center border-t-4 border-brand-soft-gold">
        <p className="font-cinzel tracking-[0.3em] text-sm">NORDEN ZELT © 2026</p>
      </footer>
    </main>
  );
}
