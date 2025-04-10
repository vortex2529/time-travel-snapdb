
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Separator } from "@/components/ui/separator";
import { BarChart2, FileText, Clock, LayoutGrid, Activity } from "lucide-react";
import { Operation, OperationType } from '@/lib/types';
import db from '@/lib/database';

interface OperationCount {
  type: string;
  count: number;
}

const MetricsView: React.FC = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [snapshots, setSnapshots] = useState<number>(0);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [operationsPerType, setOperationsPerType] = useState<OperationCount[]>([]);
  const [operationsOverTime, setOperationsOverTime] = useState<{ time: string; count: number }[]>([]);

  useEffect(() => {
    // Get operations and analyze
    const ops = db.getOperations();
    setOperations(ops);
    setSnapshots(db.getSnapshots().length);
    setTotalEntries(db.getAllEntries().length);
    
    // Count operations by type
    const opCounts: Record<string, number> = {};
    ops.forEach(op => {
      opCounts[op.type] = (opCounts[op.type] || 0) + 1;
    });
    
    setOperationsPerType(
      Object.entries(opCounts).map(([type, count]) => ({
        type,
        count
      }))
    );
    
    // Group operations by time
    const timeGroups: Record<string, number> = {};
    ops.forEach(op => {
      const date = new Date(op.timestamp);
      const timeKey = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      timeGroups[timeKey] = (timeGroups[timeKey] || 0) + 1;
    });
    
    setOperationsOverTime(
      Object.entries(timeGroups)
        .map(([time, count]) => ({ time, count }))
        .sort((a, b) => a.time.localeCompare(b.time))
    );
    
    // Subscribe to database changes
    const unsubscribe = db.subscribe(() => {
      setTotalEntries(db.getAllEntries().length);
      setSnapshots(db.getSnapshots().length);
      setOperations(db.getOperations());
    });
    
    return () => unsubscribe();
  }, []);

  const getOperationTypeColor = (type: string): string => {
    switch (type) {
      case 'put': return '#6366f1';
      case 'delete': return '#ef4444';
      case 'snapshot': return '#3b82f6';
      case 'restore': return '#10b981';
      case 'clear': return '#f59e0b';
      default: return '#6366f1';
    }
  };

  const formatOperationTypeName = (type: string): string => {
    switch (type) {
      case 'put': return 'Write';
      case 'delete': return 'Delete';
      case 'snapshot': return 'Snapshot';
      case 'restore': return 'Restore';
      case 'clear': return 'Clear All';
      default: return type;
    }
  };

  const getBgColorClass = (type: OperationType): string => {
    switch (type) {
      case 'put': return 'bg-indigo-500/10 text-indigo-500';
      case 'delete': return 'bg-red-500/10 text-red-500';
      case 'snapshot': return 'bg-blue-500/10 text-blue-500';
      case 'restore': return 'bg-emerald-500/10 text-emerald-500';
      case 'clear': return 'bg-amber-500/10 text-amber-500';
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border p-2 rounded-md shadow-md text-xs">
          <p>{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4">
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-center">Total Operations</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            <div className="flex flex-col items-center justify-center space-y-2 text-3xl font-bold text-snapdb-primary h-16">
              {operations.length}
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground text-center">
            Total database operations since initialization
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-center">Snapshots Created</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            <div className="flex flex-col items-center justify-center space-y-2 text-3xl font-bold text-snapdb-secondary h-16">
              {snapshots}
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground text-center">
            Total database snapshots available
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-center">Current Database Size</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            <div className="flex flex-col items-center justify-center space-y-2 text-3xl font-bold text-snapdb-accent h-16">
              {totalEntries}
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground text-center">
            Number of key-value pairs in current state
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-snapdb-primary" />
              Operations Over Time
            </CardTitle>
            <CardDescription>Database activity timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={operationsOverTime}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#6366f1" 
                    strokeWidth={2} 
                    name="Operations"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="mr-2 h-5 w-5 text-snapdb-primary" />
              Operations by Type
            </CardTitle>
            <CardDescription>
              Breakdown of operations performed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={operationsPerType}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="type" tickFormatter={formatOperationTypeName} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    name="Count" 
                    radius={[4, 4, 0, 0]}
                  >
                    {operationsPerType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getOperationTypeColor(entry.type)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-snapdb-primary" />
              Operation Log
            </CardTitle>
            <CardDescription>
              Recent database operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {operations.length > 0 ? (
                [...operations]
                  .reverse()
                  .slice(0, 10)
                  .map((op, index) => (
                    <div 
                      key={index}
                      className="text-sm border rounded-md p-2"
                    >
                      <div className="flex justify-between items-center">
                        <Badge className={getBgColorClass(op.type)}>
                          {formatOperationTypeName(op.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(op.timestamp)}
                        </span>
                      </div>
                      {op.key && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground">Key: </span>
                          <span className="font-mono">{op.key}</span>
                        </div>
                      )}
                      {op.description && (
                        <div className="mt-1 text-xs">
                          <span className="text-muted-foreground">Description: </span>
                          <span>{op.description}</span>
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No operations recorded yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MetricsView;
