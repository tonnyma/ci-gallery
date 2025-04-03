"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import gsap from 'gsap';

// Set GSAP defaults
gsap.defaults({
  duration: 0.5,
  ease: "power2.out"
});

// Define a Portfolio interface for clarity
interface Portfolio {
  id: number;
  name: string;
  url: string;
}

const Gallery = () => {
  // Grouped state declarations for portfolios and form inputs
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [zoomLevels, setZoomLevels] = useState<Record<number, number>>({});
  const [loggedIn, setLoggedIn] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showToastMessage, setShowToastMessage] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<string | false>(false);
  const [iframesLoaded, setIframesLoaded] = useState<{ [key: string]: boolean }>({});

  // Add refs for GSAP
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const modalRef = useRef(null);
  const backdropRef = useRef(null);
  const toolbarRef = useRef(null);
  const headerRef = useRef(null);
  const hasAnimatedToolbar = useRef(false);
  const hasAnimatedHeader = useRef(false);

  // Check if all iframes are loaded
  const areAllIframesLoaded = useCallback(() => {
    return portfolios.length > 0 && portfolios.every(portfolio => iframesLoaded[`iframe-${portfolio.id}`]);
  }, [portfolios, iframesLoaded]);

  // Handle iframe load
  const handleIframeLoad = (portfolioId: number) => {
    setIframesLoaded(prev => ({ ...prev, [`iframe-${portfolioId}`]: true }));
  };

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedIn(!!session);
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchPortfolios = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) {
        console.error('Error fetching portfolios:', error);
        triggerErrorToast('Failed to load portfolios. Please try again.');
        return;
      }
      
      if (data) {
        setPortfolios(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching portfolios:', err);
      triggerErrorToast('An unexpected error occurred. Please try again.');
    }
  }, []);

  // Fetch portfolios when component mounts
  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  useEffect(() => {
    console.log("Toast message:", showErrorToast);
  }, [showErrorToast]);

  // Reusable toast helpers
  const triggerSuccessToast = (message: string) => {
    setShowToastMessage(message);
    setTimeout(() => setShowToastMessage(null), 3000);
  };

  const triggerErrorToast = (message: string) => {
    setShowErrorToast(message);
    setTimeout(() => setShowErrorToast(false), 3000);
  };

  // Handle user login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        triggerErrorToast(error.message || 'Failed to login. Please try again.');
        return;
      }

      if (data.session) {
        setLoggedIn(true);
        setShowLoginForm(false);
        triggerSuccessToast('Logged in successfully!');
        hasAnimatedToolbar.current = false;
        hasAnimatedHeader.current = false;
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      triggerErrorToast('An unexpected error occurred. Please try again.');
    }
  };

  // Reset animation flag on logout
  const handleLogout = () => {
    setLoggedIn(false);
    triggerSuccessToast('Logged out successfully!');
    hasAnimatedToolbar.current = false;
    hasAnimatedHeader.current = false;
  };

  // Handle adding a new portfolio
  const handleAddPortfolio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { data } = await supabase
      .from('portfolios')
      .insert([{ name, url }])
      .select()
      .single();

    if (data) {
      setPortfolios((prev) => [...prev, data]);
      setName('');
      setUrl('');
    }
  };

  // Handle deleting a portfolio
  const handleDeletePortfolio = async (id: number) => {
    await supabase.from('portfolios').delete().eq('id', id);
    setPortfolios((prev) => prev.filter((p) => p.id !== id));
  };

  // Render toast messages
  const renderToastMessages = () => (
    <>
      {showToastMessage && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow z-50">
          {showToastMessage}
        </div>
      )}
      {showErrorToast && ( // Updated error toast
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow z-[9999]">
          {showErrorToast}
        </div>
      )}
    </>
  );

  // Add GSAP animations when tiles mount
  useEffect(() => {
    if (portfolios.length > 0) {
      const tl = gsap.timeline();
      
      // First animate the tiles
      tl.fromTo(tileRefs.current,
        { 
          opacity: 0, 
          y: 20,
          scale: 0.98
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: {
            amount: 0.6,
            ease: "power1.in"
          }
        }
      );
    }
  }, [portfolios]);

  // Separate effect for header and toolbar animations
  useEffect(() => {
    if (portfolios.length > 0 && 
        areAllIframesLoaded()) {
      
      // Animate header if not already animated
      if (!hasAnimatedHeader.current) {
        hasAnimatedHeader.current = true;
        gsap.fromTo(headerRef.current,
          {
            y: -100,
            opacity: 0
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power3.out"
          }
        );
      }

      // Animate toolbar if logged in and not already animated
      if (loggedIn && !hasAnimatedToolbar.current) {
        hasAnimatedToolbar.current = true;
        gsap.fromTo(toolbarRef.current,
          {
            y: 100,
            opacity: 0
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power3.out"
          }
        );
      }
    }
  }, [loggedIn, portfolios, iframesLoaded]);

  // Handle tile hover animations
  const handleTileHover = (index: number, isEntering: boolean) => {
    gsap.to(tileRefs.current[index], {
      scale: isEntering ? 1.01 : 1,
      y: isEntering ? -3 : 0,
      duration: 0.2,
      ease: "power2.out",
      force3D: true
    });
  };

  // Add modal animation
  useEffect(() => {
    if (showLoginForm) {
      const tl = gsap.timeline();
      tl.fromTo(backdropRef.current,
        { 
          backdropFilter: "blur(0px)",
          backgroundColor: "rgba(0, 0, 0, 0)" 
        },
        { 
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          duration: 0.3
        }
      ).fromTo(modalRef.current,
        { 
          opacity: 0,
          y: 20,
          scale: 0.95
        },
        { 
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          ease: "power3.out"
        },
        "-=0.1" // Start slightly before backdrop finishes
      );
    }
  }, [showLoginForm]);

  const handleCloseLoginForm = () => {
    const tl = gsap.timeline({
      onComplete: () => setShowLoginForm(false)
    });
    
    tl.to(modalRef.current, {
      opacity: 0,
      y: 10,
      scale: 0.95,
      duration: 0.3,
      ease: "power2.in"
    }).to(backdropRef.current, {
      backdropFilter: "blur(0px)",
      backgroundColor: "rgba(0, 0, 0, 0)",
      duration: 0.3
    }, "-=0.2");
  };

  useEffect(() => {
    if (areAllIframesLoaded() && loggedIn && toolbarRef.current) {
      gsap.to(toolbarRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out"
      });
    }
  }, [areAllIframesLoaded, loggedIn, toolbarRef]);

  return (
    <>
      {showLoginForm && (
        <div 
          ref={backdropRef}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/0"
          style={{ backdropFilter: "blur(0px)" }}
        >
          <div 
            ref={modalRef}
            className="bg-[#126D8F]/30 backdrop-blur-xl border border-[rgba(100,212,164,0.07)] p-8 rounded-[32px] shadow-2xl w-96 opacity-0"
          >
            <form
              onSubmit={handleLogin}
              className="flex flex-col gap-4"
            >
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#126D8F]/30 backdrop-blur-xl border border-[rgba(100,212,164,0.07)] text-white px-4 py-3 rounded-[16px] placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[rgba(100,212,164,0.14)]"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#126D8F]/30 backdrop-blur-xl border border-[rgba(100,212,164,0.07)] text-white px-4 py-3 rounded-[16px] placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[rgba(100,212,164,0.14)]"
              />
              <div className="flex justify-between gap-4 mt-2">
                <button
                  type="submit"
                  className="bg-[#126D8F]/30 hover:bg-[#126D8F]/40 backdrop-blur-xl text-white px-6 py-3 rounded-[16px] border border-[rgba(100,212,164,0.07)] shadow-lg transition-all flex-1"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={handleCloseLoginForm}
                  className="bg-[#126D8F]/30 hover:bg-[#126D8F]/40 backdrop-blur-xl text-white px-6 py-3 rounded-[16px] border border-[rgba(100,212,164,0.07)] shadow-lg transition-all flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div 
        ref={headerRef}
        className="w-full fixed top-0 left-0 right-0 z-50 bg-[#126D8F]/30 backdrop-blur-xl border border-[rgba(100,212,164,0.07)] py-4 px-6 flex justify-between items-center shadow-lg opacity-0"
        style={{ transform: 'translateY(-100px)' }}
      >
        <h1 className="text-2xl font-bold text-white">Design Gallery</h1>
        {loggedIn ? (
          <button
            className="bg-[#126D8F]/30 hover:bg-[#126D8F]/40 backdrop-blur-xl text-white px-4 py-2 rounded-[24px] border border-[rgba(100,212,164,0.07)] shadow-lg transition-all"
            onClick={handleLogout}
          >
            Logout
          </button>
        ) : (
          <button
            className="bg-[#126D8F]/30 hover:bg-[#126D8F]/40 backdrop-blur-xl text-white px-4 py-2 rounded-[24px] border border-[rgba(100,212,164,0.07)] shadow-lg transition-all"
            onClick={() => setShowLoginForm(true)}
          >
            Login
          </button>
        )}
      </div>
      {renderToastMessages()}
      <>
        {loggedIn && (
          <div 
            ref={toolbarRef}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#126D8F]/30 backdrop-blur-xl border border-[rgba(100,212,164,0.07)] px-6 py-4 rounded-[32px] shadow-lg w-full max-w-4xl opacity-0"
            style={{ transform: 'translateY(100px)' }}
          >
            <form onSubmit={handleAddPortfolio} className="flex gap-4 items-end">
              <div className="relative w-1/3">
                <input
                  type="text"
                  id="designer-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="peer w-full bg-[#126D8F]/30 backdrop-blur-xl border border-[rgba(100,212,164,0.07)] text-white px-4 py-3 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[rgba(100,212,164,0.14)] pt-6"
                />
                <label
                  htmlFor="designer-name"
                  className="absolute left-4 text-white/70 text-sm transition-all pointer-events-none transform-gpu duration-200 top-2"
                >
                  Designer Name
                </label>
              </div>

              <div className="relative flex-grow">
                <input
                  type="url"
                  id="portfolio-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="peer w-full bg-[#126D8F]/30 backdrop-blur-xl border border-[rgba(100,212,164,0.07)] text-white px-4 py-3 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[rgba(100,212,164,0.14)] pt-6"
                />
                <label
                  htmlFor="portfolio-url"
                  className="absolute left-4 text-white/70 text-sm transition-all pointer-events-none transform-gpu duration-200 top-2"
                >
                  Portfolio URL
                </label>
              </div>

              <button
                type="submit"
                className="bg-[#126D8F]/30 hover:bg-[#126D8F]/40 backdrop-blur-xl text-white px-6 py-3 rounded-[16px] border border-[rgba(100,212,164,0.07)] shadow-lg transition-all"
              >
                Add
              </button>
            </form>
          </div>
        )}
      </>
      <div className="portfolio-grid grid sm:grid-cols-3 auto-rows-[100vh] snap-y snap-mandatory overflow-y-auto w-full">
        {portfolios.map((portfolio, index) => {
          const zoom = zoomLevels[portfolio.id] ?? 1;

          const updateZoom = (delta: number) => {
            setZoomLevels(prev => ({
              ...prev,
              [portfolio.id]: Math.max(0.1, (prev[portfolio.id] ?? 1) + delta),
            }));
          };

          return (
            <div
              key={portfolio.id}
              ref={(el) => { tileRefs.current[index] = el }}
              onMouseEnter={() => handleTileHover(index, true)}
              onMouseLeave={() => handleTileHover(index, false)}
              className="portfolio-item snap-start relative bg-white overflow-hidden shadow flex flex-col group will-change-transform"
            >
              <div className="absolute top-2 left-2 z-10 flex gap-1">
                <button onClick={() => updateZoom(0.1)} className="bg-black text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">+</button>
                <button onClick={() => updateZoom(-0.1)} className="bg-black text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">−</button>
              </div>
              {loggedIn && (
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={() => handleDeletePortfolio(portfolio.id)}
                    className="bg-red-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-700"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="overflow-auto h-full">
                <iframe
                  id={`iframe-${portfolio.id}`}
                  src={portfolio.url}
                  title={portfolio.name}
                  className="w-full h-full"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: '0 0',
                    width: `${100 / zoom}%`,
                    height: `${100 / zoom}%`,
                  }}
                  onLoad={() => handleIframeLoad(portfolio.id)}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-sm p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {portfolio.name}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Gallery;