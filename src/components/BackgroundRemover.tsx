"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { removeBackground, preload } from "@imgly/background-removal";

// Add custom text-2xs utility class that's smaller than text-xs
const textSizeStyle = `
  .text-2xs {
    font-size: 0.65rem;
    line-height: 1rem;
  }
`;

// Interface for batch image processing
interface BatchImage {
  id: string;
  originalImage: string;
  processedImage: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  processingTime?: number;
  metrics?: {
    modelLoading: number | null;
    processing: number | null;
    total: number | null;
  };
}

interface BatchImage {
  id: string;
  originalImage: string;
  processedImage: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  processingTime?: number;
  metrics?: {
    modelLoading: number | null;
    processing: number | null;
    total: number | null;
  };
}

export default function BackgroundRemover() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [subjectScale, setSubjectScale] = useState<number>(1.0);
  const [selectedModel, setSelectedModel] = useState<"isnet" | "isnet_fp16" | "isnet_quint8">("isnet");
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [outputQuality, setOutputQuality] = useState<number>(1.0);
  const [backgroundColor, setBackgroundColor] = useState<string>("#00000000");
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    modelLoading: number | null,
    processing: number | null,
    total: number | null
  }>({
    modelLoading: null,
    processing: null,
    total: null
  });
  const [previousMetrics, setPreviousMetrics] = useState<{
    model: string,
    time: number,
    scale: number
  }[]>([]);
  // New states for batch processing
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [batchImages, setBatchImages] = useState<BatchImage[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number>(-1);
  const [showBatchSummary, setShowBatchSummary] = useState<boolean>(false);
  
  const timerRef = useRef<number | null>(null);
  const modelLoadingTimeRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const multipleFilesInputRef = useRef<HTMLInputElement | null>(null);
  
  // Effect for updating the elapsed time during processing
  useEffect(() => {
    if (isProcessing && processingStartTime) {
      // Start a timer that updates the elapsed time every 100ms
      const timerId = window.setInterval(() => {
        const current = performance.now();
        setElapsedTime(current - processingStartTime);
      }, 100);
      
      timerRef.current = timerId;
      
      return () => {
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    } else {
      setElapsedTime(null);
    }
  }, [isProcessing, processingStartTime]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setProcessedImage(null);
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Please upload a valid image file (JPEG or PNG)');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size exceeds 10MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setOriginalImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = async () => {
    if (!originalImage) return;

    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setError(null);
      setProcessingTime(null);
      // Record the start time
      const startTime = performance.now();
      setProcessingStartTime(startTime);
      
      // Configure options for background removal
      const config = {
        // Track progress during processing
        progress: (key: string, current: number, total: number) => {
          // Check if the key indicates model loading
          if (key.includes('model') || key.includes('fetch')) {
            if (!isModelLoading) {
              modelLoadingTimeRef.current = performance.now();
            }
            setIsModelLoading(true);
          } else if (isModelLoading) {
            // Just finished loading model
            const modelLoadTime = performance.now() - (modelLoadingTimeRef.current || processingStartTime || 0);
            setPerformanceMetrics(prev => ({
              ...prev,
              modelLoading: modelLoadTime
            }));
            setIsModelLoading(false);
          }
          
          const progress = current / total;
          setProcessingProgress(Math.round(progress * 100));
          console.log(`Processing ${key}: ${Math.round(progress * 100)}%`);
        },
        // Apply output format settings
        output: {
          format: 'image/png' as const,
          quality: outputQuality,
        },
        // Set model type based on user selection
        model: selectedModel,
        // Enable rescaling if the subject scale is not at default value (1.0)
        rescale: subjectScale !== 1.0,
        // Set debug mode for development - disable in production
        debug: process.env.NODE_ENV === 'development'
      };
      
      // Process the image to remove background
      const result = await removeBackground(originalImage, config);
      
      // Convert Blob to Data URL
      const url = URL.createObjectURL(result);
      setProcessedImage(url);
      
      // Calculate the processing time
      if (processingStartTime) {
        const endTime = performance.now();
        const totalElapsed = endTime - processingStartTime;
        setProcessingTime(totalElapsed);
        
        // Calculate processing time (total minus model loading time)
        const modelLoadingTime = performanceMetrics.modelLoading || 0;
        const processingTime = totalElapsed - modelLoadingTime;
        
        // Update performance metrics
        setPerformanceMetrics({
          modelLoading: modelLoadingTime,
          processing: processingTime,
          total: totalElapsed
        });
        
        // Save this result for comparison
        setPreviousMetrics(prev => {
          // Keep only the last 5 results
          const newMetrics = [...prev];
          if (newMetrics.length >= 5) {
            newMetrics.shift(); // Remove the oldest result
          }
          
          // Add the new result
          newMetrics.push({
            model: selectedModel,
            time: totalElapsed,
            scale: subjectScale
          });
          
          return newMetrics;
        });
      }
    } catch (err: any) {
      console.error('Error removing background:', err);
      let errorMessage = 'Failed to remove background. Please try another image.';
      
      // Provide more specific error messages based on common issues
      if (err.message && err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message && err.message.includes('memory')) {
        errorMessage = 'Not enough memory to process this image. Try a smaller image or a different model.';
      } else if (err.message) {
        // Include part of the actual error message for better debugging
        errorMessage = `Error: ${err.message.substring(0, 100)}${err.message.length > 100 ? '...' : ''}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setIsModelLoading(false);
      setProcessingProgress(0);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'background-removed.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    setProcessingProgress(0);
    setBackgroundColor("#00000000");
    setProcessingTime(null);
    setProcessingStartTime(null);
    setElapsedTime(null);
    setPerformanceMetrics({
      modelLoading: null,
      processing: null,
      total: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Helper function to format processing time
  const formatProcessingTime = (ms: number): string => {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else {
      return `${(ms / 1000).toFixed(2)}s`;
    }
  };

  const handlePreloadModel = async () => {
    try {
      setIsModelLoading(true);
      setError(null);
      
      await preload({
        model: selectedModel,
        progress: (key: string, current: number, total: number) => {
          const progress = current / total;
          setProcessingProgress(Math.round(progress * 100));
          console.log(`Preloading ${key}: ${Math.round(progress * 100)}%`);
        }
      });
      
      setError("Model preloaded successfully! Ready to process images.");
    } catch (err: any) {
      console.error('Error preloading model:', err);
      setError('Failed to preload model: ' + (err.message || 'Unknown error'));
    } finally {
      setIsModelLoading(false);
      setProcessingProgress(0);
    }
  };

  // Tooltip component for showing helpful information
  const Tooltip = ({ text }: { text: string }) => {
    return (
      <div className="absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm -mt-10 -ml-24 w-48">
        {text}
        <div className="absolute w-2 h-2 bg-gray-900 rotate-45 -bottom-1 left-1/2 transform -translate-x-1/2"></div>
      </div>
    );
  };

  // New function to handle batch image upload
  const handleBatchImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setProcessedImage(null);
    
    const files = e.target.files;
    if (!files) return;

    // Reset batch state
    setBatchImages([]);
    setCurrentBatchIndex(-1);
    setShowBatchSummary(false);

    Array.from(files).forEach((file, index) => {
      // Check file type
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        setError('Please upload valid image files (JPEG or PNG)');
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('One or more images exceed the 10MB size limit');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          // Add each image to the batch list
          setBatchImages(prev => [
            ...prev,
            {
              id: `${index}-${Date.now()}`, // Unique ID for each image
              originalImage: event.target?.result as string,
              processedImage: null,
              status: 'pending'
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // New function to process the next image in the batch
  const processNextInBatch = async () => {
    if (currentBatchIndex >= batchImages.length - 1) {
      // No more images to process
      setIsProcessing(false);
      setShowBatchSummary(true);
      return;
    }

    const nextIndex = currentBatchIndex + 1;
    setCurrentBatchIndex(nextIndex);

    const imageToProcess = batchImages[nextIndex];
    if (!imageToProcess) return;

    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setError(null);
      setProcessingTime(null);
      // Record the start time
      const startTime = performance.now();
      setProcessingStartTime(startTime);
      
      // Configure options for background removal
      const config = {
        // Track progress during processing
        progress: (key: string, current: number, total: number) => {
          // Check if the key indicates model loading
          if (key.includes('model') || key.includes('fetch')) {
            if (!isModelLoading) {
              modelLoadingTimeRef.current = performance.now();
            }
            setIsModelLoading(true);
          } else if (isModelLoading) {
            // Just finished loading model
            const modelLoadTime = performance.now() - (modelLoadingTimeRef.current || processingStartTime || 0);
            setPerformanceMetrics(prev => ({
              ...prev,
              modelLoading: modelLoadTime
            }));
            setIsModelLoading(false);
          }
          
          const progress = current / total;
          setProcessingProgress(Math.round(progress * 100));
          console.log(`Processing ${key}: ${Math.round(progress * 100)}%`);
        },
        // Apply output format settings
        output: {
          format: 'image/png' as const,
          quality: outputQuality,
        },
        // Set model type based on user selection
        model: selectedModel,
        // Enable rescaling if the subject scale is not at default value (1.0)
        rescale: subjectScale !== 1.0,
        // Set debug mode for development - disable in production
        debug: process.env.NODE_ENV === 'development'
      };
      
      // Process the image to remove background
      const result = await removeBackground(imageToProcess.originalImage, config);
      
      // Convert Blob to Data URL
      const url = URL.createObjectURL(result);
      
      // Update the processed image in the batch
      setBatchImages(prev => {
        const newBatch = [...prev];
        const imageIndex = newBatch.findIndex(img => img.id === imageToProcess.id);
        if (imageIndex !== -1) {
          newBatch[imageIndex] = {
            ...newBatch[imageIndex],
            processedImage: url,
            status: 'completed'
          };
        }
        return newBatch;
      });
      
      // Calculate the processing time
      if (processingStartTime) {
        const endTime = performance.now();
        const totalElapsed = endTime - processingStartTime;
        setProcessingTime(totalElapsed);
        
        // Calculate processing time (total minus model loading time)
        const modelLoadingTime = performanceMetrics.modelLoading || 0;
        const processingTime = totalElapsed - modelLoadingTime;
        
        // Update performance metrics
        setPerformanceMetrics({
          modelLoading: modelLoadingTime,
          processing: processingTime,
          total: totalElapsed
        });
        
        // Save this result for comparison
        setPreviousMetrics(prev => {
          // Keep only the last 5 results
          const newMetrics = [...prev];
          if (newMetrics.length >= 5) {
            newMetrics.shift(); // Remove the oldest result
          }
          
          // Add the new result
          newMetrics.push({
            model: selectedModel,
            time: totalElapsed,
            scale: subjectScale
          });
          
          return newMetrics;
        });
      }
    } catch (err: any) {
      console.error('Error removing background:', err);
      let errorMessage = 'Failed to remove background. Please try another image.';
      
      // Provide more specific error messages based on common issues
      if (err.message && err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message && err.message.includes('memory')) {
        errorMessage = 'Not enough memory to process this image. Try a smaller image or a different model.';
      } else if (err.message) {
        // Include part of the actual error message for better debugging
        errorMessage = `Error: ${err.message.substring(0, 100)}${err.message.length > 100 ? '...' : ''}`;
      }
      
      // Update the batch with the error
      setBatchImages(prev => {
        const newBatch = [...prev];
        const imageIndex = newBatch.findIndex(img => img.id === imageToProcess.id);
        if (imageIndex !== -1) {
          newBatch[imageIndex] = {
            ...newBatch[imageIndex],
            status: 'error',
            error: errorMessage
          };
        }
        return newBatch;
      });
    } finally {
      setIsProcessing(false);
      setIsModelLoading(false);
      setProcessingProgress(0);
    }
  };

  const handleBatchProcess = async () => {
    if (batchImages.length === 0) return;

    setCurrentBatchIndex(0);
    setShowBatchSummary(false);

    // Process each image in the batch sequentially
    for (let i = 0; i < batchImages.length; i++) {
      setCurrentBatchIndex(i);
      await new Promise(resolve => {
        // Process each image with a slight delay to prevent blocking
        setTimeout(() => {
          resolve(processNextInBatch());
        }, 100);
      });
    }
  };

  const handleCancelBatch = () => {
    setIsProcessing(false);
    setCurrentBatchIndex(-1);
    setShowBatchSummary(false);
    setBatchImages(prev => prev.map(img => ({ ...img, status: 'pending' })));
  };

  return (
    <>
      {/* Inject custom styles */}
      <style>{textSizeStyle}</style>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {!originalImage ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.add('border-blue-500');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove('border-blue-500');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove('border-blue-500');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
              const file = files[0];
              
              // Check file type
              if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
                setError('Please upload a valid image file (JPEG or PNG)');
                return;
              }
              
              // Check file size (max 10MB)
              if (file.size > 10 * 1024 * 1024) {
                setError('Image size exceeds 10MB limit');
                return;
              }
              
              const reader = new FileReader();
              reader.onload = (event) => {
                if (event.target?.result) {
                  setOriginalImage(event.target.result as string);
                }
              };
              reader.readAsDataURL(file);
            }
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleImageUpload} 
          />
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-gray-700">Click to upload an image</p>
            <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
            <p className="text-xs text-gray-400 mt-2">PNG, JPG up to 10MB</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Original Image</h3>
              <div className="bg-gray-100 rounded-lg p-2 h-60 flex items-center justify-center overflow-hidden">
                <img 
                  src={originalImage} 
                  alt="Original" 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Processed Image</h3>
              <div 
                className="bg-gray-100 rounded-lg p-2 h-60 flex items-center justify-center overflow-hidden"
                style={{ 
                  backgroundImage: 'repeating-linear-gradient(45deg, #f0f0f0 0px, #f0f0f0 5px, #fafafa 5px, #fafafa 10px)',
                  backgroundSize: '20px 20px'
                }}
              >                {isProcessing ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="font-medium text-blue-600">Processing: {processingProgress}%</p>
                    <div className="w-full max-w-xs h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300 ease-in-out" 
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {processingProgress === 0 && "Initializing..."}
                      {isModelLoading && "Downloading and setting up the model..."}
                      {!isModelLoading && processingProgress > 0 && processingProgress < 50 && "Analyzing image..."}
                      {!isModelLoading && processingProgress >= 50 && processingProgress < 90 && "Processing image details..."}
                      {!isModelLoading && processingProgress >= 90 && processingProgress < 100 && "Finalizing..."}
                    </p>
                    
                    {elapsedTime !== null && (
                      <div className="flex items-center mt-1 text-xs text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          Time elapsed: {formatProcessingTime(elapsedTime)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : processedImage ? (
                  <div className="relative flex flex-col h-full w-full">
                    <div 
                      style={{ 
                        backgroundColor: backgroundColor,
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img 
                        src={processedImage}
                        alt="Background Removed" 
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    
                    {processingTime && (
                      <div 
                        className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-80 text-white text-xs px-3 py-2 rounded-md max-w-xs"
                        style={{ backdropFilter: 'blur(4px)' }}
                      >
                        <div className="flex items-center font-semibold border-b border-gray-600 pb-1 mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>
                            Processed in <strong>{formatProcessingTime(processingTime)}</strong>
                          </span>
                        </div>
                        
                        {/* Performance breakdown */}
                        {performanceMetrics.modelLoading !== null && (
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-2xs">
                            <div className="text-gray-300">Model loading:</div>
                            <div className="text-right">{formatProcessingTime(performanceMetrics.modelLoading)}</div>
                            
                            <div className="text-gray-300">Image processing:</div>
                            <div className="text-right">{formatProcessingTime(performanceMetrics.processing || 0)}</div>
                            
                            <div className="font-medium text-gray-100 border-t border-gray-600 mt-1 pt-1">Total:</div>
                            <div className="text-right font-medium text-gray-100 border-t border-gray-600 mt-1 pt-1">
                              {formatProcessingTime(performanceMetrics.total || 0)}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-2xs mt-2 opacity-90">
                          Model: <span className="font-medium">{selectedModel}</span> • Scale: <span className="font-medium">{subjectScale}</span>
                        </div>
                        
                        {/* Previous results comparison */}
                        {previousMetrics.length > 1 && (
                          <button 
                            className="mt-2 text-blue-300 text-2xs flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTooltip(showTooltip === 'performance-history' ? null : 'performance-history');
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Compare with previous runs
                          </button>
                        )}
                        
                        {/* Performance history popup */}
                        {showTooltip === 'performance-history' && previousMetrics.length > 0 && (
                          <div className="absolute right-0 bottom-full mb-2 bg-gray-800 p-2 rounded-md shadow-xl w-56">
                            <h4 className="font-medium text-center border-b border-gray-700 pb-1 mb-2">Performance History</h4>
                            <table className="w-full text-2xs">
                              <thead>
                                <tr className="border-b border-gray-700">
                                  <th className="text-left pb-1">Model</th>
                                  <th className="text-left pb-1">Scale</th>
                                  <th className="text-right pb-1">Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                {previousMetrics.map((metric, idx) => (
                                  <tr key={idx} className={idx === previousMetrics.length - 1 ? "text-blue-300" : ""}>
                                    <td className="py-1">{metric.model.replace('isnet_', '')}</td>
                                    <td>{metric.scale}</td>
                                    <td className="text-right">{formatProcessingTime(metric.time)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <p className="font-medium">Ready to process</p>
                    <p className="text-xs mt-1">Click "Remove Background" to begin</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {error && (
            <div className={`text-center p-3 ${error.includes('successfully') ? 'bg-green-50' : 'bg-red-50'} rounded-md flex items-center justify-center space-x-2`}>
              {error.includes('successfully') ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`${error.includes('successfully') ? 'text-green-600' : 'text-red-600'} font-medium text-sm`}>
                {error}
              </span>
            </div>
          )}
          
          {!processedImage && !isProcessing && originalImage && (
            <div className="mb-4 px-4 space-y-4">
              {/* Model Selection */}
              <div className="mb-3">
                <label htmlFor="modelSelect" className="block text-sm font-medium text-gray-700 mb-1">
                  Processing Model
                </label>
                <select
                  id="modelSelect"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as "isnet" | "isnet_fp16" | "isnet_quint8")}
                  className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={isProcessing}
                >
                  <option value="isnet">High Quality (isnet)</option>
                  <option value="isnet_fp16">Balanced (isnet_fp16)</option>
                  <option value="isnet_quint8">Fast (isnet_quint8)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  High Quality (larger download), Balanced (default), or Fast (smaller, less accurate)
                </p>
                <div className="mt-2">
                  <button
                    onClick={handlePreloadModel}
                    disabled={isModelLoading || isProcessing}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    {isModelLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Preloading... {processingProgress}%
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Preload Model
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Subject Scale Control */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="subjectScale" className="block text-sm font-medium text-gray-700">
                    Subject Scale: {subjectScale.toFixed(1)}
                  </label>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">Rescale:</span>
                    <div 
                      className={`w-10 h-5 flex items-center ${subjectScale !== 1.0 ? 'bg-blue-600' : 'bg-gray-200'} rounded-full p-1 cursor-pointer`}
                      onClick={() => setSubjectScale(subjectScale === 1.0 ? 1.1 : 1.0)}
                      onMouseEnter={() => setShowTooltip('rescale')}
                      onMouseLeave={() => setShowTooltip(null)}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                          subjectScale !== 1.0 ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      ></div>
                    </div>
                    {showTooltip === 'rescale' && (
                      <Tooltip text="Enable rescaling to adjust how the image is processed" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">0.5</span>
                  <input
                    type="range"
                    id="subjectScale"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={subjectScale}
                    onChange={(e) => setSubjectScale(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={isProcessing || subjectScale === 1.0}
                  />
                  <span className="text-xs text-gray-500">1.5</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enable rescaling to adjust the processing of the image. When disabled (scale = 1.0), the default library behavior is used.
                </p>
              </div>
              
              {/* Output Quality Control */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="outputQuality" className="block text-sm font-medium text-gray-700">
                    Output Quality: {outputQuality.toFixed(1)}
                  </label>
                  <div className="relative">
                    <div 
                      className="cursor-pointer"
                      onMouseEnter={() => setShowTooltip('quality')}
                      onMouseLeave={() => setShowTooltip(null)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {showTooltip === 'quality' && (
                      <Tooltip text="Higher quality results in larger file sizes" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">0.5</span>
                  <input
                    type="range"
                    id="outputQuality"
                    min="0.5"
                    max="1.0"
                    step="0.1"
                    value={outputQuality}
                    onChange={(e) => setOutputQuality(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={isProcessing}
                  />
                  <span className="text-xs text-gray-500">1.0</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Adjust the quality of the output image. Higher values provide better quality but larger file sizes.
                </p>
              </div>
              
              {/* Background Color Picker (only visible if there's a processed image) */}
              {processedImage && (
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700">
                      Background Color
                    </label>
                    <div className="relative">
                      <div 
                        className="cursor-pointer"
                        onMouseEnter={() => setShowTooltip('bgcolor')}
                        onMouseLeave={() => setShowTooltip(null)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      {showTooltip === 'bgcolor' && (
                        <Tooltip text="Change the background color for preview only (the downloaded image will have a transparent background)" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <input
                      type="color"
                      id="backgroundColor"
                      value={backgroundColor.substring(0, 7)}
                      onChange={(e) => setBackgroundColor(e.target.value + (backgroundColor.length > 7 ? backgroundColor.substring(7) : ''))}
                      className="h-10 w-10 border-0 rounded cursor-pointer"
                      disabled={isProcessing}
                    />
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Transparency</label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        step="1"
                        value={parseInt(backgroundColor.substring(7) || "00", 16)}
                        onChange={(e) => {
                          const alpha = parseInt(e.target.value).toString(16).padStart(2, '0');
                          setBackgroundColor(backgroundColor.substring(0, 7) + alpha);
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Preview with different background colors. The downloaded image will always have a transparent background.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            {!processedImage && !isProcessing && (
              <button
                onClick={handleRemoveBackground}
                className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                disabled={isProcessing}
              >
                Remove Background
              </button>
            )}
            
            {processedImage && (
              <button
                onClick={handleDownload}
                className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Download Image
              </button>
            )}
            
            <button
              onClick={resetAll}
              className="px-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            >
              {processedImage ? 'Try Another Image' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
      
      {/* Batch processing UI */}
      {batchMode && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Batch Processing</h3>
          
          {/* Batch image previews */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {batchImages.map((image, idx) => (
              <div key={image.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-100 p-2">
                  <span className="text-xs font-medium text-gray-500">{`Image ${idx + 1}`}</span>
                </div>
                <div className="h-32 flex items-center justify-center overflow-hidden">
                  {image.status === 'processing' ? (
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  ) : image.processedImage ? (
                    <img 
                      src={image.processedImage}
                      alt={`Processed ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <p className="text-sm">Waiting for processing...</p>
                    </div>
                  )}
                </div>
                
                {/* Batch image status and error message */}
                <div className="p-2 text-xs">
                  {image.status === 'processing' && (
                    <p className="text-blue-600">Processing...</p>
                  )}
                  {image.status === 'completed' && (
                    <p className="text-green-600">Processed successfully!</p>
                  )}
                  {image.status === 'error' && image.error && (
                    <p className="text-red-600">{image.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Batch actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleBatchProcess}
              className="flex-1 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              disabled={isProcessing || batchImages.length === 0}
            >
              {isProcessing ? 'Processing...' : 'Process All Images'}
            </button>
            
            <button
              onClick={handleCancelBatch}
              className="flex-1 px-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            >
              Cancel Batch
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
