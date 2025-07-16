import React, { useState } from 'react';
import { Search, MapPin, Hash, ArrowRight, ExternalLink, CheckCircle } from 'lucide-react';

interface FormData {
  searchTerms: string;
  location: string;
  numberOfPlaces: number;
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    searchTerms: '',
    location: '',
    numberOfPlaces: 10
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Reset success state when user modifies form
    if (showSuccess) {
      setShowSuccess(false);
      setGoogleSheetUrl('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.searchTerms.trim()) {
      newErrors.searchTerms = 'Search terms are required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.numberOfPlaces < 1 || formData.numberOfPlaces > 100) {
      newErrors.numberOfPlaces = 'Number must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setShowSuccess(false);
    setGoogleSheetUrl('');
    
    try {
      const response = await fetch('https://salesmagicautomation.app.n8n.cloud/webhook-test/24f2c0fd-6f4f-47ec-b6ec-e25960142a04', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerms: formData.searchTerms,
          location: formData.location,
          numberOfPlaces: formData.numberOfPlaces,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const responseText = await response.text();
        console.log('Webhook response:', responseText);
        
        try {
          const responseData = JSON.parse(responseText);
          
          // Extract Google Sheet URL from the response
          if (responseData && responseData.length > 0 && responseData[0]['Set Webhook Information']) {
            const webhookInfo = responseData[0]['Set Webhook Information'];
            const urlMatch = webhookInfo.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/);
            
            if (urlMatch) {
              setGoogleSheetUrl(urlMatch[0]);
              setShowSuccess(true);
            } else {
              throw new Error('Google Sheet URL not found in response');
            }
          } else {
            throw new Error('Invalid response format');
          }
        } catch (jsonError) {
          // If JSON parsing fails, try to extract URL directly from text
          const urlMatch = responseText.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/);
          
          if (urlMatch) {
            setGoogleSheetUrl(urlMatch[0]);
            setShowSuccess(true);
          } else {
            throw new Error('Response is not valid JSON and no Google Sheet URL found');
          }
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Error submitting form: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Data Extraction Tool
          </h1>
          <p className="text-gray-600 text-lg">
            Extract business information from search results
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && googleSheetUrl && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 animate-in slide-in-from-top duration-300">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Extraction Complete!
                </h3>
                <p className="text-green-700 mb-4">
                  Your data has been successfully extracted and is now available in your Google Sheet.
                </p>
                <a
                  href={googleSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Google Sheet
                </a>
              </div>
            </div>
          </div>
        )}
        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <h2 className="text-xl font-semibold text-white">
              Configure Your Search
            </h2>
            <p className="text-blue-100 mt-1">
              Fill out the details below to start extracting data
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Search Terms */}
            <div>
              <label htmlFor="searchTerms" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 mr-2 text-gray-500" />
                Search Term(s)
              </label>
              <textarea
                id="searchTerms"
                rows={3}
                value={formData.searchTerms}
                onChange={(e) => handleInputChange('searchTerms', e.target.value)}
                placeholder="Enter search terms (e.g., restaurants, coffee shops, dentists)"
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 resize-none focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                  errors.searchTerms 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-200 focus:border-blue-500'
                }`}
              />
              {errors.searchTerms && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                  {errors.searchTerms}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Separate multiple terms with commas for batch processing
              </p>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                Location
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter location (e.g., New York, NY or London, UK)"
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                  errors.location 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-200 focus:border-blue-500'
                }`}
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                  {errors.location}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Use only one location per extraction run
              </p>
            </div>

            {/* Number of Places */}
            <div>
              <label htmlFor="numberOfPlaces" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Hash className="w-4 h-4 mr-2 text-gray-500" />
                Number of Places to Extract
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="numberOfPlaces"
                  min="1"
                  max="100"
                  value={formData.numberOfPlaces}
                  onChange={(e) => handleInputChange('numberOfPlaces', parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                    errors.numberOfPlaces 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  places
                </div>
              </div>
              {errors.numberOfPlaces && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                  {errors.numberOfPlaces}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Number of results per search term (1-100)
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Extracting Data...
                  </>
                ) : (
                  <>
                    Start Extraction
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Powered by advanced data extraction</span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                System online
              </span>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-blue-600 font-semibold text-sm">Fast Processing</div>
            <div className="text-gray-600 text-xs mt-1">Results in minutes</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-purple-600 font-semibold text-sm">High Accuracy</div>
            <div className="text-gray-600 text-xs mt-1">99%+ data quality</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-green-600 font-semibold text-sm">Batch Support</div>
            <div className="text-gray-600 text-xs mt-1">Multiple search terms</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;