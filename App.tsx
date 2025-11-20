import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { generateVideo, checkApiKeyAvailability, promptForApiKey } from './services/geminiService';
import { VideoState, AspectRatio } from './types';
import { Loader2, Play, AlertCircle, Sparkles, Key } from 'lucide-react';

const LOADING_MESSAGES = [
  "Studying the brushstrokes...",
  "Imagining the movement...",
  "Waking up the subject...",
  "Rendering frames...",
  "Applying artistic filters...",
  "Almost there, polishing the animation..."
];

const DEFAULT_PROMPT = "Cinematic video, the person in the painting slowly waking up, slight movement, stretching, opening eyes, breathing, painting style comes to life, high quality, detailed texture, emotional.";

export default function App() {
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [videoState, setVideoState] = useState<VideoState>({
    isLoading: false,
    progressMessage: '',
    videoUrl: null,
    error: null
  });
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // Animation interval ref
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Initial check for API key
    const checkKey = async () => {
      const ready = await checkApiKeyAvailability();
      setApiKeyReady(ready);
    };
    checkKey();
  }, []);

  useEffect(() => {
    if (videoState.isLoading) {
      intervalRef.current = window.setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 4000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLoadingMsgIndex(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [videoState.isLoading]);

  const handleConnectKey = async () => {
    try {
      await promptForApiKey();
      // Re-check after dialog action (race condition mitigation assumed by checking again or user re-action)
      // We'll optimistically set ready to true to let them try generating, 
      // if it fails with 404, we handle it in generateVideo service.
      setApiKeyReady(true); 
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageSelect = (base64: string, mime: string) => {
    setSelectedImage(base64);
    setMimeType(mime);
    setVideoState(prev => ({ ...prev, videoUrl: null, error: null }));
  };

  const handleClear = () => {
    setSelectedImage(null);
    setMimeType('');
    setVideoState({ isLoading: false, progressMessage: '', videoUrl: null, error: null });
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;

    setVideoState({
      isLoading: true,
      progressMessage: LOADING_MESSAGES[0],
      videoUrl: null,
      error: null
    });

    try {
      // Determine aspect ratio roughly or default to portrait for portraits
      const url = await generateVideo({
        prompt: prompt,
        imageBase64: selectedImage,
        mimeType: mimeType,
        aspectRatio: AspectRatio.PORTRAIT // Defaulting to portrait for art "waking up"
      });

      setVideoState({
        isLoading: false,
        progressMessage: '',
        videoUrl: url,
        error: null
      });
    } catch (err: any) {
      if (err.message === "API_KEY_INVALID") {
        setApiKeyReady(false);
        setVideoState({
          isLoading: false,
          progressMessage: '',
          videoUrl: null,
          error: "API Key access lost or invalid. Please reconnect."
        });
      } else {
        setVideoState({
          isLoading: false,
          progressMessage: '',
          videoUrl: null,
          error: err.message || "An unexpected error occurred during generation."
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-800">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl">
        
        {/* API Key Banner if not ready */}
        {!apiKeyReady && (
          <div className="mb-10 bg-rose-50 border border-rose-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between shadow-sm">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="p-3 bg-white rounded-full text-rose-500 shadow-sm">
                <Key size={24} />
              </div>
              <div>
                <h3 className="font-bold text-stone-900">Requires Google Veo Access</h3>
                <p className="text-sm text-stone-600">Connect your Google AI Studio API key to generate videos.</p>
              </div>
            </div>
            <button 
              onClick={handleConnectKey}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              Connect API Key
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Input */}
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 serif text-stone-900">The Artwork</h2>
              <p className="text-stone-500 mb-6">Upload a classic painting or portrait to begin.</p>
              <ImageUploader 
                onImageSelect={handleImageSelect} 
                selectedImage={selectedImage} 
                onClear={handleClear}
                disabled={videoState.isLoading}
              />
            </div>

            {selectedImage && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
                <label className="block text-sm font-medium text-stone-700 mb-2">Prompt instruction</label>
                <textarea 
                  className="w-full p-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none text-stone-700 resize-none h-28 text-sm leading-relaxed"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={videoState.isLoading}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleGenerate}
                    disabled={!apiKeyReady || videoState.isLoading}
                    className={`
                      px-8 py-3 rounded-lg font-semibold text-white shadow-md transition-all flex items-center gap-2
                      ${!apiKeyReady || videoState.isLoading 
                        ? 'bg-stone-300 cursor-not-allowed' 
                        : 'bg-stone-900 hover:bg-stone-800 hover:shadow-xl transform hover:-translate-y-0.5'}
                    `}
                  >
                    {videoState.isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Awaken Art
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {videoState.error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                <p className="text-sm">{videoState.error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Output */}
          <div className="flex flex-col gap-8 h-full">
             <div>
              <h2 className="text-3xl font-bold mb-2 serif text-stone-900">The Awakening</h2>
              <p className="text-stone-500 mb-6">The generated animation will appear below.</p>
              
              <div className="relative w-full bg-stone-900 rounded-xl overflow-hidden shadow-2xl aspect-[9/16] flex items-center justify-center border-4 border-white ring-1 ring-stone-200">
                
                {!selectedImage && !videoState.videoUrl && !videoState.isLoading && (
                  <div className="text-center p-8 text-stone-500">
                    <div className="w-16 h-16 mx-auto border-2 border-stone-700 rounded-full flex items-center justify-center mb-4 opacity-50">
                      <Play size={32} className="ml-1" />
                    </div>
                    <p className="serif italic text-lg">"Art washes away from the soul the dust of everyday life."</p>
                    <p className="text-xs mt-2 uppercase tracking-widest opacity-60">- Pablo Picasso</p>
                  </div>
                )}

                {videoState.isLoading && (
                  <div className="absolute inset-0 bg-stone-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <p className="mt-6 text-lg font-light tracking-wide animate-pulse">{LOADING_MESSAGES[loadingMsgIndex]}</p>
                    <p className="mt-2 text-xs text-stone-400">This may take a minute or two</p>
                  </div>
                )}

                {videoState.videoUrl && !videoState.isLoading && (
                  <video 
                    src={videoState.videoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    className="w-full h-full object-cover"
                  />
                )}
                
              </div>
              
              {videoState.videoUrl && (
                <div className="mt-4 flex justify-center">
                  <a 
                    href={videoState.videoUrl} 
                    download="masterpiece-awakened.mp4"
                    className="text-stone-500 hover:text-stone-900 text-sm font-medium underline underline-offset-4 transition-colors"
                  >
                    Download Video
                  </a>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      
      <footer className="py-8 text-center text-stone-400 text-sm border-t border-stone-200 mt-12 bg-white">
        <p>© {new Date().getFullYear()} Masterpiece Motion. Built with Google Veo & Gemini.</p>
      </footer>
    </div>
  );
}