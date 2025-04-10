
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Search, Plus, Trash, RefreshCw, Edit, X, Database } from "lucide-react";
import { KeyValuePair } from '@/lib/types';
import KeyValueEditor from './KeyValueEditor';
import db from '@/lib/database';

const DatabaseView: React.FC = () => {
  const [entries, setEntries] = useState<KeyValuePair[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<KeyValuePair[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KeyValuePair | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = () => {
    const data = db.getAllEntries();
    setEntries(data);
    filterEntries(data, searchTerm);
  };

  useEffect(() => {
    loadData();
    
    // Subscribe to database changes
    const unsubscribe = db.subscribe(() => {
      loadData();
    });
    
    return () => unsubscribe();
  }, []);

  const filterEntries = (data: KeyValuePair[], term: string) => {
    if (!term) {
      setFilteredEntries(data);
      return;
    }
    
    const lowerTerm = term.toLowerCase();
    const filtered = data.filter(entry => 
      entry.key.toLowerCase().includes(lowerTerm) || 
      entry.value.toLowerCase().includes(lowerTerm)
    );
    setFilteredEntries(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterEntries(entries, term);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredEntries(entries);
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setIsCreating(true);
  };

  const handleEditEntry = (entry: KeyValuePair) => {
    setIsCreating(false);
    setEditingEntry(entry);
  };

  const handleSaveEntry = (key: string, value: string) => {
    db.put(key, value);
    setIsCreating(false);
    setEditingEntry(null);
    toast.success(`Entry "${key}" saved successfully`);
  };

  const handleDeleteEntry = () => {
    if (editingEntry) {
      db.delete(editingEntry.key);
      toast.success(`Entry "${editingEntry.key}" deleted`);
      setEditingEntry(null);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleIncrement = () => {
    db.incrementCounter();
  };

  // Helper to format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  // Helper to determine if value is JSON
  const isJsonValue = (value: string): boolean => {
    try {
      JSON.parse(value);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search keys and values..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={handleAddEntry} className="bg-snapdb-primary hover:bg-snapdb-secondary">
            <Plus className="h-4 w-4 mr-1" />
            Add Entry
          </Button>
          <Button onClick={handleIncrement} variant="outline">
            Increment Counter
          </Button>
          <Button
            variant="ghost"
            onClick={handleRefresh}
            className={isRefreshing ? "animate-spin" : ""}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(isCreating || editingEntry) && (
        <div className="mb-6">
          <KeyValueEditor
            initialKey={editingEntry?.key || ""}
            initialValue={editingEntry?.value || ""}
            onSave={handleSaveEntry}
            onCancel={() => {
              setIsCreating(false);
              setEditingEntry(null);
            }}
            onDelete={editingEntry ? handleDeleteEntry : undefined}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => (
            <Card key={entry.key} className="overflow-hidden zoom-on-hover">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-mono text-sm font-medium text-snapdb-primary truncate">
                      {entry.key}
                    </h3>
                    <Badge variant="outline" className="ml-2 whitespace-nowrap flex-shrink-0">
                      {isJsonValue(entry.value) ? 'JSON' : 'String'}
                    </Badge>
                  </div>
                  
                  <div className="max-h-32 overflow-auto bg-muted/40 rounded-md p-2 mb-2">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                      {isJsonValue(entry.value) 
                        ? JSON.stringify(JSON.parse(entry.value), null, 2)
                        : entry.value}
                    </pre>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Updated: {formatDate(entry.lastModified)}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7"
                      onClick={() => handleEditEntry(entry)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-8 text-muted-foreground">
            <Database className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg">
              {searchTerm ? 'No matching entries found' : 'Database is empty'}
            </p>
            <p className="text-sm mt-2">
              {searchTerm ? (
                <>
                  Try a different search term or{' '}
                  <Button variant="link" className="p-0 h-auto" onClick={handleClearSearch}>
                    clear the search
                  </Button>
                </>
              ) : (
                'Add some entries to get started'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseView;
