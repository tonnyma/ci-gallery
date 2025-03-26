'use client';
import { useState, useEffect } from 'react';

export default function DesignerGallery() {
  const [portfolios, setPortfolios] = useState<
    { id: number; name: string; url: string }[]
  >([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [zoomLevels, setZoomLevels] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    const stored = localStorage.getItem('portfolios');
    if (stored) {
      try {
        setPortfolios(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored portfolios', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('portfolios', JSON.stringify(portfolios));
  }, [portfolios]);

  const addPortfolio = () => {
    if (!url || !name) return;
    setPortfolios((prev) => [
      ...prev,
      { id: Date.now(), name, url }
    ]);
    setName('');
    setUrl('');
  };

  const removePortfolio = (id: number) => {
    setPortfolios((prev) => prev.filter((p) => p.id !== id));
  };

  const columnCount = Math.min(portfolios.length, 4);
  const gridTemplateColumns = `repeat(${columnCount}, minmax(0, 1fr))`;

  return (
    <div className="min-h-screen bg-white p-0">
      <div className="flex flex-col sm:flex-row gap-2 mb-0">
        <input
          type="text"
          placeholder="Designer Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 flex-1"
        />
        <input
          type="text"
          placeholder="Portfolio URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 flex-1"
        />
        <button
          onClick={addPortfolio}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Add
        </button>
      </div>

      <div
        className="grid gap-0 auto-rows-[500px] m-0 p-0"
        style={{ gridTemplateColumns }}
      >
        {portfolios.map((p) => (
          <div
            key={p.id}
            className="relative group w-full h-full overflow-hidden"
          >
            <iframe
              src={p.url}
              title={p.name}
              className="w-full h-full border-none"
              style={{
                transform: `scale(${zoomLevels[p.id] || 1})`,
                transformOrigin: 'top left',
                width: `${100 / (zoomLevels[p.id] || 1)}%`,
                height: `${100 / (zoomLevels[p.id] || 1)}%`
              }}
            />
            <div className="absolute top-2 left-2 flex gap-1">
              <button
                onClick={() =>
                  setZoomLevels((prev) => ({
                    ...prev,
                    [p.id]: (prev[p.id] || 1) + 0.1
                  }))
                }
                className="bg-white text-black text-xs px-2 py-1 rounded hover:bg-gray-200"
              >
                +
              </button>
              <button
                onClick={() =>
                  setZoomLevels((prev) => ({
                    ...prev,
                    [p.id]: Math.max(0.1, (prev[p.id] || 1) - 0.1)
                  }))
                }
                className="bg-white text-black text-xs px-2 py-1 rounded hover:bg-gray-200"
              >
                −
              </button>
            </div>
            <button
              onClick={() => removePortfolio(p.id)}
              className="absolute top-2 right-2 bg-black text-white text-xs rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-500"
            >
              ×
            </button>
            <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 text-white text-sm text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {p.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}