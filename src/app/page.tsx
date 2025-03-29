"use client";

import { useState, useEffect } from "react";
import GitHubCity from "./components/GithubCity";
import { getGitHubContributions, ContributionDay } from "./lib/github";

export default function Home() {
  const [contributions, setContributions] = useState<ContributionDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("t3dotgg");
  const [error, setError] = useState("");

  const fetchContributions = async (username: string) => {
    if (!username) {
      setError("Please enter a GitHub username");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getGitHubContributions(username);
      if (typeof response === "string") {
        setError(response);
        return;
      }
      setContributions(response.contributions);
    } catch {
      setError(
        "Error fetching GitHub data. Please check the username and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions(username);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFetchData = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchContributions(username);
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Map Section - Full Screen */}
      {contributions.length > 0 && (
        <div className="absolute inset-0">
          <GitHubCity data={contributions} />
        </div>
      )}

      {/* Top Fade */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-white via-white/80 to-transparent" />

      {/* Header Section - At the top */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
              <span>🏙️</span>{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                GitHub City
              </span>
            </h1>
            <p className="text-gray-600 text-base max-w-2xl mx-auto mb-4">
              Watch your GitHub contributions transform into a bustling
              metropolis. Each commit builds a skyscraper, every contribution
              shapes the cityscape.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="https://github.com/asierbayon/github-city"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200 text-gray-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.91-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Github</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-white via-white/80 to-transparent" />

      {/* Controls Section - On top of bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Form */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleFetchData} className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter GitHub username"
                    className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white shadow-sm transition-all duration-200"
                  />
                  <svg
                    className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <button
                  type="submit"
                  className="px-8 py-3 text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    "Generate Map"
                  )}
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-sm flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {error}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
