
import React, { useState } from 'react';
import Header from '@/components/Header';
import DatabaseView from '@/components/DatabaseView';
import SnapshotTimeline from '@/components/SnapshotTimeline';
import MetricsView from '@/components/MetricsView';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import db from '@/lib/database';

const Index = () => {
  const [activeTab, setActiveTab] = useState('database');
  const [isSnapshotDialogOpen, setIsSnapshotDialogOpen] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDescription, setSnapshotDescription] = useState('');

  const handleCreateSnapshot = () => {
    setIsSnapshotDialogOpen(true);
  };

  const handleSimulateCorruption = () => {
    db.simulateDataCorruption();
  };

  const handleSaveSnapshot = () => {
    if (!snapshotName.trim()) return;
    
    db.createSnapshot(snapshotName, snapshotDescription);
    setSnapshotName('');
    setSnapshotDescription('');
    setIsSnapshotDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col dark">
      <Header 
        onCreateSnapshot={handleCreateSnapshot}
        onSimulateCorruption={handleSimulateCorruption}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <main className="flex-grow container mx-auto">
        {activeTab === 'database' && <DatabaseView />}
        {activeTab === 'snapshots' && <SnapshotTimeline />}
        {activeTab === 'metrics' && <MetricsView />}
      </main>
      
      <footer className="border-t border-snapdb-primary/20 py-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          SnapDB - Time Travel Key-Value Store © {new Date().getFullYear()}
        </div>
      </footer>
      
      <Dialog open={isSnapshotDialogOpen} onOpenChange={setIsSnapshotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Snapshot</DialogTitle>
            <DialogDescription>
              Capture the current state of your database
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">Snapshot Name</Label>
              <Input
                id="name"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder="E.g., Before feature release"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={snapshotDescription}
                onChange={(e) => setSnapshotDescription(e.target.value)}
                placeholder="Describe why you're creating this snapshot"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveSnapshot}>Create Snapshot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
