'use client';

import React, { useState, useEffect, FormEvent, ChangeEvent, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import Input from '../ui/Input';
import Button from '../ui/Button';
import ErrorMessage from '../feedback/ErrorMessage';
import LoadingSpinner from '../ui/LoadingSpinner';

// Utility function to throttle API requests during high traffic
const throttle = (func: Function, delay: number) => {
  let lastCall = 0;
  return (...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  };
};

const GuessForm: React.FC = () => {
  const t = useTranslations('GuessForm');
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [token, setToken] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [guess, setGuess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Get token from URL on component mount
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError(t('Errors.tokenMissing'));
      console.error("Token missing from URL parameters.");
    }
  }, [searchParams, t]);

  // Ensure only numeric input for guess field
  const handleGuessChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow empty string or numeric values
    if (value === '' || /^\d+$/.test(value)) {
      setGuess(value);
    }
  };

  // Throttled API submission function - helps during high traffic by limiting frequent retries
  const submitToApi = useCallback(throttle(async (payload: any) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // Add timeout for network requests
        signal: AbortSignal.timeout(10000) // 10-second timeout
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle rate limiting explicitly
        if (response.status === 429) {
          setError(t('Errors.tooManyRequests'));
          // Increment retry count
          setRetryCount(prev => prev + 1);
          return false;
        }
        
        setError(result.message || t('Errors.submissionError'));
        return false;
      } else {
        console.log('Submission successful:', result);
        router.push('/confirmation');
        return true;
      }
    } catch (err: any) {
      console.error('Network or fetch error:', err);
      // Handle abort/timeout explicitly
      if (err.name === 'AbortError') {
        setError(t('Errors.requestTimeout'));
      } else {
        setError(t('Errors.networkError'));
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, 1000), [t, router]); // 1-second throttle between submissions

  // Handle Form Submission
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic Client-Side Validation
    if (!token) {
        setError(t('Errors.tokenMissing'));
        setIsLoading(false);
        return;
    }
    if (!fullName.trim()) {
        setError(t('Errors.nameRequired'));
        setIsLoading(false);
        return;
    }
    if (!contactNumber.trim()) {
        setError(t('Errors.contactRequired'));
        setIsLoading(false);
        return;
    }
    if (guess === '') {
        setError(t('Errors.guessRequiredPapaya'));
        setIsLoading(false);
        return;
    }

    // Type specific guess validation
    const numGuess = parseInt(guess, 10);
    if (isNaN(numGuess) || numGuess <= 0) {
      setError(t('Errors.guessInvalidFormat'));
      setIsLoading(false);
      return;
    }

    // Prepare Payload
    const payload = {
      tokenCode: token,
      contestType: 'papaya',
      fullName: fullName.trim(),
      contactNumber: contactNumber.trim(),
      guess: numGuess,
    };

    // Use the throttled submission function
    const success = await submitToApi(payload);
    if (!success) {
      // Keep the form in loading state for a brief period if there are network issues
      setTimeout(() => setIsLoading(false), 800);
    }
  };

  // Show retry message if we've had multiple failures
  const showRetryMessage = retryCount > 1;

  // If token is missing on load, maybe render an error message instead of the form
  if (!token && !error) {
    return <div className="text-center p-6"><LoadingSpinner /></div>;
  }
  if (error === t('Errors.tokenMissing')) {
    return <div className="max-w-md mx-auto p-6"><ErrorMessage message={error}/></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-center mb-4 text-white">{t('papayaSeedTitle')}</h2>

      {/* Display errors */}
      {error && <ErrorMessage message={error}/>}
      
      {/* Show high traffic message during retry attempts */}
      {showRetryMessage && (
        <div className="text-amber-200 text-sm p-2 bg-amber-900/20 rounded-md mb-4">
          {t('highTrafficMessage') || "We're experiencing high traffic. Please wait a moment before trying again."}
        </div>
      )}

      {/* User Information Inputs */}
      <Input
        id="fullName"
        label={t('nameLabel')}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        disabled={isLoading || isSubmitting}
      />
      <Input
        id="contactNumber"
        label={t('contactLabel')}
        value={contactNumber}
        onChange={(e) => setContactNumber(e.target.value)}
        type="tel"
        required
        disabled={isLoading || isSubmitting}
      />

      {/* Papaya Seed Count Guess Input */}
      <Input
        id="guess"
        label={t('guessLabelPapaya')}
        type="number"
        value={guess}
        onChange={handleGuessChange}
        required
        disabled={isLoading || isSubmitting}
        min="1"
        pattern="\d+"
      />

      {/* Submission Button with more detailed loading states */}
      <Button 
        type="submit" 
        isLoading={isLoading || isSubmitting} 
        disabled={isLoading || isSubmitting} 
        className="w-full"
      >
        {isSubmitting 
          ? t('processingButton') || "Processing..." 
          : isLoading 
            ? t('submittingButton') || "Submitting..." 
            : t('submitButton') || "Submit"
        }
      </Button>
    </form>
  );
};

export default GuessForm;