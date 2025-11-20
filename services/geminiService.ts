import { GoogleGenAI } from "@google/genai";
import { GenerateOptions } from '../types';

// Helper to check for API key availability in the specific AI Studio environment
export const checkApiKeyAvailability = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return false;
};

// Helper to open the key selection dialog
export const promptForApiKey = async (): Promise<void> => {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  } else {
    throw new Error("AI Studio environment not detected. Please ensure you are running in the correct environment.");
  }
};

export const generateVideo = async (options: GenerateOptions): Promise<string> => {
  // 1. Verify Key
  const hasKey = await checkApiKeyAvailability();
  if (!hasKey) {
    throw new Error("API Key not selected. Please select an API Key to proceed.");
  }

  // 2. Initialize Client
  // Note: process.env.API_KEY is injected by the environment after selection
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // 3. Start Generation
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: options.prompt,
      image: {
        imageBytes: options.imageBase64,
        mimeType: options.mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: options.aspectRatio,
      }
    });

    // 4. Poll for completion
    while (!operation.done) {
      // Wait 5 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    // 5. Get Download Link
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation failed: No URI returned.");
    }

    // 6. Fetch the video blob securely (appending key manually as per docs)
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);

  } catch (error: any) {
    console.error("Video generation error:", error);
    // Detect the "Requested entity was not found" error which often means the key needs re-selection or is invalid
    if (error.message && error.message.includes("Requested entity was not found")) {
        // We can throw a specific error code/message that the UI can use to prompt re-selection
        throw new Error("API_KEY_INVALID"); 
    }
    throw error;
  }
};