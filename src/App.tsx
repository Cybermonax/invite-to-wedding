import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ChevronDown, MapPin, Clock, Instagram, Shirt, CalendarHeart, User } from 'lucide-react';
import { siteConfig } from './config';
import { guestList, Guest } from './guests';
import { supabase } from './supabase';

interface FlyingHeart {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface BgItem {
  id: string;
  type: 'photo' | 'heart';
  left: number;
  top: number;
  rotation: number;
  delay: number;
  imgSeed: number;
  floatDuration: number;
  moveX: number[];
  moveY: number[];
}

export default function App() {
  const resolveAsset = (path: string | undefined) => {
    if (!path) return path;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return import.meta.env.BASE_URL + path.slice(1);
    return path;
  };

  const [hearts, setHearts] = useState<FlyingHeart[]>([]);
  const [bgItems, setBgItems] = useState<BgItem[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [pin, setPin] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [hasDeclined, setHasDeclined] = useState(false);
  const [isConfirmingDecline, setIsConfirmingDecline] = useState(false);
  const [loggedInGuest, setLoggedInGuest] = useState<Guest | null>(null);
  const [loginError, setLoginError] = useState(false);
  const [rsvps, setRsvps] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!supabase) return;

    // Завантажуємо початкові дані
    const fetchRsvps = async () => {
      const { data, error } = await supabase.from('rsvps').select('*');
      if (error) {
        console.error('Error fetching RSVPs:', error);
        return;
      }
      
      const newRsvps: Record<string, string> = {};
      data.forEach((row) => {
        newRsvps[row.guest_id] = row.status;
      });
      setRsvps(newRsvps);
    };

    fetchRsvps();

    // Підписуємось на зміни в реальному часі
    const subscription = supabase
      .channel('public:rsvps')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps' }, (payload) => {
        setRsvps((prev) => ({
          ...prev,
          [payload.new.guest_id]: payload.new.status
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Обчислюємо список підтверджених гостей динамічно
  const confirmedGuests = guestList
    .filter(g => g.hasConfirmed || rsvps[g.id] === 'confirmed' || (!supabase && typeof window !== 'undefined' && localStorage.getItem(`rsvp_${g.pin}`) === 'confirmed'))
    .map(g => ({
      ...g,
      avatar: g.avatar || `https://robohash.org/${g.id}?set=set4&size=200x200`
    }));

  const handleLogoClick = (e: React.MouseEvent) => {
    setClickCount(prev => prev + 1);

    // Анімація вилітаючих сердечок з самого логотипу (при кожному кліку)
    const newHearts = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 400, 
      y: (Math.random() - 0.5) * 400 - 150, 
      scale: Math.random() * 0.6 + 0.4, 
      rotation: (Math.random() - 0.5) * 120, 
    }));

    setHearts((prev) => [...prev, ...newHearts]);

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !newHearts.includes(h)));
    }, 3000);

    // При першому кліку генеруємо фонові фотографії та сердечки
    if (clickCount === 0) {
      const w = typeof window !== 'undefined' ? window.innerWidth : 800;
      const isMobile = w < 768;
      
      // Генеруємо 12 елементів (6 фото і 6 сердечок)
      const newBgItems = Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        
        // Використовуємо відсотки (vw/vh) для адаптивності до розміру екрану
        const radiusX = isMobile ? 35 : 42; 
        const radiusY = isMobile ? 35 : 40; 
        
        const left = 50 + Math.cos(angle) * radiusX + (Math.random() - 0.5) * 10;
        const top = 50 + Math.sin(angle) * radiusY + (Math.random() - 0.5) * 10;
        
        const type: BgItem['type'] = i % 2 === 0 ? 'photo' : 'heart';

        // Траєкторія повільного польоту (в пікселях від початкової точки)
        const moveRange = isMobile ? 60 : 150;
        const moveX = [0, (Math.random() - 0.5) * moveRange, (Math.random() - 0.5) * moveRange, 0];
        const moveY = [0, (Math.random() - 0.5) * moveRange, (Math.random() - 0.5) * moveRange, 0];

        return {
          id: 'bg' + Date.now() + i,
          type,
          left,
          top,
          rotation: (Math.random() - 0.5) * 40,
          delay: Math.random() * 0.4,
          imgSeed: Math.floor(i / 2),
          floatDuration: 20 + Math.random() * 20, // Дуже повільно (20-40 секунд)
          moveX,
          moveY
        };
      });
      setBgItems(newBgItems);
    }
  };

  const handleConfirm = async () => {
    setHasConfirmed(true);
    setHasDeclined(false);
    if (loggedInGuest) {
      if (supabase) {
        await supabase.from('rsvps').upsert({ 
          guest_id: loggedInGuest.id, 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        });
      } else {
        localStorage.setItem(`rsvp_${loggedInGuest.pin}`, 'confirmed');
      }
      
      // Надсилаємо відповідь на Formspree
      if (siteConfig.rsvpWebhookUrl) {
        try {
          await fetch(siteConfig.rsvpWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              Гість: loggedInGuest.name,
              Статус: 'Підтвердив присутність ✅',
              Час: new Date().toLocaleString('uk-UA')
            })
          });
        } catch (e) {
          console.error("Помилка відправки", e);
        }
      }
    }
  };

  const handleDecline = async () => {
    setHasDeclined(true);
    setHasConfirmed(false);
    setIsConfirmingDecline(false);
    if (loggedInGuest) {
      if (supabase) {
        await supabase.from('rsvps').upsert({ 
          guest_id: loggedInGuest.id, 
          status: 'declined',
          updated_at: new Date().toISOString()
        });
      } else {
        localStorage.setItem(`rsvp_${loggedInGuest.pin}`, 'declined');
      }
      
      // Надсилаємо відповідь на Formspree
      if (siteConfig.rsvpWebhookUrl) {
        try {
          await fetch(siteConfig.rsvpWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              Гість: loggedInGuest.name,
              Статус: 'Не зможе прийти ❌',
              Час: new Date().toLocaleString('uk-UA')
            })
          });
        } catch (e) {
          console.error("Помилка відправки", e);
        }
      }
    }
  };

  const handleResetRsvp = async () => {
    setHasConfirmed(false);
    setHasDeclined(false);
    if (loggedInGuest) {
      if (supabase) {
        await supabase.from('rsvps').upsert({ 
          guest_id: loggedInGuest.id, 
          status: 'none',
          updated_at: new Date().toISOString()
        });
      } else {
        localStorage.removeItem(`rsvp_${loggedInGuest.pin}`);
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const guest = guestList.find(g => g.pin === pin);
    if (guest) {
      const guestWithAvatar = {
        ...guest,
        avatar: guest.avatar || `https://robohash.org/${guest.id}?set=set4&size=200x200`
      };
      
      setLoggedInGuest(guestWithAvatar);
      setIsLoggedIn(true);
      setLoginError(false);
      
      const savedStatus = supabase ? rsvps[guest.id] : localStorage.getItem(`rsvp_${guest.pin}`);
      if (savedStatus === 'confirmed' || guest.hasConfirmed) {
        setHasConfirmed(true);
        setHasDeclined(false);
      } else if (savedStatus === 'declined') {
        setHasDeclined(true);
        setHasConfirmed(false);
      } else {
        setHasConfirmed(false);
        setHasDeclined(false);
      }
    } else {
      setLoginError(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-pattern text-wedding-text"
        style={{
          backgroundImage: `linear-gradient(rgba(44, 38, 32, 0.85), rgba(44, 38, 32, 0.85)), url('${import.meta.env.BASE_URL}bg_guest.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-xl border border-white/10 shadow-2xl max-w-md w-full mx-4 text-center"
        >
          <h2 className="text-3xl md:text-4xl mb-4 font-serif font-bold text-white">Вхід за запрошенням</h2>
          <p className="text-white/70 mb-8 font-sans text-sm leading-relaxed">
            Будь ласка, введіть ваш персональний PIN-код, щоб отримати доступ до деталей весілля.
          </p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <input 
              type="text" 
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setLoginError(false);
              }}
              placeholder="PIN-код (напр. 1111)" 
              className={`px-6 py-4 rounded-2xl bg-black/20 border ${loginError ? 'border-red-500' : 'border-white/20'} text-white placeholder:text-white/40 text-center text-xl tracking-[0.3em] focus:outline-none focus:border-wedding-gold focus:ring-1 focus:ring-wedding-gold font-sans transition-all`}
            />
            {loginError && (
              <p className="text-red-400 text-sm font-sans mt-[-10px]">Невірний PIN-код. Спробуйте ще раз.</p>
            )}
            <button 
              type="submit"
              className="px-6 py-4 rounded-2xl bg-wedding-gold text-white font-sans font-bold text-lg hover:bg-wedding-gold-dark transition-colors shadow-lg shadow-wedding-gold/30"
            >
              Увійти
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-pattern text-wedding-text"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.65)), url('${import.meta.env.BASE_URL}bg.jpg')`
      }}
    >
      
      {/* СЕКЦІЯ 1: ГОЛОВНА (ГЕРОЙ) */}
      <section className="relative h-screen w-full snap-start flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-wedding-gold blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-wedding-gold-light blur-[120px]"></div>
        </div>

        {/* Фонові Фото та Сердечки */}
        <AnimatePresence>
          {clickCount >= 1 && bgItems.map((item) => (
            <div 
              key={item.id}
              className="absolute z-0 pointer-events-none"
              style={{ left: `${item.left}%`, top: `${item.top}%`, transform: 'translate(-50%, -50%)' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ 
                  opacity: item.type === 'photo' ? 0.9 : 0.6, 
                  scale: 1, 
                  x: item.moveX, 
                  y: item.moveY, 
                  rotate: [item.rotation, item.rotation + 15, item.rotation - 15, item.rotation]
                }}
                transition={{ 
                  opacity: { duration: 1.2, delay: item.delay },
                  scale: { duration: 1.2, delay: item.delay, type: "spring", bounce: 0.4 },
                  x: { duration: item.floatDuration, repeat: Infinity, ease: "linear" },
                  y: { duration: item.floatDuration, repeat: Infinity, ease: "linear" },
                  rotate: { duration: item.floatDuration * 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                {item.type === 'photo' && (
                  <div className="w-20 h-24 md:w-32 md:h-36 bg-white p-1.5 md:p-2 pb-6 md:pb-8 shadow-2xl rounded-sm border border-gray-100">
                    <img 
                      src={resolveAsset(siteConfig.gallery[item.imgSeed % siteConfig.gallery.length])} 
                      alt="Наше фото" 
                      className="w-full h-full object-cover grayscale-[20%] sepia-[30%]" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                )}
                {item.type === 'heart' && <Heart className="text-wedding-gold w-10 h-10 md:w-16 md:h-16" fill="currentColor" />}
              </motion.div>
            </div>
          ))}
        </AnimatePresence>

        {/* Верхній текст */}
        <div className="absolute top-8 md:top-12 w-full flex justify-center z-30 pointer-events-none">
          <AnimatePresence>
            {clickCount >= 2 && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-wedding-border pointer-events-auto"
              >
                <p className="text-wedding-gold tracking-[0.2em] uppercase text-xs md:text-sm font-sans font-bold m-0">
                  {siteConfig.hero.topText}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Інтерактивне Лого */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="relative cursor-pointer group" onClick={handleLogoClick}>
            
            <AnimatePresence>
              {clickCount < 2 && (
                <motion.div
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  className="absolute -top-16 md:-top-20 left-1/2 -translate-x-1/2 text-wedding-gold font-serif font-bold text-xl md:text-2xl whitespace-nowrap"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex flex-col items-center gap-1 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
                  >
                    <span>{clickCount === 0 ? 'Тицьни тут!' : 'І ще раз тицьни!'}</span>
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-48 h-48 md:w-72 md:h-72 mx-auto rounded-full flex flex-col items-center justify-center shadow-2xl shadow-wedding-gold/30 bg-white overflow-hidden border-4 border-wedding-border"
            >
              {siteConfig.hero.logoImage ? (
                <img src={resolveAsset(siteConfig.hero.logoImage)} alt="Логотип" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-wedding-gold-light/30 text-center p-4">
                  <span className="text-xs md:text-sm text-wedding-text/50 mb-2 font-sans">(Місце для вашого малюнку з котиками)</span>
                  <Heart className="text-wedding-gold w-10 h-10 md:w-12 md:h-12 animate-pulse" fill="currentColor" />
                </div>
              )}
            </motion.div>

            <AnimatePresence>
              {hearts.map((heart) => (
                <motion.div
                  key={heart.id}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                  animate={{ 
                    opacity: 0, 
                    x: heart.x, 
                    y: heart.y, 
                    scale: heart.scale,
                    rotate: heart.rotation 
                  }}
                  transition={{ duration: 2.5, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
                >
                  <Heart className="text-wedding-gold w-8 h-8 md:w-10 md:h-10" fill="currentColor" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Фото Нареченого (Зліва) */}
        <AnimatePresence>
          {clickCount >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 100, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 1.2, delay: 0.3, type: "spring" }}
              className="absolute bottom-0 -left-4 sm:left-0 md:left-10 z-10 pointer-events-none"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-32 sm:w-44 md:w-80 flex flex-col items-center"
              >
                {siteConfig.hero.groomPng ? (
                  <img src={resolveAsset(siteConfig.hero.groomPng)} alt="Наречений" className="w-full h-auto object-contain object-bottom drop-shadow-2xl" />
                ) : (
                  <div className="w-32 h-44 sm:w-44 sm:h-60 md:w-72 md:h-96 bg-gradient-to-t from-wedding-text/10 to-transparent rounded-t-full border-t-2 border-white/40 flex flex-col items-center justify-end pb-4 md:pb-8 backdrop-blur-[2px]">
                    <User className="w-6 h-6 md:w-12 md:h-12 text-wedding-text/30 mb-2" />
                    <span className="text-wedding-text/50 font-sans font-bold text-[8px] md:text-xs text-center leading-tight">Наречений<br/>(PNG)</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Фото Нареченої (Справа) */}
        <AnimatePresence>
          {clickCount >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 100, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 1.2, delay: 0.5, type: "spring" }}
              className="absolute bottom-0 -right-4 sm:right-0 md:right-10 z-10 pointer-events-none"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="w-32 sm:w-44 md:w-80 flex flex-col items-center"
              >
                {siteConfig.hero.bridePng ? (
                  <img src={resolveAsset(siteConfig.hero.bridePng)} alt="Наречена" className="w-full h-auto object-contain object-bottom drop-shadow-2xl" />
                ) : (
                  <div className="w-32 h-44 sm:w-44 sm:h-60 md:w-72 md:h-96 bg-gradient-to-t from-wedding-gold/20 to-transparent rounded-t-full border-t-2 border-white/40 flex flex-col items-center justify-end pb-4 md:pb-8 backdrop-blur-[2px]">
                    <User className="w-6 h-6 md:w-12 md:h-12 text-wedding-gold/40 mb-2" />
                    <span className="text-wedding-gold/60 font-sans font-bold text-[8px] md:text-xs text-center leading-tight">Наречена<br/>(PNG)</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Нижній текст */}
        <div className="absolute bottom-32 md:bottom-16 w-full flex justify-center z-30 pointer-events-none">
          <AnimatePresence>
            {clickCount >= 2 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-white/80 backdrop-blur-md px-6 py-4 md:px-8 md:py-6 rounded-[2rem] shadow-xl border border-wedding-border flex flex-col items-center text-center pointer-events-auto"
              >
                <h1 className="text-3xl md:text-6xl font-serif font-bold text-wedding-text mb-2 drop-shadow-sm">
                  {siteConfig.hero.groomName} <span className="text-wedding-gold mx-1 md:mx-2">&</span> {siteConfig.hero.brideName}
                </h1>
                <div className="flex items-center gap-2 md:gap-3 mt-1 text-sm md:text-lg font-serif italic text-wedding-text/80">
                  <span>{siteConfig.hero.dayOfWeek}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></span>
                  <span className="font-bold">{siteConfig.hero.date}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></span>
                  <span>{siteConfig.hero.month}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Індикатор скролу */}
        <AnimatePresence>
          {clickCount >= 2 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute bottom-2 flex flex-col items-center text-wedding-gold z-30 pointer-events-none"
            >
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-[0.2em] mb-1 font-sans font-bold">Гортайте вниз</span>
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* СЕКЦІЯ 2: ДЕТАЛІ */}
      <section className="relative min-h-screen w-full snap-start flex flex-col items-center justify-center py-20 px-4 md:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-6xl w-full"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-center text-wedding-text mb-16">
            Деталі нашого свята
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Церемонія */}
            <div className="flex flex-col items-center text-center p-8 bg-white rounded-[2rem] shadow-xl shadow-black/5 border border-wedding-border relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-wedding-gold"></div>
              <CalendarHeart className="w-12 h-12 text-wedding-gold mb-4" strokeWidth={1.5} />
              <h3 className="text-2xl font-serif font-bold mb-4">Церемонія одруження</h3>
              
              <div className="bg-wedding-gold-light/30 border border-wedding-gold/30 rounded-2xl py-3 px-8 mb-6 shadow-inner">
                <p className="font-sans text-xs uppercase tracking-widest text-wedding-text/60 mb-1">Час початку</p>
                <p className="text-4xl md:text-5xl font-serif font-bold text-wedding-gold drop-shadow-sm">{siteConfig.ceremony.time}</p>
              </div>

              <p className="font-sans font-medium text-lg mb-1">{siteConfig.ceremony.place}</p>
              <p className="text-wedding-text/70 font-sans text-sm mb-6">{siteConfig.ceremony.address}</p>
              
              <a 
                href={siteConfig.ceremony.mapLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-2 px-6 py-3 rounded-full bg-wedding-bg text-wedding-text font-sans text-sm font-semibold hover:bg-wedding-gold hover:text-white transition-colors border border-wedding-border hover:border-wedding-gold"
              >
                <MapPin className="w-4 h-4" />
                Відкрити на карті
              </a>
            </div>

            {/* Ведуча */}
            <div className="flex flex-col items-center text-center p-8 bg-white rounded-[2rem] shadow-xl shadow-black/5 border border-wedding-border relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-wedding-gold"></div>
              <div className="w-40 h-40 rounded-full overflow-hidden mb-6 border-4 border-wedding-gold-light shadow-md bg-white flex items-center justify-center">
                <img src={resolveAsset(siteConfig.host.photo)} alt={siteConfig.host.name} className="w-full h-full object-cover" style={{ imageRendering: 'high-quality' }} referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-2">{siteConfig.host.role}</h3>
              <p className="font-sans font-medium text-lg mb-6 text-wedding-text/80">{siteConfig.host.name}</p>
              
              <a 
                href={siteConfig.host.instagramLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-2 px-6 py-3 rounded-full bg-wedding-bg text-wedding-text font-sans text-sm font-semibold hover:bg-wedding-gold hover:text-white transition-colors border border-wedding-border hover:border-wedding-gold"
              >
                <Instagram className="w-4 h-4" />
                Instagram
              </a>
            </div>

            {/* Застілля */}
            <div className="flex flex-col items-center text-center p-8 bg-white rounded-[2rem] shadow-xl shadow-black/5 border border-wedding-border relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-wedding-gold-dark"></div>
              <Clock className="w-12 h-12 text-wedding-gold-dark mb-4" strokeWidth={1.5} />
              <h3 className="text-2xl font-serif font-bold mb-4">Святкове застілля</h3>
              
              <div className="bg-wedding-gold-light/30 border border-wedding-gold/30 rounded-2xl py-3 px-8 mb-6 shadow-inner">
                <p className="font-sans text-xs uppercase tracking-widest text-wedding-text/60 mb-1">Час початку</p>
                <p className="text-4xl md:text-5xl font-serif font-bold text-wedding-gold-dark drop-shadow-sm">{siteConfig.banquet.time}</p>
              </div>

              <p className="font-sans font-medium text-lg mb-1">{siteConfig.banquet.place}</p>
              <p className="text-wedding-text/70 font-sans text-sm mb-6">{siteConfig.banquet.address}</p>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-auto w-full">
                <a 
                  href={siteConfig.banquet.mapLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-wedding-bg text-wedding-text font-sans text-sm font-semibold hover:bg-wedding-gold-dark hover:text-white transition-colors border border-wedding-border hover:border-wedding-gold-dark"
                >
                  <MapPin className="w-4 h-4" />
                  Карта
                </a>
                <a 
                  href={siteConfig.banquet.instagramLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-wedding-bg text-wedding-text font-sans text-sm font-semibold hover:bg-wedding-gold-dark hover:text-white transition-colors border border-wedding-border hover:border-wedding-gold-dark"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </a>
              </div>
            </div>

            {/* Дрес-код */}
            <div 
              className="flex flex-col items-center text-center p-8 text-white rounded-[2rem] shadow-xl shadow-wedding-gold/20 md:col-span-2 lg:col-span-3 relative overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(rgba(44, 38, 32, 0.7), rgba(44, 38, 32, 0.7)), url('${import.meta.env.BASE_URL}bg_drescode.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              
              <Shirt className="w-12 h-12 text-white mb-6 relative z-10" strokeWidth={1.5} />
              <h3 className="text-2xl font-serif font-bold mb-4 relative z-10">Дрес-код</h3>
              <p className="text-xl font-sans font-medium mb-4 relative z-10 uppercase tracking-widest">{siteConfig.dressCode.style}</p>
              <p className="text-white/80 font-sans text-sm max-w-lg relative z-10">
                {siteConfig.dressCode.description}
              </p>
            </div>

          </div>
        </motion.div>
      </section>

      {/* СЕКЦІЯ 3: RSVP / ВХІД */}
      <section 
        className="relative min-h-screen w-full snap-start flex flex-col items-center justify-center text-wedding-bg px-4 py-20"
        style={{
          backgroundImage: `linear-gradient(rgba(44, 38, 32, 0.85), rgba(44, 38, 32, 0.85)), url('${import.meta.env.BASE_URL}bg_guest.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >

        <div className="max-w-2xl w-full text-center relative z-10 flex flex-col items-center">
          {!hasConfirmed && !hasDeclined && !isConfirmingDecline ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-wedding-bg p-8 md:p-10 rounded-[2.5rem] text-wedding-text shadow-2xl max-w-md w-full"
            >
              <div className="w-28 h-28 mx-auto rounded-full bg-gray-200 mb-6 overflow-hidden border-4 border-wedding-gold shadow-lg flex items-center justify-center">
                {loggedInGuest?.avatar ? (
                  <img src={resolveAsset(loggedInGuest.avatar)} alt={loggedInGuest.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <h2 className="text-2xl font-serif font-bold mb-2">Дорогий(а) {loggedInGuest?.name}!</h2>
              <p className="text-wedding-text/70 mb-8 font-sans text-sm">
                Ми дуже раді, що ви розділите цей особливий день з нами. Підтвердіть, будь ласка, вашу присутність.
              </p>
              
              <div className="flex flex-col gap-3 font-sans font-semibold">
                <button 
                  onClick={handleConfirm}
                  className="px-6 py-4 rounded-2xl bg-wedding-gold text-white hover:bg-wedding-gold-dark transition-colors shadow-lg shadow-wedding-gold/20"
                >
                  Я обов'язково буду! 🇺🇦
                </button>
                <button 
                  onClick={() => setIsConfirmingDecline(true)}
                  className="px-6 py-4 rounded-2xl bg-wedding-gold-light text-wedding-text hover:bg-wedding-border transition-colors"
                >
                  На жаль, не зможу
                </button>
              </div>
            </motion.div>
          ) : isConfirmingDecline ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-wedding-bg p-8 md:p-10 rounded-[2.5rem] text-wedding-text shadow-2xl max-w-md w-full text-center"
            >
              <h2 className="text-2xl font-serif font-bold mb-4">Ви точно не зможете? 🥺</h2>
              <p className="text-wedding-text/70 mb-8 font-sans text-sm">
                Ми б дуже хотіли бачити вас на нашому святі.
              </p>
              <div className="flex flex-col gap-3 font-sans font-semibold">
                <button 
                  onClick={handleDecline}
                  className="px-6 py-4 rounded-2xl bg-wedding-gold-light text-wedding-text hover:bg-wedding-border transition-colors"
                >
                  Так, точно не зможу
                </button>
                <button 
                  onClick={() => {
                    setIsConfirmingDecline(false);
                    handleConfirm();
                  }}
                  className="px-6 py-4 rounded-2xl bg-wedding-gold text-white hover:bg-wedding-gold-dark transition-colors shadow-lg shadow-wedding-gold/20"
                >
                  Я передумав(ла), буду!
                </button>
              </div>
            </motion.div>
          ) : hasDeclined ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col items-center"
            >
              <div className="bg-wedding-bg p-8 rounded-[2.5rem] text-wedding-text shadow-2xl mb-12 max-w-md w-full">
                <h2 className="text-3xl font-serif font-bold mb-2">Шкода.</h2>
                <p className="text-wedding-text/70 font-sans mb-6">Наречені дуже засмучені :(</p>
                <button 
                  onClick={handleResetRsvp}
                  className="px-6 py-3 rounded-xl bg-wedding-gold-light text-wedding-text hover:bg-wedding-border transition-colors font-sans font-semibold text-sm"
                >
                  Ой халепа, хочу змінити відповідь
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col items-center"
            >
              <div className="bg-wedding-bg p-8 rounded-[2.5rem] text-wedding-text shadow-2xl mb-12 max-w-md w-full">
                <Heart className="w-16 h-16 text-wedding-gold mx-auto mb-4" fill="currentColor" />
                <h2 className="text-3xl font-serif font-bold mb-2">Дякуємо!</h2>
                <p className="text-wedding-text/70 font-sans mb-6">Ваша присутність підтверджена. З нетерпінням чекаємо на зустріч!</p>
                <button 
                  onClick={handleResetRsvp}
                  className="px-6 py-3 rounded-xl bg-wedding-gold-light text-wedding-text hover:bg-wedding-border transition-colors font-sans font-semibold text-sm"
                >
                  Ой халепа, хочу змінити відповідь
                </button>
              </div>

              {/* Список гостей */}
              <div className="w-full max-w-2xl text-left">
                <h3 className="text-3xl font-serif font-bold text-center mb-8 text-white drop-shadow-md">Хто вже з нами:</h3>
                <div className="flex flex-col gap-4">
                  {confirmedGuests.length > 0 ? (
                    [...confirmedGuests]
                      .map((g, i) => ({ ...g, originalIndex: i }))
                      .sort((a, b) => {
                        const pA = a.priority ?? 999;
                        const pB = b.priority ?? 999;
                        if (pA !== pB) return pA - pB;
                        return a.originalIndex - b.originalIndex;
                      })
                      .map((guest, idx) => {
                      const isMe = loggedInGuest?.id === guest.id;
                      return (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className={`flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border ${isMe ? 'border-wedding-gold shadow-wedding-gold/20' : 'border-white/20'} shadow-lg relative`}
                      >
                        <div className="relative shrink-0">
                          <img src={resolveAsset(guest.avatar)} alt={guest.name} className="w-20 h-20 rounded-full object-cover border-2 border-wedding-gold bg-white" style={{ imageRendering: 'high-quality' }} referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1">
                          <p className="font-serif font-bold text-lg text-white">
                            {guest.name} 
                            {guest.role && <span className="text-xs md:text-sm font-sans font-normal text-white/70 ml-2 px-2 py-0.5 bg-black/20 rounded-full">{guest.role}</span>}
                          </p>
                          {guest.phrase && <p className="font-sans text-sm text-white/90 italic mt-1">"{guest.phrase}"</p>}
                        </div>
                      </motion.div>
                    )})
                  ) : (
                    <p className="text-center text-white/70 font-sans italic">Поки що тут нікого немає. Ви будете першими!</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

    </div>
  );
}
