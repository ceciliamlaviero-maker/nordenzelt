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
  MessageCircle
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<Event> | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'selection' | 'calendar' | 'dashboard'>('selection');

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
    }
  }, [isAuthenticated]);

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
      const { data: savedEvent, error: eventError } = await supabase
        .from('events')
        .upsert({
          id: selectedEvent.id || undefined,
          ...eventData,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // 2. Handle Expenses
      if (expenses) {
        // If updating, clear old expenses first (simplest way to handle updates/removals)
        if (selectedEvent.id) {
          await supabase.from('expenses').delete().eq('event_id', selectedEvent.id);
        }

        if (expenses.length > 0) {
          const expensesToInsert = expenses.map(exp => ({
            ...exp,
            id: undefined, // Let Supabase generate IDs
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
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error al guardar el evento');
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
    const expense = { ...newExpenses[index], [field]: value };
    
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
    <div className="min-h-screen bg-brand-light-gray/20 text-brand-nordic-blue font-sans">
      {/* Header */}
      <header className="bg-brand-nordic-blue text-white p-4 md:p-6 shadow-lg flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('selection')}
            className={cn(
              "p-2 hover:bg-white/10 rounded-xl transition-all",
              view === 'selection' && "hidden"
            )}
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="font-cinzel text-xl md:text-2xl tracking-widest">NORDEN ADMIN</h1>
            <p className="text-[10px] md:text-xs opacity-70">Gestión de Eventos y Finanzas</p>
          </div>
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-2 border-brand-soft-gold border-t-transparent"></div>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-tighter opacity-70">Flujo de Caja Total</p>
          <p className={cn("text-lg md:text-2xl font-black", totalCashFlow >= 0 ? "text-green-400" : "text-red-400")}>
            ${totalCashFlow.toLocaleString()}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {view === 'selection' && (
          <div className="grid md:grid-cols-2 gap-6 pt-10">
            <button 
              onClick={() => setView('calendar')}
              className="bg-white p-10 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all group flex flex-col items-center gap-6 border-2 border-transparent hover:border-brand-soft-gold"
            >
              <div className="bg-brand-pine-green/10 p-6 rounded-full group-hover:bg-brand-pine-green/20 transition-all">
                <CalendarIcon size={48} className="text-brand-pine-green" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Calendario</h3>
                <p className="text-brand-nordic-blue/60">Gestiona fechas, lugares y detalles de eventos</p>
              </div>
            </button>

            <button 
              onClick={() => setView('dashboard')}
              className="bg-white p-10 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all group flex flex-col items-center gap-6 border-2 border-transparent hover:border-brand-soft-gold"
            >
              <div className="bg-brand-soft-gold/10 p-6 rounded-full group-hover:bg-brand-soft-gold/20 transition-all">
                <DollarSign size={48} className="text-brand-soft-gold" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Dashboard Financiero</h3>
                <p className="text-brand-nordic-blue/60">Análisis de ingresos, gastos y rentabilidad</p>
              </div>
            </button>
          </div>
        )}

        {view === 'calendar' && (
          <>
            {/* Reminders Alert */}
            {upcomingReminders.length > 0 && (
              <div className="bg-brand-soft-gold/20 border-2 border-brand-soft-gold p-4 md:p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="bg-brand-soft-gold p-3 rounded-full text-brand-nordic-blue">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Recordatorios Próximos</h4>
                    <p className="text-sm opacity-80">Tienes {upcomingReminders.length} evento(s) en exactamente 2 semanas.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {upcomingReminders.map(e => (
                    <button 
                      key={e.id}
                      onClick={() => sendWhatsAppReminder(e)}
                      className="bg-brand-nordic-blue text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-opacity-90 transition-all flex items-center gap-2"
                    >
                      <MessageCircle size={14} /> Recordar: {e.manager_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar Header */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-2xl shadow-sm gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-brand-light-gray rounded-full transition-all">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl md:text-2xl font-bold min-w-[150px] md:min-w-[200px] text-center">
                  {monthNames[month]} {year}
                </h2>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-brand-light-gray rounded-full transition-all">
                  <ChevronRight size={24} />
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
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-soft-gold text-brand-nordic-blue px-6 py-2 rounded-xl font-bold hover:bg-opacity-80 transition-all"
              >
                <Plus size={20} /> Nuevo Evento
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 md:gap-4">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
                <div key={day} className="text-center font-bold text-brand-nordic-blue/40 uppercase text-[10px] md:text-xs tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 md:gap-4">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 md:h-32 bg-brand-light-gray/5 rounded-xl md:rounded-2xl"></div>
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
                      "h-20 md:h-32 p-2 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all flex flex-col items-start gap-1 text-left overflow-hidden",
                      isToday ? "border-brand-soft-gold bg-brand-soft-gold/5" : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-brand-light-gray",
                      dayEvents.length > 0 ? "bg-brand-pine-green/5" : ""
                    )}
                  >
                    <span className={cn("text-sm md:text-lg font-bold", isToday ? "text-brand-soft-gold" : "text-brand-nordic-blue")}>
                      {day}
                    </span>
                    <div className="w-full space-y-1 overflow-hidden">
                      {dayEvents.map(e => (
                        <div key={e.id} className="text-[8px] md:text-[10px] bg-brand-pine-green text-white px-1 md:px-2 py-0.5 md:py-1 rounded md:rounded-lg truncate w-full">
                          {e.manager_name || 'Sin nombre'}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {view === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-brand-light-gray/20">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-nordic-blue/40 mb-2">Ingresos Totales</p>
                <p className="text-3xl font-black text-brand-nordic-blue">
                  ${events.reduce((sum, e) => sum + (e.agreed_price || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-brand-light-gray/20">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-nordic-blue/40 mb-2">Gastos Totales</p>
                <p className="text-3xl font-black text-red-400">
                  ${events.reduce((sum, e) => sum + (e.expenses || []).reduce((s, ex) => s + ex.total, 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-brand-light-gray/20">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-nordic-blue/40 mb-2">Rentabilidad Promedio</p>
                <p className="text-3xl font-black text-green-400">
                  {events.length > 0 
                    ? Math.round((totalCashFlow / events.reduce((sum, e) => sum + (e.agreed_price || 1), 0)) * 100) 
                    : 0}%
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-brand-light-gray/20 overflow-hidden">
              <div className="p-6 border-b border-brand-light-gray/20 flex justify-between items-center">
                <h3 className="font-bold text-xl">Desglose por Evento</h3>
                <div className="text-sm text-brand-nordic-blue/60">{events.length} eventos registrados</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-brand-light-gray/10 text-[10px] uppercase font-bold tracking-widest text-brand-nordic-blue/40">
                    <tr>
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4">Evento / Lugar</th>
                      <th className="px-6 py-4">Ingreso</th>
                      <th className="px-6 py-4">Gastos</th>
                      <th className="px-6 py-4">Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-light-gray/10">
                    {events.map(event => {
                      const expensesTotal = (event.expenses || []).reduce((sum, exp) => sum + exp.total, 0);
                      const profit = (event.agreed_price || 0) - expensesTotal;
                      return (
                        <tr key={event.id} className="hover:bg-brand-light-gray/5 transition-all">
                          <td className="px-6 py-4 font-medium">{event.date}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold">{event.manager_name}</div>
                            <div className="text-xs opacity-60">{event.venue_name}</div>
                          </td>
                          <td className="px-6 py-4">${event.agreed_price?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-red-400">${expensesTotal.toLocaleString()}</td>
                          <td className={cn("px-6 py-4 font-bold", profit >= 0 ? "text-green-500" : "text-red-500")}>
                            ${profit.toLocaleString()}
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
