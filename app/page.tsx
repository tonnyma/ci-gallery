"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
  const [showToastMessage, setShowToastMessage] = useState<string | null>(null); // Updated state variable
  const [showErrorToast, setShowErrorToast] = useState<string | false>(false); // Updated state variable

  useEffect(() => {
    console.log("Toast message:", showErrorToast);
  }, [showErrorToast]);

  // Fetch portfolios from Supabase
  const fetchPortfolios = async () => {
    const { data } = await supabase.from('portfolios').select('*');
    if (data) {
      setPortfolios(data);
    }
  };

  // Fetch portfolios by default unless admin view is explicitly requested
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') !== 'true') {
      fetchPortfolios(); // Allow fetch even if not logged in
    } else if (loggedIn) {
      fetchPortfolios();
    }
  }, [loggedIn]);

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
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoggedIn(true);
      setShowLoginForm(false);
      triggerSuccessToast('Logged in successfully!');
    } catch (err: unknown) { // Updated type casting
      // Optionally log the error or remove entirely if not needed
      console.error(err);
      triggerErrorToast('Incorrect email or password.');
    }
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

  return (
    <>
      {showLoginForm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center backdrop-blur-sm bg-black/10">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-80">
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
                className="border border-gray-300 px-3 py-2 rounded"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border border-gray-300 px-3 py-2 rounded"
              />
              <div className="flex justify-between gap-2">
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-2 rounded w-full"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginForm(false)}
                  className="bg-gray-300 text-black px-4 py-2 rounded w-full"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="w-full bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center fixed top-0 left-0 right-0 z-50">
        <h1 className="text-xl font-semibold">Design Gallery</h1>
        {loggedIn ? (
          <button
            className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
            onClick={() => {
              setLoggedIn(false);
              triggerSuccessToast('Logged out successfully!');
            }}
          >
            Logout
          </button>
        ) : (
          <button
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-900"
            onClick={() => setShowLoginForm(true)}
          >
            Login
          </button>
        )}
      </div>
      {renderToastMessages()}
      <div className="h-16" /> {/* Spacer to offset fixed header */}
      <>
        {loggedIn && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/80 backdrop-blur-lg px-6 py-4 rounded-xl shadow-lg w-full max-w-4xl">
            <form onSubmit={handleAddPortfolio} className="flex gap-2 items-end">
              <div className="relative w-1/3">
                <input
                  type="text"
                  id="designer-name"
                  placeholder=" "
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="peer w-full border border-gray-300 px-3 pt-5 pb-2 rounded-lg placeholder-transparent focus:outline-none focus:border-black"
                />
                <label
                  htmlFor="designer-name"
                  className="absolute left-3 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-500"
                >
                  Designer Name
                </label>
              </div>

              <div className="relative flex-grow">
                <input
                  type="url"
                  id="portfolio-url"
                  placeholder=" "
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="peer w-full border border-gray-300 px-3 pt-5 pb-2 rounded-lg placeholder-transparent focus:outline-none focus:border-black"
                />
                <label
                  htmlFor="portfolio-url"
                  className="absolute left-3 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-500"
                >
                  Portfolio URL
                </label>
              </div>

              <button
                type="submit"
                className="bg-black text-white px-5 py-3 rounded-lg hover:bg-gray-900 transition-all"
              >
                Add
              </button>
            </form>
          </div>
        )}
      </>
      <div>
        <div className="portfolio-grid grid sm:grid-cols-3 auto-rows-[100vh] snap-y snap-mandatory overflow-y-auto w-full">
          {portfolios.map((portfolio) => {
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
              className="portfolio-item snap-start relative bg-white overflow-hidden shadow flex flex-col group transition-transform duration-200 hover:scale-[1.05]"
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
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-sm p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {portfolio.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Gallery;