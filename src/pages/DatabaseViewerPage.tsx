import React, { useState, useEffect } from 'react';
import { trackPageView } from '../services/behaviorTracking';

interface CollectionInfo {
  name: string;
  documentCount: number;
  sampleDocuments: any[];
  indexes: any[];
}

interface DatabaseInfo {
  databaseName: string;
  collections: CollectionInfo[];
  totalCollections: number;
  timestamp: string;
}

const DatabaseViewerPage: React.FC = () => {
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

  useEffect(() => {
    trackPageView('database-viewer');
    fetchDatabaseInfo();
  }, []);

  const fetchDatabaseInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5050/api/database-viewer');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setDatabaseInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch database info');
      console.error('Error fetching database info:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollection = (collectionName: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionName)) {
      newExpanded.delete(collectionName);
    } else {
      newExpanded.add(collectionName);
    }
    setExpandedCollections(newExpanded);
  };

  const formatDocument = (doc: any): string => {
    try {
      return JSON.stringify(doc, null, 2);
    } catch {
      return String(doc);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading database information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading database</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchDatabaseInfo}
                    className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!databaseInfo) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">No database information available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Database Viewer</h1>
          <p className="mt-2 text-gray-600">
            Viewing database: <span className="font-mono font-medium">{databaseInfo.databaseName}</span>
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {new Date(databaseInfo.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{databaseInfo.totalCollections}</div>
              <div className="text-sm text-gray-600">Total Collections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {databaseInfo.collections.reduce((sum, col) => sum + col.documentCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {databaseInfo.collections.filter(col => col.documentCount > 0).length}
              </div>
              <div className="text-sm text-gray-600">Active Collections</div>
            </div>
          </div>
        </div>

        {/* Collections */}
        <div className="space-y-4">
          {databaseInfo.collections.map((collection) => (
            <div key={collection.name} className="bg-white rounded-lg shadow">
              <div
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 border-b border-gray-200"
                onClick={() => toggleCollection(collection.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">{collection.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {collection.documentCount} documents
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {collection.indexes.length} indexes
                    </span>
                    <svg
                      className={`h-5 w-5 text-gray-400 transform transition-transform ${
                        expandedCollections.has(collection.name) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {expandedCollections.has(collection.name) && (
                <div className="px-6 py-4 space-y-4">
                  {/* Sample Documents */}
                  {collection.sampleDocuments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Sample Documents</h4>
                      <div className="space-y-2">
                        {collection.sampleDocuments.map((doc, index) => (
                          <div key={index} className="bg-gray-50 rounded p-3">
                            <pre className="text-xs text-gray-800 overflow-x-auto">
                              {formatDocument(doc)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Indexes */}
                  {collection.indexes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Indexes</h4>
                      <div className="space-y-2">
                        {collection.indexes.map((index, indexIndex) => (
                          <div key={indexIndex} className="bg-gray-50 rounded p-3">
                            <pre className="text-xs text-gray-800 overflow-x-auto">
                              {formatDocument(index)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {collection.sampleDocuments.length === 0 && collection.indexes.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No data to display for this collection
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchDatabaseInfo}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseViewerPage;

