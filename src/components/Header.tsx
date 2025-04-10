
import React from 'react';
import { Button } from "@/components/ui/button";
import { Database, Clock, PlusCircle, AlertTriangle, BarChart2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  onCreateSnapshot: () => void;
  onSimulateCorruption: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onCreateSnapshot, 
  onSimulateCorruption,
  activeTab,
  setActiveTab
}) => {
  const { toast } = useToast();

  const handleCreateSnapshot = () => {
    onCreateSnapshot();
  };
  
  return (
    <header className="p-4 bg-gradient-to-r from-snapdb-dark to-snapdb-bg border-b border-snapdb-primary/30">
      <div className="container mx-auto flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div className="flex items-center">
          <Database className="h-8 w-8 text-snapdb-primary mr-2" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-snapdb-primary to-snapdb-accent bg-clip-text text-transparent">
            SnapDB
          </h1>
          <span className="ml-2 text-xs bg-snapdb-primary/20 text-snapdb-primary px-2 py-0.5 rounded-full">
            Beta
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className={activeTab === 'database' 
              ? 'bg-snapdb-primary text-white' 
              : 'hover:bg-snapdb-primary/20'}
            onClick={() => setActiveTab('database')}
          >
            <Database className="h-4 w-4 mr-2" />
            Database
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className={activeTab === 'snapshots' 
              ? 'bg-snapdb-primary text-white' 
              : 'hover:bg-snapdb-primary/20'}
            onClick={() => setActiveTab('snapshots')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Time Travel
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className={activeTab === 'metrics' 
              ? 'bg-snapdb-primary text-white' 
              : 'hover:bg-snapdb-primary/20'}
            onClick={() => setActiveTab('metrics')}
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            Metrics
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="bg-snapdb-primary/10 hover:bg-snapdb-primary/20 text-snapdb-primary"
            onClick={handleCreateSnapshot}
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Snapshot
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="bg-destructive/10 hover:bg-destructive/20 text-destructive"
            onClick={onSimulateCorruption}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Corrupt
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
