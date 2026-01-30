"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  DollarSign, 
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  User,
  Home as HomeIcon,
  AlertCircle,
  MessageCircle,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Expense {
  id?: string;
  type: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Event {
  id: string;
  date: string; // YYYY-MM-DD
  address: string;
  event_time: string;
  manager_name: string;
  venue_name: string;
  reminder: string;
  agreed_price: number;
  expenses: Expense[];
}

interface SiteAsset {
  id: string;
  url: string;
  section: string;
  storage_path: string;
  display_order: number;
}

interface SiteContent {
  id: string;
  section: string;
  key: string;
  value: string;
  label: string;
}

interface SiteService {
  id: string;
  type: 'base' | 'optional';
  text: string;
  display_order: number;
}

interface GalleryItem {
  id: string;
  url: string;
  storage_path: string;
  type: 'image' | 'video';
  title: string;
  description: string;
  display_order: number;
}

// --- Helper Functions ---
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [assets, setAssets] = useState<SiteAsset[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<Event> | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState<'selection' | 'calendar' | 'dashboard' | 'multimedia' | 'textos' | 'galeria'>('selection');
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Auth check
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Norden2024") { // Hardcoded for now
      setIsAuthenticated(true);
    } else {
      alert("Contraseña incorrecta");
    }
  };

  // Fetch events from Supabase
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          expenses (*)
        `)
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('site_assets')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchSiteContent = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('section', { ascending: true });
      if (error) throw error;
      setSiteContent(data || []);
    } catch (error) {
      console.error('Error fetching site content:', error);
    }
  };

  const fetchGallery = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_content')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setGalleryItems(data || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    }
  };

  const updateSiteContent = async (id: string, value: string) => {
    setLoading(true);
    setSaveStatus(null);
    try {
      const { error } = await supabase
        .from('site_content')
        .update({ value })
        .eq('id', id);
      if (error) throw error;
      await fetchSiteContent();
      setSaveStatus(id);
      setEditingContentId(null);
      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error: any) {
      console.error("Error updating content:", error);
      alert("Error al actualizar el texto");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
      fetchAssets();
      fetchSiteContent();
      fetchGallery();
    }
  }, [isAuthenticated]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${section}/${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      // 3. Save to DB
      const { error: dbError } = await supabase
        .from('site_assets')
        .insert([{ url: publicUrl, storage_path: filePath, section }]);

      if (dbError) throw dbError;

      await fetchAssets();
      alert("Imagen subida con éxito");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert(`Error al subir la imagen: ${error.message}`);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type.startsWith('video/') ? 'video' : 'image';
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('gallery_content')
        .insert([{ 
          url: publicUrl, 
          storage_path: filePath, 
          type: fileType,
          title: 'Nuevo Item',
          description: ''
        }]);

      if (dbError) throw dbError;

      await fetchGallery();
      alert(`${fileType === 'video' ? 'Video' : 'Imagen'} subida con éxito`);
    } catch (error: any) {
      console.error("Error uploading to gallery:", error);
      alert(`Error al subir: ${error.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const updateGalleryItem = async (id: string, updates: Partial<GalleryItem>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('gallery_content')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      setSaveStatus(id);
      setTimeout(() => setSaveStatus(null), 2000);
      await fetchGallery();
    } catch (error: any) {
      console.error("Error updating gallery item:", error);
      alert("Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGallery = async (item: GalleryItem) => {
    if (!confirm("¿Estás seguro de eliminar este elemento?")) return;
    setLoading(true);
    try {
      await supabase.storage.from('gallery').remove([item.storage_path]);
      const { error } = await supabase.from('gallery_content').delete().eq('id', item.id);
      if (error) throw error;
      await fetchGallery();
    } catch (error: any) {
      console.error("Error deleting gallery item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (asset: SiteAsset) => {
    if (!confirm("¿Estás seguro de eliminar esta imagen?")) return;

    try {
      // 1. Delete from Storage
      const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove([asset.storage_path]);

      if (storageError) throw storageError;

      // 2. Delete from DB
      const { error: dbError } = await supabase
        .from('site_assets')
        .delete()
        .eq('id', asset.id);

      if (dbError) throw dbError;

      await fetchAssets();
    } catch (error: any) {
      console.error("Error deleting asset:", error);
      alert(`Error al eliminar la imagen: ${error.message}`);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // Month names in Spanish
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const changeMonth = (offset: number) => {
    const newDate = new Date(year, month + offset, 1);
    setCurrentDate(newDate);
  };

  const handleDayClick = (day: number) => {
    const dateStr = formatDate(new Date(year, month, day));
    const existingEvent = events.find(e => e.date === dateStr);
    
    if (existingEvent) {
      setSelectedEvent(existingEvent);
    } else {
      setSelectedEvent({
        date: dateStr,
        expenses: [],
        agreed_price: 0,
        address: '',
        event_time: '',
        manager_name: '',
        venue_name: '',
        reminder: ''
      });
    }
    setIsModalOpen(true);
  };

  const saveEvent = async () => {
    if (!selectedEvent) return;
    setLoading(true);

    try {
      const { expenses, ...eventData } = selectedEvent;
      
      // 1. Save/Update Event
      // Carefully construct the object to avoid sending undefined or extra fields
      const eventToUpsert: any = {
        date: eventData.date,
        address: eventData.address,
        event_time: eventData.event_time,
        manager_name: eventData.manager_name,
        venue_name: eventData.venue_name,
        reminder: eventData.reminder,
        agreed_price: Number(eventData.agreed_price || 0),
      };

      if (selectedEvent.id) {
        eventToUpsert.id = selectedEvent.id;
      }
      
      const { data: savedEvent, error: eventError } = await supabase
        .from('events')
        .upsert(eventToUpsert)
        .select()
        .single();

      if (eventError) throw eventError;

      // 2. Handle Expenses
      if (expenses) {
        // If updating, clear old expenses first
        if (selectedEvent.id) {
          await supabase.from('expenses').delete().eq('event_id', selectedEvent.id);
        }

        if (expenses.length > 0) {
          const expensesToInsert = expenses.map(exp => ({
            type: exp.type,
            quantity: Number(exp.quantity || 0),
            unit_price: Number(exp.unit_price || 0),
            total: Number(exp.total || 0),
            event_id: savedEvent.id
          }));

          const { error: expensesError } = await supabase
            .from('expenses')
            .insert(expensesToInsert);

          if (expensesError) throw expensesError;
        }
      }

      await fetchEvents();
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error: any) {
      console.error('Error saving event:', error);
      alert(`Error al guardar el evento: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este evento?")) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        await fetchEvents();
        setIsModalOpen(false);
        setSelectedEvent(null);
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error al eliminar el evento');
      } finally {
        setLoading(false);
      }
    }
  };

  const addExpense = () => {
    if (!selectedEvent) return;
    const newExpense: Expense = { type: '', quantity: 1, unit_price: 0, total: 0 };
    setSelectedEvent({
      ...selectedEvent,
      expenses: [...(selectedEvent.expenses || []), newExpense]
    });
  };

  const updateExpense = (index: number, field: keyof Expense, value: string | number) => {
    if (!selectedEvent || !selectedEvent.expenses) return;
    const newExpenses = [...selectedEvent.expenses];
    
    // Ensure numeric fields are actually numbers
    let processedValue = value;
    if (field === 'quantity' || field === 'unit_price') {
      processedValue = Number(value);
    }
    
    const expense = { ...newExpenses[index], [field]: processedValue };
    
    // Recalculate total if quantity or price changed
    if (field === 'quantity' || field === 'unit_price') {
      expense.total = Number(expense.quantity) * Number(expense.unit_price);
    }
    
    newExpenses[index] = expense;
    setSelectedEvent({ ...selectedEvent, expenses: newExpenses });
  };

  const removeExpense = (index: number) => {
    if (!selectedEvent || !selectedEvent.expenses) return;
    const newExpenses = selectedEvent.expenses.filter((_, i) => i !== index);
    setSelectedEvent({ ...selectedEvent, expenses: newExpenses });
  };

  const calculateEventProfit = (event: Partial<Event>) => {
    const income = event.agreed_price || 0;
    const expensesTotal = (event.expenses || []).reduce((sum, exp) => sum + exp.total, 0);
    return income - expensesTotal;
  };

  const totalCashFlow = useMemo(() => {
    return events.reduce((sum, event) => sum + calculateEventProfit(event), 0);
  }, [events]);

  const upcomingReminders = useMemo(() => {
    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);
    const dateStr = formatDate(twoWeeksFromNow);
    
    return events.filter(e => e.date === dateStr);
  }, [events]);

  const sendWhatsAppReminder = (event: Event) => {
    const phoneNumber = "5491132747900"; // Admin phone or configured
    const message = `*RECORDATORIO NORDEN ZELT (2 SEMANAS)*\n\n` +
      `El evento de *${event.manager_name}* en *${event.venue_name}* es en 2 semanas.\n\n` +
      `*Detalles:*\n` +
      `- Fecha: ${event.date}\n` +
      `- Hora: ${event.event_time}\n` +
      `- Lugar: ${event.address}\n` +
      `- Precio: $${event.agreed_price}\n` +
      `- Recordatorio: ${event.reminder || 'N/A'}\n\n` +
      `¡A preparar todo! 😃`;
    
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-pine-green flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="font-cinzel text-3xl text-brand-nordic-blue">Acceso Admin</h1>
            <p className="text-brand-nordic-blue/60 text-sm mt-2">Norden Zelt Dashboard</p>
          </div>
          <div className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-3 rounded-xl border border-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-soft-gold"
              autoFocus
            />
            <button 
              type="submit"
              className="w-full bg-brand-pine-green text-white py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all"
            >
              Ingresar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="h-screen bg-brand-light-gray/20 text-brand-nordic-blue font-sans flex flex-col overflow-hidden">
      {/* Header - Fixed Height */}
      <header className="bg-brand-nordic-blue text-white p-3 md:p-4 shadow-lg flex justify-between items-center shrink-0 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('selection')}
            className={cn(
              "p-2 hover:bg-white/10 rounded-xl transition-all",
              view === 'selection' && "hidden"
            )}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="font-cinzel text-lg md:text-xl tracking-widest">NORDEN ADMIN</h1>
            <p className="text-[10px] opacity-70">Gestión de Eventos y Finanzas</p>
          </div>
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-soft-gold border-t-transparent"></div>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-tighter opacity-70">Flujo de Caja Total</p>
          <p className={cn("text-base md:text-xl font-black", totalCashFlow >= 0 ? "text-green-400" : "text-red-400")}>
            ${totalCashFlow.toLocaleString()}
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-3 md:p-4 flex flex-col min-h-0 space-y-4 overflow-hidden">
        {view === 'selection' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10 overflow-y-auto">
            <button 
              onClick={() => setView('calendar')}
              className="bg-white p-8 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all group flex flex-col items-center gap-6 border-2 border-transparent hover:border-brand-soft-gold"
            >
              <div className="bg-brand-pine-green/10 p-6 rounded-full group-hover:bg-brand-pine-green/20 transition-all">
                <CalendarIcon size={40} className="text-brand-pine-green" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Calendario</h3>
                <p className="text-sm text-brand-nordic-blue/60">Gestiona fechas, lugares y detalles de eventos</p>
              </div>
            </button>

            <button 
              onClick={() => setView('dashboard')}
              className="bg-white p-8 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all group flex flex-col items-center gap-6 border-2 border-transparent hover:border-brand-soft-gold"
            >
              <div className="bg-brand-soft-gold/10 p-6 rounded-full group-hover:bg-brand-soft-gold/20 transition-all">
                <DollarSign size={40} className="text-brand-soft-gold" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Dashboard Financiero</h3>
                <p className="text-sm text-brand-nordic-blue/60">Análisis de ingresos, gastos y rentabilidad</p>
              </div>
            </button>

            <button 
              onClick={() => setView('multimedia')}
              className="bg-white p-8 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all group flex flex-col items-center gap-6 border-2 border-transparent hover:border-brand-soft-gold"
            >
              <div className="bg-brand-nordic-blue/10 p-6 rounded-full group-hover:bg-brand-nordic-blue/20 transition-all">
                <ImageIcon size={40} className="text-brand-nordic-blue" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Multimedia</h3>
                <p className="text-sm text-brand-nordic-blue/60">Gestiona las imágenes de toda la plataforma</p>
              </div>
            </button>

            <button 
              onClick={() => setView('textos')}
              className="bg-white p-8 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all group flex flex-col items-center gap-6 border-2 border-transparent hover:border-brand-soft-gold"
            >
              <div className="bg-brand-soft-gold/10 p-6 rounded-full group-hover:bg-brand-soft-gold/20 transition-all">
                <MessageCircle size={40} className="text-brand-soft-gold" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Textos Web</h3>
                <p className="text-sm text-brand-nordic-blue/60">Edita todos los títulos y descripciones de la página</p>
              </div>
            </button>

            <button 
              onClick={() => setView('galeria')}
              className="bg-white p-8 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all group flex flex-col items-center gap-6 border-2 border-transparent hover:border-brand-soft-gold"
            >
              <div className="bg-brand-pine-green/10 p-6 rounded-full group-hover:bg-brand-pine-green/20 transition-all">
                <ImageIcon size={40} className="text-brand-pine-green" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Galería de Imágenes</h3>
                <p className="text-sm text-brand-nordic-blue/60">Sube fotos y videos con títulos y descripciones</p>
              </div>
            </button>
          </div>
        )}

        {view === 'galeria' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-6 overflow-hidden pb-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-brand-light-gray/20 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-brand-nordic-blue mb-2">Gestión de Galería</h3>
                <p className="text-sm text-brand-nordic-blue/60">Sube fotos o videos para la sección de galería.</p>
              </div>
              <label className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer",
                uploading ? "bg-brand-light-gray text-brand-nordic-blue/40 cursor-not-allowed" : "bg-brand-soft-gold text-brand-nordic-blue hover:bg-opacity-80"
              )}>
                {uploading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-nordic-blue border-t-transparent"></div> : <Upload size={18} />}
                {uploading ? 'Subiendo...' : 'Subir Multimedia'}
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  className="hidden" 
                  onChange={handleGalleryUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryItems.map(item => (
                  <div key={item.id} className="bg-white rounded-[2rem] shadow-sm border border-brand-light-gray/20 overflow-hidden flex flex-col">
                    <div className="aspect-video relative bg-black flex items-center justify-center">
                      {item.type === 'image' ? (
                        <img src={item.url} className="w-full h-full object-cover" alt={item.title} />
                      ) : (
                        <video src={item.url} className="w-full h-full object-cover" controls />
                      )}
                      <button 
                        onClick={() => handleDeleteGallery(item)}
                        className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="p-6 space-y-4 flex-1 flex flex-col">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-nordic-blue/40">Título</label>
                        <input 
                          type="text"
                          defaultValue={item.title}
                          onBlur={(e) => updateGalleryItem(item.id, { title: e.target.value })}
                          className="w-full bg-brand-light-gray/5 border border-brand-light-gray/20 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-soft-gold"
                        />
                      </div>
                      <div className="space-y-1 flex-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-nordic-blue/40">Descripción</label>
                        <textarea 
                          defaultValue={item.description}
                          onBlur={(e) => updateGalleryItem(item.id, { description: e.target.value })}
                          className="w-full bg-brand-light-gray/5 border border-brand-light-gray/20 rounded-xl px-4 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-brand-soft-gold"
                        />
                      </div>
                      {saveStatus === item.id && (
                        <p className="text-[10px] font-bold text-green-500 text-right animate-pulse">¡Cambios guardados!</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {galleryItems.length === 0 && (
                <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-brand-light-gray/20">
                  <p className="text-brand-nordic-blue/40 font-medium italic">No hay elementos en la galería todavía.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'multimedia' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-6 overflow-hidden pb-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-brand-light-gray/20">
              <h3 className="text-2xl font-bold text-brand-nordic-blue mb-2">Gestor Multimedia</h3>
              <p className="text-sm text-brand-nordic-blue/60">Sube y organiza las fotos de cada sección de la web.</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
              {[
                { id: 'hero', name: 'Portada (Hero)', desc: 'Imagen principal de la parte superior' },
                { id: 'carousel', name: 'Carrusel de Fotos', desc: 'Galería de fotos general' }
              ].map(section => (
                <div key={section.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-brand-light-gray/20 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-lg text-brand-nordic-blue">{section.name}</h4>
                      <p className="text-xs text-brand-nordic-blue/50">{section.desc}</p>
                    </div>
                    <label className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                      uploading ? "bg-brand-light-gray text-brand-nordic-blue/40 cursor-not-allowed" : "bg-brand-soft-gold text-brand-nordic-blue hover:bg-opacity-80"
                    )}>
                      {uploading ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-brand-nordic-blue border-t-transparent"></div> : <Upload size={14} />}
                      {uploading ? 'Subiendo...' : 'Subir Foto'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleUpload(e, section.id)}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {assets.filter(a => a.section === section.id).map(asset => (
                      <div key={asset.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-brand-light-gray/10 border border-brand-light-gray/20">
                        <img 
                          src={asset.url} 
                          alt={section.name} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => handleDeleteAsset(asset)}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {assets.filter(a => a.section === section.id).length === 0 && (
                      <div className="col-span-full py-10 text-center border-2 border-dashed border-brand-light-gray/20 rounded-2xl">
                        <p className="text-xs text-brand-nordic-blue/30 font-medium">No hay fotos en esta sección</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'textos' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-6 overflow-hidden pb-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-brand-light-gray/20">
              <h3 className="text-2xl font-bold text-brand-nordic-blue mb-2">Gestión de Textos</h3>
              <p className="text-sm text-brand-nordic-blue/60">Modifica cualquier texto de la web. Los cambios son instantáneos.</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
              {Object.entries(
                siteContent.reduce((acc, item) => {
                  if (!acc[item.section]) acc[item.section] = [];
                  acc[item.section].push(item);
                  return acc;
                }, {} as Record<string, SiteContent[]>)
              ).map(([section, items]) => (
                <div key={section} className="bg-white p-6 rounded-[2rem] shadow-sm border border-brand-light-gray/20 space-y-4">
                  <h4 className="font-bold text-lg text-brand-nordic-blue capitalize border-b pb-2">{section}</h4>
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.id} className="space-y-2 p-4 rounded-2xl bg-brand-light-gray/5 border border-brand-light-gray/20">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-brand-nordic-blue/50 uppercase tracking-wider">{item.label}</label>
                          {saveStatus === item.id && (
                            <span className="text-[10px] font-bold text-green-500 animate-bounce flex items-center gap-1">
                              <Save size={10} /> ¡Guardado con éxito!
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <textarea 
                            id={`textarea-${item.id}`}
                            className={cn(
                              "w-full p-4 rounded-xl border transition-all text-sm min-h-[100px] outline-none",
                              editingContentId === item.id 
                                ? "border-brand-soft-gold bg-white ring-2 ring-brand-soft-gold/10" 
                                : "border-brand-light-gray/20 bg-transparent cursor-not-allowed opacity-70"
                            )}
                            defaultValue={item.value}
                            disabled={editingContentId !== item.id}
                          />
                          
                          <div className="flex justify-end gap-2">
                            {editingContentId === item.id ? (
                              <>
                                <button 
                                  onClick={() => setEditingContentId(null)}
                                  className="px-4 py-2 rounded-lg text-xs font-bold text-brand-nordic-blue/60 hover:bg-brand-light-gray/20 transition-all"
                                >
                                  Cancelar
                                </button>
                                <button 
                                  onClick={() => {
                                    const el = document.getElementById(`textarea-${item.id}`) as HTMLTextAreaElement;
                                    updateSiteContent(item.id, el.value);
                                  }}
                                  className="px-6 py-2 rounded-lg text-xs font-bold bg-brand-soft-gold text-brand-nordic-blue hover:bg-opacity-80 transition-all flex items-center gap-2"
                                >
                                  <Save size={14} /> Guardar Cambios
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => setEditingContentId(item.id)}
                                className="px-6 py-2 rounded-lg text-xs font-bold bg-brand-nordic-blue text-white hover:bg-opacity-90 transition-all flex items-center gap-2"
                              >
                                <MessageCircle size={14} /> Editar Texto
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {siteContent.length === 0 && (
                <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-brand-light-gray/20">
                  <p className="text-brand-nordic-blue/40 font-medium italic">
                    No hay textos configurados en la base de datos.<br/>
                    Ejecuta el SQL proporcionado para empezar.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'calendar' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Reminders Alert - Compact */}
            {upcomingReminders.length > 0 && (
              <div className="bg-brand-soft-gold/20 border-2 border-brand-soft-gold p-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-soft-gold p-2 rounded-full text-brand-nordic-blue">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Recordatorios Próximos</h4>
                    <p className="text-[10px] opacity-80">Tienes {upcomingReminders.length} evento(s) en 2 semanas.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {upcomingReminders.map(e => (
                    <button 
                      key={e.id}
                      onClick={() => sendWhatsAppReminder(e)}
                      className="bg-brand-nordic-blue text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-opacity-90 transition-all flex items-center gap-1"
                    >
                      <MessageCircle size={12} /> {e.manager_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar Header - Compact */}
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm gap-4 shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-brand-light-gray rounded-full transition-all">
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-lg md:text-xl font-bold min-w-[140px] text-center">
                  {monthNames[month]} {year}
                </h2>
                <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-brand-light-gray rounded-full transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
              <button 
                onClick={() => {
                  setSelectedEvent({
                    date: formatDate(new Date()),
                    expenses: [],
                    agreed_price: 0,
                    address: '',
                    event_time: '',
                    manager_name: '',
                    venue_name: '',
                    reminder: ''
                  });
                  setIsModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 bg-brand-soft-gold text-brand-nordic-blue px-4 py-1.5 rounded-xl text-sm font-bold hover:bg-opacity-80 transition-all"
              >
                <Plus size={18} /> Nuevo Evento
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-2 shrink-0">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
                <div key={day} className="text-center font-bold text-brand-nordic-blue/40 uppercase text-[10px] tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid - Flexible height */}
            <div className="flex-1 grid grid-cols-7 gap-2 min-h-0 pb-2">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-brand-light-gray/5 rounded-xl"></div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = formatDate(new Date(year, month, day));
                const dayEvents = events.filter(e => e.date === dateStr);
                const isToday = formatDate(new Date()) === dateStr;

                return (
                  <button 
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "p-2 rounded-xl border-2 transition-all flex flex-col items-start gap-1 text-left overflow-hidden min-h-0",
                      isToday ? "border-brand-soft-gold bg-brand-soft-gold/5" : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-brand-light-gray",
                      dayEvents.length > 0 ? "bg-brand-pine-green/5" : ""
                    )}
                  >
                    <span className={cn("text-xs md:text-sm font-bold", isToday ? "text-brand-soft-gold" : "text-brand-nordic-blue")}>
                      {day}
                    </span>
                    <div className="w-full space-y-0.5 overflow-hidden">
                      {dayEvents.map(e => (
                        <div key={e.id} className="text-[8px] md:text-[9px] bg-brand-pine-green text-white px-1 py-0.5 rounded md:rounded-md truncate w-full leading-tight">
                          {e.manager_name || 'Sin nombre'}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-hidden">
            <div className="grid grid-cols-3 gap-4 shrink-0">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-brand-light-gray/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-nordic-blue/40 mb-1">Ingresos</p>
                <p className="text-lg font-black text-brand-nordic-blue">
                  ${events.reduce((sum, e) => sum + (e.agreed_price || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-brand-light-gray/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-nordic-blue/40 mb-1">Gastos</p>
                <p className="text-lg font-black text-red-400">
                  ${events.reduce((sum, e) => sum + (e.expenses || []).reduce((s, ex) => s + ex.total, 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-brand-light-gray/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-nordic-blue/40 mb-1">Rentabilidad</p>
                <p className="text-lg font-black text-green-400">
                  {events.length > 0 
                    ? Math.round((totalCashFlow / events.reduce((sum, e) => sum + (e.agreed_price || 1), 0)) * 100) 
                    : 0}%
                </p>
              </div>
            </div>

            <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-brand-light-gray/20 overflow-hidden flex flex-col min-h-0">
              <div className="px-6 py-4 border-b border-brand-light-gray/20 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-xl text-brand-nordic-blue">Desglose por Evento</h3>
                <div className="text-xs font-bold text-brand-nordic-blue/40 uppercase tracking-widest">{events.length} eventos</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-light-gray/5 text-[10px] uppercase font-bold tracking-[0.2em] text-brand-nordic-blue/40 sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-8 py-5">Fecha</th>
                      <th className="px-8 py-5">Evento / Lugar</th>
                      <th className="px-8 py-5">Ingreso</th>
                      <th className="px-8 py-5">Gastos</th>
                      <th className="px-8 py-5">Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-light-gray/10">
                    {events.map(event => {
                      const expensesTotal = (event.expenses || []).reduce((sum, exp) => sum + exp.total, 0);
                      const profit = (event.agreed_price || 0) - expensesTotal;
                      return (
                        <tr 
                          key={event.id} 
                          className="hover:bg-brand-light-gray/5 transition-all cursor-pointer group" 
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsModalOpen(true);
                          }}
                        >
                          <td className="px-8 py-6 font-medium text-sm whitespace-nowrap">{event.date}</td>
                          <td className="px-8 py-6">
                            <div className="font-bold text-base text-brand-nordic-blue group-hover:text-brand-soft-gold transition-colors">{event.manager_name}</div>
                            <div className="text-xs opacity-50 font-medium">{event.venue_name}</div>
                          </td>
                          <td className="px-8 py-6 font-bold text-base">${event.agreed_price?.toLocaleString()}</td>
                          <td className="px-8 py-6 text-red-400 font-bold text-base">${expensesTotal.toLocaleString()}</td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-4 py-2 rounded-xl font-black text-base",
                              profit >= 0 ? "text-green-500 bg-green-50" : "text-red-500 bg-red-50"
                            )}>
                              ${profit.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl animate-fade-in">
            <div className="sticky top-0 bg-white border-b border-brand-light-gray p-6 flex justify-between items-center z-10">
              <h3 className="font-cinzel text-2xl text-brand-nordic-blue">
                {selectedEvent.id ? 'Editar Evento' : 'Nuevo Evento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-brand-light-gray rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Event Details Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-nordic-blue/60 flex items-center gap-2">
                    <CalendarIcon size={14} /> Fecha
                  </label>
                  <input 
                    type="date" 
                    value={selectedEvent.date}
                    onChange={(e) => setSelectedEvent({...selectedEvent, date: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-soft-gold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-nordic-blue/60 flex items-center gap-2">
                    <Clock size={14} /> Hora del Evento
                  </label>
                  <input 
                    type="time" 
                    value={selectedEvent.event_time}
                    onChange={(e) => setSelectedEvent({...selectedEvent, event_time: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-soft-gold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-nordic-blue/60 flex items-center gap-2">
                    <User size={14} /> Nombre del Encargado
                  </label>
                  <input 
                    type="text" 
                    value={selectedEvent.manager_name}
                    onChange={(e) => setSelectedEvent({...selectedEvent, manager_name: e.target.value})}
                    placeholder="Marta..."
                    className="w-full px-4 py-3 rounded-xl border border-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-soft-gold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-nordic-blue/60 flex items-center gap-2">
                    <HomeIcon size={14} /> Nombre del Lugar / Salón
                  </label>
                  <input 
                    type="text" 
                    value={selectedEvent.venue_name}
                    onChange={(e) => setSelectedEvent({...selectedEvent, venue_name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-soft-gold"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-nordic-blue/60 flex items-center gap-2">
                    <MapPin size={14} /> Dirección del Lugar
                  </label>
                  <input 
                    type="text" 
                    value={selectedEvent.address}
                    onChange={(e) => setSelectedEvent({...selectedEvent, address: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-soft-gold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-nordic-blue/60 flex items-center gap-2">
                    <DollarSign size={14} /> Precio Acordado
                  </label>
                  <input 
                    type="number" 
                    value={selectedEvent.agreed_price}
                    onChange={(e) => setSelectedEvent({...selectedEvent, agreed_price: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-soft-gold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-nordic-blue/60 flex items-center gap-2">
                    <AlertCircle size={14} /> Recordatorio (Opcional)
                  </label>
                  <input 
                    type="text" 
                    value={selectedEvent.reminder}
                    onChange={(e) => setSelectedEvent({...selectedEvent, reminder: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-soft-gold"
                  />
                </div>
              </div>

              {/* Expenses Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-lg text-brand-nordic-blue">Gastos del Evento</h4>
                  <button 
                    onClick={addExpense}
                    className="flex items-center gap-2 text-sm bg-brand-light-gray/50 px-4 py-2 rounded-lg hover:bg-brand-light-gray transition-all"
                  >
                    <Plus size={16} /> Agregar Gasto
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(selectedEvent.expenses || []).map((expense, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end bg-brand-light-gray/10 p-4 rounded-xl border border-brand-light-gray/20">
                      <div className="col-span-5 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-brand-nordic-blue/40">Tipo de Gasto</label>
                        <input 
                          type="text" 
                          value={expense.type}
                          onChange={(e) => updateExpense(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-brand-light-gray focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-brand-nordic-blue/40">Cant.</label>
                        <input 
                          type="number" 
                          value={expense.quantity}
                          onChange={(e) => updateExpense(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-brand-light-gray focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-brand-nordic-blue/40">Monto U.</label>
                        <input 
                          type="number" 
                          value={expense.unit_price}
                          onChange={(e) => updateExpense(index, 'unit_price', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-brand-light-gray focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-brand-nordic-blue/40">Total</label>
                        <div className="px-3 py-2 bg-white rounded-lg border border-brand-light-gray text-sm font-bold">
                          ${expense.total}
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center mb-1">
                        <button onClick={() => removeExpense(index)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary & Footer */}
              <div className="bg-brand-nordic-blue text-white p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-1">
                  <p className="text-sm opacity-70 uppercase tracking-widest">Ganancia Estimada del Evento</p>
                  <p className="text-4xl font-black">${calculateEventProfit(selectedEvent).toLocaleString()}</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  {selectedEvent.id && (
                    <button 
                      onClick={() => deleteEvent(selectedEvent.id!)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-500/10 text-red-400 px-6 py-3 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={20} /> Eliminar
                    </button>
                  )}
                  <button 
                    onClick={saveEvent}
                    disabled={loading}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brand-soft-gold text-brand-nordic-blue px-10 py-3 rounded-xl font-black hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-nordic-blue border-t-transparent"></div>
                    ) : (
                      <Save size={20} />
                    )}
                    {loading ? 'Guardando...' : 'Guardar Evento'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles for animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
