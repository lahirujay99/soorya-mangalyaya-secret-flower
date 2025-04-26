'use client'; // This component uses client-side hooks (useState, useRouter)

import React, { useState, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import Input from '../ui/Input';
import Button from '../ui/Button';
import ErrorMessage from '../feedback/ErrorMessage';

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

const TokenForm: React.FC = () => {
  const t = useTranslations('TokenEntry');
  const errors = useTranslations('Errors');
  const router = useRouter();
  
  // Enhanced state for better user feedback
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [showHighTrafficWarning, setShowHighTrafficWarning] = useState<boolean>(false);

  // Throttled API call function to prevent overloading the server
  const validateTokenWithAPI = useCallback(throttle(async (tokenValue: string) => {
    setIsValidating(true);
    
    try {
      // Call the token validation API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout
      
      const response = await fetch('/api/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenCode: tokenValue.trim() }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();

      // Handle rate limiting explicitly
      if (response.status === 429) {
        setRetryCount(prev => prev + 1);
        setShowHighTrafficWarning(true);
        setError(errors('tooManyRequests') || "Too many requests. Please wait and try again.");
        return false;
      }

      if (!response.ok) {
        // Handle HTTP error
        setError(errors('submissionError'));
        return false;
      }

      if (!data.valid) {
        // Handle invalid token with more specific messages
        if (data.message.includes("already been used")) {
          setError(errors('tokenUsed'));
        } else if (data.message.includes("not valid")) {
          setError(errors('tokenNotValid'));
        } else {
          setError(errors('invalidToken'));
        }
        return false;
      }

      // Token is valid, proceed
      console.log('Valid token, navigating with token:', tokenValue);
      router.push(`/submit-guess?token=${encodeURIComponent(tokenValue.trim())}`);
      return true;
      
    } catch (err: any) {
      console.error('Token validation error:', err);
      
      // Handle timeout/abort specifically
      if (err.name === 'AbortError') {
        setError(errors('requestTimeout') || "Request timed out. The server might be busy.");
        setShowHighTrafficWarning(true);
      } else {
        setError(errors('networkError'));
      }
      
      return false;
    } finally {
      setIsValidating(false);
    }
  }, 800), [router, errors]); // 800ms throttle to prevent rapid clicking

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    
    // Clear high traffic warning on new submission attempt
    if (showHighTrafficWarning && retryCount > 0) {
      // But only after a few seconds to ensure the user sees it
      setTimeout(() => setShowHighTrafficWarning(false), 1500);
    }

    if (!token.trim()) {
      setError(errors('tokenRequired'));
      return;
    }

    setIsLoading(true);
    const success = await validateTokenWithAPI(token);
    
    // Only turn off loading if we failed (success navigates away)
    if (!success) {
      // Slight delay to prevent UI flashing
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold text-center mb-4 text-white">{t('title')}</h2>
      <p className="text-sm text-white/80 text-center mb-4">{t('instructions')}</p>

      {/* Display errors */}
      {error && <ErrorMessage message={error} />}
      
      {/* Display high traffic warning if needed */}
      {showHighTrafficWarning && (
        <div className="text-amber-200 text-sm p-2 bg-amber-900/20 rounded-md mb-2">
          {t('highTrafficWarning') || "We're experiencing high traffic. Please be patient."}
        </div>
      )}

      <Input
        id="tokenCode"
        label={t('tokenLabel')}
        value={token}
        onChange={(e) => setToken(e.target.value.toUpperCase())}
        placeholder={t('placeholder')}
        required
        disabled={isLoading || isValidating}
        // Add debounce to prevent rapid typing issues
        autoComplete="off"
      />

      <Button 
        type="submit" 
        isLoading={isLoading || isValidating} 
        disabled={isLoading || isValidating} 
        className="w-full"
      >
        {isValidating 
          ? t('processingButton') || "Processing..." 
          : isLoading 
            ? t('validatingButton') || "Validating..." 
            : t('validateButton') || "Validate"
        }
      </Button>
      
      {/* Add a retry message if needed for better UX */}
      {retryCount > 1 && (
        <p className="text-xs text-center text-white/70 mt-2">
          {t('retryMessage') || "Having trouble? Wait a moment and try again."}
        </p>
      )}
    </form>
  );
};

export default TokenForm;