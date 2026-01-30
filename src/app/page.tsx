"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Instagram, Mail, MessageCircle, MapPin, ChevronDown } from 'lucide-react';
import ImageCarousel from '@/components/ImageCarousel';
import { supabase } from '@/lib/supabase';

interface SiteAsset {
  url: string;
  section: string;
}

interface SiteContent {
  key: string;
  value: string;
}

interface FormData {
  nombreApellido: string;
  email: string;
  telefono: string;
  ubicacion: string;
  fechaHora: string;
  duracion: string;
  invitados: string;
  ambientacion: string;
  sonidoTecnica: string;
  mobiliario: string;
  pistaBaile: string;
  comentarios?: string;
}

export default function Home() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();
  const [assets, setAssets] = useState<SiteAsset[]>([]);
  const [content, setContent] = useState<SiteContent[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Assets
      const { data: assetData } = await supabase
        .from('site_assets')
        .select('url, section')
        .order('display_order', { ascending: true });
      if (assetData) setAssets(assetData);

      // Fetch Content
      const { data: contentData } = await supabase
        .from('site_content')
        .select('key, value');
      if (contentData) setContent(contentData);
    };
    fetchData();
  }, []);

  const getContent = (key: string, fallback: string) => {
    return content.find(c => c.key === key)?.value || fallback;
  };

  const heroImage = assets.find(a => a.section === 'hero')?.url || "/images/WhatsApp Image 2026-01-16 at 11.50.25 (1).jpeg";
  const carouselImages = assets.filter(a => a.section === 'carousel').map(a => a.url);
  
  const onSubmit = (data: FormData) => {
    const phoneNumber = "5491132747900";
    const baseMessage = "¡Hola! Me gustaría recibir un presupuesto para el alquiler de una carpa Norden Zelt 😃\n\n";
    
    let details = `*Datos del Pedido:*\n`;
    details += `- Nombre: ${data.nombreApellido}\n`;
    details += `- Email: ${data.email}\n`;
    details += `- Teléfono: ${data.telefono}\n`;
    details += `- Ubicación del Evento: ${data.ubicacion}\n`;
    details += `- Fecha y Hora: ${data.fechaHora}\n`;
    details += `- Duración: ${data.duracion} hs\n`;
    details += `- Invitados: ${data.invitados}\n`;
    details += `- Ambientación: ${data.ambientacion}\n`;
    details += `- Técnica y Sonido: ${data.sonidoTecnica}\n`;
    details += `- Mobiliario: ${data.mobiliario}\n`;
    details += `- Pista de Baile: ${data.pistaBaile}\n`;
    if (data.comentarios) details += `- Comentarios: ${data.comentarios}\n`;

    const fullMessage = encodeURIComponent(baseMessage + details);
    window.open(`https://wa.me/${phoneNumber}?text=${fullMessage}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-brand-white text-brand-nordic-blue">
      
      {/* Hero Section */}
      <section className="relative h-[90vh] md:h-screen flex flex-col items-center justify-center text-center px-4 bg-brand-pine-green overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Norden Zelt Background" 
            className="w-full h-full object-cover"
          />
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-brand-pine-green/45"></div>
        </div>
        
        <div className="relative z-10 space-y-8 w-full max-w-5xl mx-auto flex flex-col items-center">
          <div className="space-y-2">
            <h1 className="font-cinzel text-6xl md:text-8xl lg:text-9xl text-white tracking-[0.2em] leading-none animate-fade-in flex flex-col items-center justify-center">
              NORDEN
              <span className="block text-4xl md:text-6xl lg:text-7xl tracking-[0.4em] mt-4 text-white opacity-100 font-black drop-shadow-md">ZELT</span>
            </h1>
          </div>
          
          <div className="h-[2px] w-32 md:w-64 bg-brand-soft-gold animate-fade-in"></div>
          
          <p className="text-2xl md:text-5xl text-brand-white italic animate-fade-in font-serif px-4 leading-relaxed">
            {getContent('hero_subtitle', 'Carpas Exclusivas para Momentos Inolvidables')}
          </p>
        </div>

        <button 
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white flex flex-col items-center gap-3 transition-all hover:text-brand-soft-gold animate-bounce z-20"
        >
          <span className="font-sans text-[10px] uppercase tracking-[0.4em] font-bold">{getContent('hero_explore_btn', 'Explorar')}</span>
          <ChevronDown size={24} strokeWidth={2} />
        </button>
      </section>

      {/* Info & Form Section */}
      <section className="py-24 px-6 md:px-12 bg-brand-light-gray/30">
        <div className="max-w-6xl mx-auto">
          
          {/* Slogan Section - Title removed as requested */}
          <div className="mb-24 text-center">
            <h2 className="font-cinzel italic text-3xl md:text-5xl text-brand-pine-green mb-12 tracking-wide leading-tight">
              &quot;{getContent('slogan_text', 'Una carpa que se adapta a cualquier Entorno')}&quot;
            </h2>
            
            <div className="max-w-4xl mx-auto shadow-2xl rounded-3xl overflow-hidden border-4 border-brand-soft-gold/20">
              <ImageCarousel images={carouselImages} />
            </div>

            {/* Gallery CTA */}
            <div className="mt-12 flex justify-center">
              <Link 
                href="/galeria" 
                className="inline-flex items-center gap-3 px-10 py-4 bg-brand-pine-green text-brand-white rounded-full font-cinzel tracking-[0.2em] text-sm hover:bg-brand-soft-gold hover:text-brand-nordic-blue transition-all shadow-xl group"
              >
                {getContent('gallery_cta_btn', 'EXPLORAR GALERÍA')}
                <ChevronDown className="-rotate-90 group-hover:translate-x-1 transition-transform" size={18} />
              </Link>
            </div>
          </div>

          {/* 1. Header Text */}
          <div className="text-center max-w-4xl mx-auto mb-20 space-y-6">
            <h2 className="font-cinzel text-3xl md:text-5xl text-brand-pine-green leading-tight">
              {getContent('form_title', '¡Comentanos sobre tu evento y armamos un presupuesto a tu medida!')}
            </h2>
            <div className="h-1.5 w-24 bg-brand-soft-gold mx-auto"></div>
          </div>

          {/* 2. Unified Info Card */}
          <div className="max-w-6xl mx-auto mb-24 overflow-hidden rounded-[3rem] shadow-2xl border border-brand-light-gray flex flex-col md:flex-row min-h-[500px]">
            {/* Left Section - Services */}
            <div className="flex-[1.2] bg-brand-white p-8 md:p-14 flex flex-col justify-between">
              <div>
                <h3 className="font-cinzel text-3xl mb-6 text-brand-pine-green tracking-wide">{getContent('services_title', 'Nuestro Servicio Incluye:')}</h3>
                <div className="h-px w-full bg-brand-soft-gold/30 mb-8"></div>
                
                <div className="space-y-10">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-brand-nordic-blue/60 font-bold mb-5">{getContent('base_services_label', 'Servicios Base')}</p>
                    <ul className="grid grid-cols-1 gap-y-4 font-sans text-brand-nordic-blue">
                      {[
                        getContent('service_base_1', 'Traslado al punto de armado'),
                        getContent('service_base_2', 'Armado y Desarmado profesional')
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-4 text-sm md:text-base font-bold">
                          <span className="h-2.5 w-2.5 rounded-full bg-brand-soft-gold flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-brand-nordic-blue/60 font-bold mb-5">{getContent('optional_services_label', 'Adicionales Opcionales')}</p>
                    <ul className="grid grid-cols-2 gap-x-6 gap-y-4 font-sans text-brand-nordic-blue">
                      {[
                        getContent('service_opt_1', 'Ambientación'),
                        getContent('service_opt_2', 'Sonido y Técnica'),
                        getContent('service_opt_3', 'Livings y Sillas'),
                        getContent('service_opt_4', 'Pista de baile')
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-medium opacity-70">
                          <span className="h-2.5 w-2.5 rounded-full bg-brand-soft-gold flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 pt-8 border-t border-brand-soft-gold/30">
                <p className="text-base italic text-brand-nordic-blue/70 font-medium flex items-center gap-3">
                  <span className="h-2.5 w-2.5 bg-brand-soft-gold rounded-full"></span>
                  {getContent('capacity_text', 'Capacidad adaptable entre 60 a 400 personas')}
                </p>
              </div>
            </div>

            {/* Right Section - Technical Specs */}
            <div className="flex-1 bg-brand-pine-green text-brand-white p-8 md:p-14 flex flex-col justify-center">
              <h3 className="font-cinzel text-3xl mb-6 tracking-wide italic">{getContent('tech_specs_title', 'Especificaciones Técnicas')}</h3>
              <div className="h-px w-full bg-brand-soft-gold/30 mb-8"></div>

              <div className="space-y-8 font-sans text-xl">
                <p className="flex items-center gap-5 leading-relaxed">
                  <span className="w-2.5 h-2.5 bg-brand-soft-gold rounded-full flex-shrink-0"></span>
                  {getContent('tech_spec_1', 'Materiales de alta resistencia y durabilidad')}
                </p>
                <p className="flex items-center gap-5 leading-relaxed">
                  <span className="w-2.5 h-2.5 bg-brand-soft-gold rounded-full flex-shrink-0"></span>
                  {getContent('tech_spec_2', 'Modulable de 6 metros x 12 metros. escalables')}
                </p>
                <p className="flex items-center gap-5 leading-relaxed">
                  <span className="w-2.5 h-2.5 bg-brand-soft-gold rounded-full flex-shrink-0"></span>
                  {getContent('tech_spec_3', 'Diseño adaptable a cualquier terreno y clima')}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Form Centered */}
          <div className="max-w-4xl mx-auto bg-brand-white p-8 md:p-16 rounded-[3rem] shadow-2xl border border-brand-light-gray">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 font-sans">
                
                <div className="space-y-6">
                  <div className="relative group">
                    <input {...register("nombreApellido", { required: true })} placeholder="Nombre y Apellido*" className="peer w-full py-3 border-b-2 border-brand-light-gray focus:border-brand-soft-gold outline-none transition-all placeholder-transparent text-brand-nordic-blue font-medium" />
                    <label className="absolute left-0 -top-3.5 text-brand-nordic-blue/60 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-brand-nordic-blue peer-focus:text-sm">Nombre y Apellido*</label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative group">
                      <input {...register("email", { required: true })} type="email" placeholder="Email*" className="peer w-full py-3 border-b-2 border-brand-light-gray focus:border-brand-soft-gold outline-none transition-all placeholder-transparent text-brand-nordic-blue font-medium" />
                      <label className="absolute left-0 -top-3.5 text-brand-nordic-blue/60 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-brand-nordic-blue peer-focus:text-sm">Email*</label>
                    </div>
                    <div className="relative group">
                      <input {...register("telefono", { required: true })} placeholder="Teléfono*" className="peer w-full py-3 border-b-2 border-brand-light-gray focus:border-brand-soft-gold outline-none transition-all placeholder-transparent text-brand-nordic-blue font-medium" />
                      <label className="absolute left-0 -top-3.5 text-brand-nordic-blue/60 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-brand-nordic-blue peer-focus:text-sm">Teléfono*</label>
                    </div>
                  </div>

                  <div className="relative group">
                    <input {...register("ubicacion", { required: true })} placeholder="Ubicación del Evento (Localidad/Zona)*" className="peer w-full py-3 border-b-2 border-brand-light-gray focus:border-brand-soft-gold outline-none transition-all placeholder-transparent text-brand-nordic-blue font-medium" />
                    <label className="absolute left-0 -top-3.5 text-brand-nordic-blue/60 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-brand-nordic-blue peer-focus:text-sm">Ubicación del Evento (Localidad/Zona)*</label>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-brand-nordic-blue/70 font-bold">Fecha y Hora del evento*</label>
                    <input {...register("fechaHora", { required: true })} type="datetime-local" className="w-full py-2 border-b-2 border-brand-light-gray focus:border-brand-soft-gold outline-none transition-all bg-transparent text-brand-nordic-blue font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-brand-nordic-blue/70 font-bold">Duración estimada (hs)*</label>
                    <input {...register("duracion", { required: true })} type="number" placeholder="6" className="w-full py-2 border-b-2 border-brand-light-gray focus:border-brand-soft-gold outline-none transition-all bg-transparent text-brand-nordic-blue font-medium" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-brand-nordic-blue/70 font-bold">Cantidad de Personas (Máx 400)*</label>
                    <input {...register("invitados", { required: true, max: 400 })} type="number" placeholder="100" className="w-full py-2 border-b-2 border-brand-light-gray focus:border-brand-soft-gold outline-none transition-all bg-transparent text-brand-nordic-blue font-medium" />
                  </div>
                  <div className="space-y-4">
                    <p className="font-cinzel text-[10px] tracking-wider text-brand-nordic-blue font-bold uppercase">¿Ambientación para presentación?</p>
                    <div className="flex gap-8">
                      {['Si', 'No'].map(val => (
                        <label key={val} className="flex items-center gap-3 cursor-pointer">
                          <input type="radio" value={val} {...register("ambientacion")} className="accent-brand-nordic-blue w-4 h-4" />
                          <span className="text-sm font-medium">{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="font-cinzel text-[10px] tracking-wider text-brand-nordic-blue font-bold uppercase">¿Técnica y Sonido?</p>
                    <div className="flex gap-8">
                      {['Si', 'No'].map(val => (
                        <label key={val} className="flex items-center gap-3 cursor-pointer">
                          <input type="radio" value={val} {...register("sonidoTecnica")} className="accent-brand-nordic-blue w-4 h-4" />
                          <span className="text-sm font-medium">{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="font-cinzel text-[10px] tracking-wider text-brand-nordic-blue font-bold uppercase">¿Pista de Baile?</p>
                    <div className="flex gap-8">
                      {['Si', 'No'].map(val => (
                        <label key={val} className="flex items-center gap-3 cursor-pointer">
                          <input type="radio" value={val} {...register("pistaBaile")} className="accent-brand-nordic-blue w-4 h-4" />
                          <span className="text-sm font-medium">{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-cinzel text-sm tracking-wider text-brand-nordic-blue font-bold uppercase">Mobiliario Requerido</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['Juegos de Living', 'Sillas', 'Ambos', 'Ninguno'].map(item => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer p-3 border-2 border-brand-light-gray rounded-xl hover:border-brand-soft-gold hover:bg-brand-light-gray/20 transition-all font-medium">
                        <input type="radio" value={item} {...register("mobiliario")} className="accent-brand-nordic-blue" />
                        <span className="text-xs md:text-sm">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <textarea {...register("comentarios")} placeholder="Comentarios adicionales..." className="peer w-full py-3 border-b-2 border-brand-light-gray focus:border-brand-soft-gold outline-none transition-all placeholder-transparent min-h-[100px] bg-transparent text-brand-nordic-blue font-medium" />
                    <label className="absolute left-0 -top-3.5 text-brand-nordic-blue/60 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-brand-nordic-blue peer-focus:text-sm">Comentarios adicionales...</label>
                  </div>
                </div>

                <button type="submit" className="w-full bg-brand-nordic-blue text-brand-white py-6 rounded-2xl font-cinzel tracking-[0.3em] text-lg hover:bg-brand-pine-green transition-all shadow-xl hover:shadow-brand-nordic-blue/20 flex items-center justify-center gap-4 group border-b-4 border-brand-soft-gold">
                  <MessageCircle className="group-hover:scale-110 transition-transform text-brand-soft-gold" />
                  SOLICITAR PRESUPUESTO
                </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-pine-green text-brand-white py-20 px-6 border-t-8 border-brand-soft-gold">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-16">
          <div className="space-y-8">
            <h3 className="font-cinzel text-3xl tracking-widest text-brand-white">NORDEN<br/><span className="text-brand-soft-gold">ZELT</span></h3>
            <p className="font-sans text-sm leading-relaxed opacity-80 max-w-xs">
              {getContent('footer_desc', 'Especialistas Carpas para eventos sociales y corporativos de alto nivel.')}
            </p>
          </div>
          
          <div className="space-y-8">
            <h4 className="font-cinzel text-sm tracking-[0.2em] text-brand-soft-gold uppercase font-bold">{getContent('footer_contact_label', 'Contacto')}</h4>
            <div className="space-y-4">
              <a href="https://instagram.com" target="_blank" className="flex items-center gap-4 hover:text-brand-soft-gold transition-colors group">
                <div className="w-10 h-10 rounded-full border border-brand-soft-gold/20 flex items-center justify-center group-hover:border-brand-soft-gold/50">
                  <Instagram size={18} />
                </div>
                <span className="text-sm font-medium tracking-wide">{getContent('contact_ig', '@nordenzelt')}</span>
              </a>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full border border-brand-soft-gold/20 flex items-center justify-center">
                  <Mail size={18} />
                </div>
                <span className="text-sm font-medium tracking-wide">{getContent('contact_email', 'contacto@nordenzelt.com')}</span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="font-cinzel text-sm tracking-[0.2em] text-brand-soft-gold uppercase font-bold">{getContent('footer_location_label', 'Ubicación')}</h4>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full border border-brand-soft-gold/20 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} />
              </div>
              <p className="text-sm font-medium leading-relaxed">
                {getContent('location_text', 'Buenos Aires, Argentina\nServicio de cobertura nacional')}
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-brand-soft-gold/10 text-center">
          <p className="text-[10px] tracking-[0.2em] uppercase opacity-60 font-bold">
            © {new Date().getFullYear()} NORDEN ZELT - Todos los derechos reservados
          </p>
          <div className="mt-4 flex justify-center">
            <a 
              href="/admin" 
              className="text-[8px] text-transparent hover:text-brand-light-gray/20 transition-all cursor-default select-none"
            >
              Admin Access
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
