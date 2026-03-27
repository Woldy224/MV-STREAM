import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { ContentAPI } from '../utils/api';
import { toContentItem } from '../utils/mapper';
import { ContentItem } from '../types/content';

const LiveTvPage = () => {
  const [channels, setChannels] = useState<ContentItem[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ContentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await ContentAPI.list('live');
        const items = (res.items || []).map(toContentItem);
        setChannels(items);
        setSelectedChannel(items[0] || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => c.category && set.add(c.category));
    return ['All', ...Array.from(set)];
  }, [channels]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return channels.filter((c) => {
      const matchesSearch = !q || c.title.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [channels, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-black pt-24 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              {selectedChannel?.videoUrl ? (
                <VideoPlayer src={selectedChannel.videoUrl} poster={selectedChannel.backdropUrl} title={selectedChannel.title} isLive />
              ) : (
                <div className="aspect-video flex items-center justify-center text-gray-300">
                  {loading ? 'Loading…' : 'No live channel selected'}
                </div>
              )}
            </div>

            {selectedChannel && (
              <div className="mt-4">
                <h1 className="text-2xl font-bold">{selectedChannel.title}</h1>
                <p className="text-gray-300 mt-1">{selectedChannel.description}</p>
              </div>
            )}
          </div>

          {/* Channel list */}
          <div className="rounded-2xl border border-white/10 bg-[#121217] p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search channels…"
                  className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-3 py-2 outline-none"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white/10 border border-white/10 rounded-lg pl-10 pr-8 py-2 outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                ))
              ) : filtered.length === 0 ? (
                <div className="text-gray-300">No channels found.</div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChannel(c)}
                    className={`w-full text-left flex items-center gap-3 p-2 rounded-xl border transition ${
                      selectedChannel?.id === c.id
                        ? 'border-[#e50914] bg-white/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <img
                      src={c.posterUrl}
                      alt={c.title}
                      className="w-20 h-12 object-cover rounded-lg"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{c.title}</div>
                      <div className="text-xs text-gray-300 truncate">{c.category || 'Live'}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTvPage;
