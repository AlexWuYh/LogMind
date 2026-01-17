"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SearchResult {
  id: string;
  date: string;
  summary: string | null;
  project: string | null;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setSearched(true);
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      
      if (!res.ok) {
        throw new Error(`Search failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        console.error("Unexpected response format:", data);
        setResults([]);
        // Optional: setError("Invalid response format from server");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-4xl animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">Find your past work logs by keyword, project, or summary.</p>
      </div>
      
      <div className="flex gap-3">
        <Input 
          placeholder="Type to search..." 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="h-11 text-base shadow-sm"
        />
        <Button onClick={handleSearch} disabled={loading} className="h-11 px-6 min-w-[120px]">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SearchIcon className="mr-2 h-4 w-4" />
          )}
          {loading ? "Searching" : "Search"}
        </Button>
      </div>

      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {searched && !loading && results.length === 0 && !error && (
          <div className="text-center py-12 text-muted-foreground bg-accent/20 rounded-xl border border-dashed border-border">
            <SearchIcon className="mx-auto h-12 w-12 opacity-20 mb-3" />
            <p className="font-medium">No results found</p>
            <p className="text-sm opacity-70">Try adjusting your search terms</p>
          </div>
        )}

        <div className="grid gap-4">
          {results.map(log => (
            <Link key={log.id} href={`/logs/${log.date}`}>
              <Card className="hover:bg-accent/40 transition-all hover:shadow-md border-border/60 group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                      {log.date}
                    </CardTitle>
                    {log.project && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {log.project}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {log.summary || "No summary available"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
