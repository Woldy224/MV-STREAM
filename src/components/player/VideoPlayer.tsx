import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings } from 'lucide-react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  isLive?: boolean;
}

function isIframeCode(s: string) {
  return /<iframe\b[\s\S]*?>[\s\S]*?<\/iframe>/i.test(s);
}

function extractIframeSrc(s: string): string | null {
  const m = s.match(/src\s*=\s*["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function isM3u8(url: string) {
  const u = url.toLowerCase();
  return u.includes('.m3u8');
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, title, isLive = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, resolvedSrc } = useMemo(() => {
    const raw = (src || '').trim();
    if (!raw) return { mode: 'none' as const, resolvedSrc: '' };

    if (isIframeCode(raw)) {
      const iframeSrc = extractIframeSrc(raw);
      return { mode: 'embed' as const, resolvedSrc: iframeSrc || '' };
    }

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      if (isM3u8(raw)) return { mode: 'hls' as const, resolvedSrc: raw };
      // treat common embed pages as iframe sources too
      if (raw.includes('/embed') || raw.includes('embed-')) return { mode: 'embed' as const, resolvedSrc: raw };
      return { mode: 'video' as const, resolvedSrc: raw };
    }

    // relative: could still be m3u8 in uploads
    if (isM3u8(raw)) return { mode: 'hls' as const, resolvedSrc: raw };
    return { mode: 'video' as const, resolvedSrc: raw };
  }, [src]);

  // Setup video or HLS when src changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Cleanup previous HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Reset
    setIsLoading(true);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    video.pause();
    video.removeAttribute('src');
    video.load();

    if (mode !== 'video' && mode !== 'hls') {
      setIsLoading(false);
      return;
    }

    if (mode === 'hls') {
      const u = resolvedSrc;

      // Safari native HLS
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = u;
        return;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({ lowLatencyMode: !!isLive });
        hlsRef.current = hls;
        hls.loadSource(u);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => setIsLoading(false));
        hls.on(Hls.Events.ERROR, (_evt, data) => {
          console.error('HLS error', data);
          if (data?.fatal) setIsLoading(false);
        });

        return () => {
          hls.destroy();
          hlsRef.current = null;
        };
      }

      console.error('HLS not supported by this browser');
      setIsLoading(false);
      return;
    }

    // mode === 'video'
    video.src = resolvedSrc;
  }, [mode, resolvedSrc, isLive]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(isLive ? 0 : (videoRef.current.duration || 0));
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch (e) {
      console.error(e);
      setIsPlaying(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (videoRef.current && !isLive) videoRef.current.currentTime = 0;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current || !duration || isLive) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, pos * duration));
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    videoRef.current.muted = next;
    setIsMuted(next);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (!videoRef.current) return;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    const muted = newVolume === 0;
    setIsMuted(muted);
    videoRef.current.muted = muted;
  };

  const toggleFullscreen = () => {
    const el = playerContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (isPlaying) controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    const el = playerContainerRef.current;
    if (!el) return;
    el.addEventListener('mousemove', handleMouseMove);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const formatTime = (time: number) => {
    if (!isFinite(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progressPct = !isLive && duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div ref={playerContainerRef} className="relative w-full aspect-video bg-black cursor-auto" onDoubleClick={toggleFullscreen}>
      {mode === 'embed' && resolvedSrc ? (
        <div className="absolute inset-0">
          <iframe
            src={resolvedSrc}
            frameBorder={0}
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      ) : (
        <video
          ref={videoRef}
          poster={poster}
          className="w-full h-full object-contain"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onClick={togglePlay}
          playsInline
          controls={false}
        />
      )}

      {isLoading && mode !== 'embed' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {isLive && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-sm font-medium flex items-center">
          <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
          LIVE
        </div>
      )}

      <div
        className={`absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/50 via-transparent to-black/70 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {title && (
          <div className="p-4 flex items-center">
            <h1 className="text-white text-xl font-bold">{title}</h1>
          </div>
        )}

        {mode !== 'embed' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <button
              onClick={togglePlay}
              className="text-white bg-red-600/80 hover:bg-red-600 rounded-full p-4 transition-colors"
              type="button"
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" fill="white" />}
            </button>
          </div>
        )}

        <div className="p-4">
          {!isLive && mode !== 'embed' && (
            <div ref={progressRef} className="w-full h-2 bg-gray-600 rounded cursor-pointer mb-4" onClick={handleSeek}>
              <div className="h-full bg-red-600 rounded relative" style={{ width: `${progressPct}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-red-600 rounded-full"></div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {mode !== 'embed' && (
                <button onClick={togglePlay} className="text-white hover:text-gray-300 transition-colors" type="button">
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" fill="white" />}
                </button>
              )}

              {!isLive && mode !== 'embed' && (
                <>
                  <button
                    onClick={() => videoRef.current && (videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10))}
                    className="text-white hover:text-gray-300 transition-colors"
                    type="button"
                  >
                    <SkipBack className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() =>
                      videoRef.current &&
                      (videoRef.current.currentTime = Math.min(duration || 0, videoRef.current.currentTime + 10))
                    }
                    className="text-white hover:text-gray-300 transition-colors"
                    type="button"
                  >
                    <SkipForward className="h-6 w-6" />
                  </button>
                </>
              )}

              {mode !== 'embed' && (
                <div className="flex items-center space-x-2">
                  <button onClick={toggleMute} className="text-white hover:text-gray-300 transition-colors" type="button">
                    {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 accent-red-600"
                  />
                </div>
              )}

              {!isLive && mode !== 'embed' && (
                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button className="text-white hover:text-gray-300 transition-colors" type="button">
                <Settings className="h-6 w-6" />
              </button>

              <button onClick={toggleFullscreen} className="text-white hover:text-gray-300 transition-colors" type="button">
                {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
