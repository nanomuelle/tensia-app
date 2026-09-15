import { useState, useCallback } from 'react';
import { BloodPressureReading, compressImage, analyzeBloodPressureImage } from '../services/geminiService';
import { getGeminiApiKey } from '../services/settingsService';

export function useGeminiAI() {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handlePhotoAndListClick = useCallback(async (onRequireApiKey?: () => void) => {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      if (onRequireApiKey) {
        onRequireApiKey();
      }
      return;
    }
    const privacyAccepted = localStorage.getItem('tensia_privacy_accepted');
    if (!privacyAccepted) {
      setIsPrivacyModalOpen(true);
      return;
    }
    setIsPhotoModalOpen(true);
  }, []);

  const handlePrivacyAccepted = useCallback(() => {
    localStorage.setItem('tensia_privacy_accepted', 'true');
    setIsPrivacyModalOpen(false);
    setIsPhotoModalOpen(true);
  }, []);

  const handleImageSelected = useCallback(
    async (
      fileOrBlob: File | Blob,
      options: {
        onResult: (result: BloodPressureReading) => void;
        onRequireApiKey?: () => void;
        onError?: (errorMsg: string) => void;
      }
    ) => {
      setIsAnalyzingPhoto(true);
      setAnalysisError(null);
      try {
        const apiKey = await getGeminiApiKey();
        if (!apiKey) {
          if (options.onRequireApiKey) {
            options.onRequireApiKey();
          }
          setIsAnalyzingPhoto(false);
          return;
        }
        const compressedBase64 = await compressImage(fileOrBlob);
        const result = await analyzeBloodPressureImage(apiKey, compressedBase64);
        options.onResult(result);
      } catch (err: any) {
        const message = err.message || 'Error al analizar la imagen con Gemini.';
        setAnalysisError(message);
        if (options.onError) {
          options.onError(message);
        }
      } finally {
        setIsAnalyzingPhoto(false);
      }
    },
    []
  );

  const closePrivacyModal = useCallback(() => {
    setIsPrivacyModalOpen(false);
  }, []);

  const closePhotoModal = useCallback(() => {
    setIsPhotoModalOpen(false);
  }, []);

  return {
    isPrivacyModalOpen,
    setIsPrivacyModalOpen,
    isPhotoModalOpen,
    setIsPhotoModalOpen,
    isAnalyzingPhoto,
    analysisError,
    setAnalysisError,
    handlePhotoAndListClick,
    handlePrivacyAccepted,
    handleImageSelected,
    closePrivacyModal,
    closePhotoModal,
  };
}

export default useGeminiAI;
