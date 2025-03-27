"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';


const Gallery = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState(''); // State for email
  const [password, setPassword] = useState(''); // State for password
  const [loggedIn, setLoggedIn] = useState(false); // State for login status

  const fetchPortfolios = async () => {
    const { data, error } = await supabase.from('portfolios').select('*');
    if (error) {
      console.error(error);
    } else {
      setPortfolios(data);
    }
  };

  useEffect(() => {
    if (loggedIn) fetchPortfolios();
  }, [loggedIn]);

  const handleLogin = async (e) => { // Function to handle login
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
    } else {
      setLoggedIn(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('portfolios')
      .insert([{ name, url }])
      .select()
      .single();

    if (error) {
      console.error(error);
    } else {
      setPortfolios([...portfolios, data]);
      setName('');
      setUrl('');
    }
  };

  return (
    <>
      {!loggedIn ? (
        <div className="flex items-center justify-center h-screen">
          <form onSubmit={handleLogin} className="flex flex-col gap-4 w-80">
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
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded"
            >
              Login
            </button>
          </form>
        </div>
      ) : (
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 items-center mb-4">
              <input
                type="text"
                placeholder="Designer Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-gray-300 px-2 py-1 rounded w-1/4"
                required
              />
              <input
                type="url"
                placeholder="Portfolio URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="border border-gray-300 px-2 py-1 rounded w-1/2"
                required
              />
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 rounded"
              >
                Add
              </button>
            </div>
          </form>
          <div className="portfolio-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className="portfolio-item relative min-w-[300px] bg-white rounded overflow-hidden shadow flex flex-col"
              >
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const { error } = await supabase.from('portfolios').delete().eq('id', portfolio.id);
                      if (!error) {
                        setPortfolios(prev => prev.filter(p => p.id !== portfolio.id));
                      } else {
                        console.error('Error deleting portfolio:', error);
                      }
                    }}
                    className="bg-black text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                  <button
                    onClick={() => {
                      const iframe = document.getElementById(`iframe-${portfolio.id}`);
                      if (iframe) iframe.style.transform = 'scale(1.1)';
                    }}
                    className="bg-gray-200 text-black rounded-full w-6 h-6 text-xs flex items-center justify-center"
                  >
                    +
                  </button>
                  <button
                    onClick={() => {
                      const iframe = document.getElementById(`iframe-${portfolio.id}`);
                      if (iframe) iframe.style.transform = 'scale(0.9)';
                    }}
                    className="bg-gray-200 text-black rounded-full w-6 h-6 text-xs flex items-center justify-center"
                  >
                    -
                  </button>
                </div>
                <div className="overflow-auto h-[300px]">
                  <iframe
                    id={`iframe-${portfolio.id}`}
                    src={portfolio.url}
                    title={portfolio.name}
                    className="w-full h-full transition-transform duration-300"
                  />
                </div>
                <div className="bg-black text-white text-sm p-2 text-center">
                  {portfolio.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;