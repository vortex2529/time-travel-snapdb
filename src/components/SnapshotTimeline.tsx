
import React, { useState, useRef, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Clock, 
  RotateCcw, 
  ChevronRight, 
  ChevronDown, 
  Check,
  Calendar,
  Tag,
  Search 
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { KeyValuePair, Snapshot } from '@/lib/types';
import db from '@/lib/database';
import KeyValueEditor from './KeyValueEditor';

const SnapshotTimeline: React.FC = () => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [compareSnapshot, setCompareSnapshot] = useState<Snapshot | null>(null);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newSnapshotDescription, setNewSnapshotDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('timeline');
  const [searchTerm, setSearchTerm] = useState('');
  const timelineRef = useRef<HTMLDivElement>(null);

  // Load snapshots
  const loadSnapshots = () => {
    const data = db.getSnapshots().sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setSnapshots(data);
    
    // Select the most recent snapshot if none is selected
    if (!selectedSnapshot && data.length > 0) {
      setSelectedSnapshot(data[0]);
    }
  };

  useEffect(() => {
    loadSnapshots();
    
    // Subscribe to database changes
    const unsubscribe = db.subscribe(() => {
      loadSnapshots();
    });
    
    return () => unsubscribe();
  }, []);

  const handleRestoreSnapshot = (snapshot: Snapshot) => {
    db.restoreSnapshot(snapshot.id);
  };

  const handleCreateSnapshot = () => {
    if (!newSnapshotName.trim()) {
      toast.error("Snapshot name is required");
      return;
    }
    
    db.createSnapshot(newSnapshotName, newSnapshotDescription);
    setNewSnapshotName('');
    setNewSnapshotDescription('');
    setIsDialogOpen(false);
  };

  const handleSelectSnapshot = (snapshot: Snapshot) => {
    setSelectedSnapshot(snapshot);
  };

  const handleCompareSelect = (snapshot: Snapshot) => {
    setCompareSnapshot(snapshot);
  };

  const clearCompare = () => {
    setCompareSnapshot(null);
  };

  // Helper function to format date
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

  // Filter snapshots based on search term
  const filteredSnapshots = snapshots.filter(snapshot => 
    snapshot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (snapshot.description && snapshot.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get diff between snapshots
  const getDifferences = (): { 
    added: string[], 
    removed: string[], 
    modified: string[] 
  } => {
    if (!selectedSnapshot || !compareSnapshot) return { added: [], removed: [], modified: [] };
    
    const currentKeys = Object.keys(selectedSnapshot.data);
    const compareKeys = Object.keys(compareSnapshot.data);
    
    const added = currentKeys.filter(key => !compareKeys.includes(key));
    const removed = compareKeys.filter(key => !currentKeys.includes(key));
    
    const common = currentKeys.filter(key => compareKeys.includes(key));
    const modified = common.filter(key => 
      selectedSnapshot.data[key].value !== compareSnapshot.data[key].value
    );
    
    return { added, removed, modified };
  };

  const differences = compareSnapshot ? getDifferences() : { added: [], removed: [], modified: [] };

  // Calculate timeline marker positions
  const getMarkerPosition = (index: number): string => {
    if (snapshots.length <= 1) return '0%';
    const maxIndex = snapshots.length - 1;
    const percentage = (index / maxIndex) * 100;
    return `${percentage}%`;
  };

  return (
    <div className="p-4">
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Clock className="mr-2 h-5 w-5 text-snapdb-primary" />
              Snapshot Timeline
            </h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-snapdb-primary hover:bg-snapdb-secondary">
                  Create Snapshot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Snapshot</DialogTitle>
                  <DialogDescription>
                    Capture the current state of your database
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="snapshot-name">Snapshot Name</Label>
                    <Input 
                      id="snapshot-name" 
                      value={newSnapshotName}
                      onChange={(e) => setNewSnapshotName(e.target.value)}
                      placeholder="E.g., Before feature release"
                    />
                  </div>
                  <div>
                    <Label htmlFor="snapshot-description">Description (Optional)</Label>
                    <Textarea 
                      id="snapshot-description" 
                      value={newSnapshotDescription}
                      onChange={(e) => setNewSnapshotDescription(e.target.value)}
                      placeholder="Describe why you're creating this snapshot"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateSnapshot}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-8 relative" ref={timelineRef}>
            <div className="timeline-track">
              {snapshots.map((snapshot, index) => (
                <TooltipProvider key={snapshot.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`timeline-marker ${selectedSnapshot?.id === snapshot.id ? 'active' : ''}`}
                        style={{ left: getMarkerPosition(index) }}
                        onClick={() => handleSelectSnapshot(snapshot)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{snapshot.name}</p>
                      <p className="text-xs">{formatDate(snapshot.timestamp)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              {snapshots.length > 0 && (
                <>
                  <span>{formatDate(snapshots[snapshots.length - 1].timestamp)}</span>
                  <span>{snapshots.length > 1 ? formatDate(snapshots[0].timestamp) : ''}</span>
                </>
              )}
            </div>
          </div>

          {selectedSnapshot ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="overflow-hidden">
                <CardHeader className="bg-card border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">
                        {selectedSnapshot.name}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(selectedSnapshot.timestamp)}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleRestoreSnapshot(selectedSnapshot)}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Restore
                    </Button>
                  </div>
                  {selectedSnapshot.description && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      "{selectedSnapshot.description}"
                    </p>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Snapshot Data</h3>
                      <Badge variant="outline">
                        {Object.keys(selectedSnapshot.data).length} Items
                      </Badge>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-auto">
                      {Object.keys(selectedSnapshot.data).length > 0 ? (
                        Object.values(selectedSnapshot.data).map((entry: KeyValuePair) => (
                          <div key={entry.key} className="border rounded-md p-2">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-xs text-snapdb-primary truncate">
                                {entry.key}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {isJsonValue(entry.value) ? 'JSON' : 'String'}
                              </Badge>
                            </div>
                            <div className="mt-1 bg-muted/30 p-1.5 rounded text-xs font-mono whitespace-pre-wrap max-h-20 overflow-auto">
                              {isJsonValue(entry.value) 
                                ? JSON.stringify(JSON.parse(entry.value), null, 2)
                                : entry.value}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          No data in this snapshot
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Compare with...</CardTitle>
                    <CardDescription>
                      Select another snapshot to compare
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {snapshots
                        .filter(s => s.id !== selectedSnapshot.id)
                        .slice(0, 5)
                        .map(s => (
                          <Button 
                            key={s.id}
                            variant="outline"
                            size="sm"
                            className={compareSnapshot?.id === s.id ? "bg-snapdb-primary/20" : ""}
                            onClick={() => handleCompareSelect(s)}
                          >
                            {s.name}
                            {compareSnapshot?.id === s.id && <Check className="ml-1 h-3 w-3" />}
                          </Button>
                        ))
                      }
                      {compareSnapshot && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearCompare}
                          className="text-muted-foreground"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {compareSnapshot && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>Changes</span>
                        <div className="flex items-center text-sm font-normal">
                          <span className="text-muted-foreground mr-1">Comparing with:</span> 
                          {compareSnapshot.name}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1 flex items-center">
                          <Badge variant="outline" className="bg-green-500/10 mr-2">
                            {differences.added.length}
                          </Badge>
                          Added Keys
                        </h4>
                        <div className="text-sm">
                          {differences.added.length > 0 ? (
                            differences.added.map(key => (
                              <div key={key} className="py-1 px-2 rounded bg-green-500/10 text-xs mb-1">
                                {key}
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No keys added</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1 flex items-center">
                          <Badge variant="outline" className="bg-red-500/10 mr-2">
                            {differences.removed.length}
                          </Badge>
                          Removed Keys
                        </h4>
                        <div className="text-sm">
                          {differences.removed.length > 0 ? (
                            differences.removed.map(key => (
                              <div key={key} className="py-1 px-2 rounded bg-red-500/10 text-xs mb-1">
                                {key}
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No keys removed</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1 flex items-center">
                          <Badge variant="outline" className="bg-amber-500/10 mr-2">
                            {differences.modified.length}
                          </Badge>
                          Modified Values
                        </h4>
                        <div className="text-sm">
                          {differences.modified.length > 0 ? (
                            differences.modified.map(key => (
                              <div key={key} className="py-1 px-2 rounded bg-amber-500/10 text-xs mb-1">
                                {key}
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No values modified</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No snapshots available. Create your first snapshot to get started.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="table">
          <div className="mb-4 flex justify-between items-center">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search snapshots..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-snapdb-primary hover:bg-snapdb-secondary">
                  Create Snapshot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Snapshot</DialogTitle>
                  <DialogDescription>
                    Capture the current state of your database
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="snapshot-name">Snapshot Name</Label>
                    <Input 
                      id="snapshot-name" 
                      value={newSnapshotName}
                      onChange={(e) => setNewSnapshotName(e.target.value)}
                      placeholder="E.g., Before feature release"
                    />
                  </div>
                  <div>
                    <Label htmlFor="snapshot-description">Description (Optional)</Label>
                    <Textarea 
                      id="snapshot-description" 
                      value={newSnapshotDescription}
                      onChange={(e) => setNewSnapshotDescription(e.target.value)}
                      placeholder="Describe why you're creating this snapshot"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateSnapshot}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {filteredSnapshots.length > 0 ? (
              filteredSnapshots.map((snapshot) => (
                <Card key={snapshot.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{snapshot.name}</h3>
                        <div className="text-sm text-muted-foreground flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(snapshot.timestamp)}
                        </div>
                      </div>
                      <div className="space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSelectSnapshot(snapshot)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleRestoreSnapshot(snapshot)}
                          className="bg-snapdb-primary hover:bg-snapdb-secondary"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </div>
                    {snapshot.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {snapshot.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center text-xs">
                      <Badge variant="outline">
                        {Object.keys(snapshot.data).length} Items
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? 'No snapshots match your search' : 'No snapshots available'}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SnapshotTimeline;
