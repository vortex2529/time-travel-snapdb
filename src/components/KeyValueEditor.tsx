
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, X, Trash } from "lucide-react";
import { cn } from '@/lib/utils';

interface KeyValueEditorProps {
  initialKey?: string;
  initialValue?: string;
  onSave: (key: string, value: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
  className?: string;
}

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({ 
  initialKey = '', 
  initialValue = '', 
  onSave, 
  onCancel,
  onDelete,
  className
}) => {
  const [key, setKey] = useState(initialKey);
  const [value, setValue] = useState(initialValue);
  const [isJsonValue, setIsJsonValue] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const isEditing = initialKey !== '';

  useEffect(() => {
    // Check if the value is JSON
    try {
      JSON.parse(initialValue);
      setIsJsonValue(true);
    } catch (e) {
      setIsJsonValue(false);
    }
  }, [initialValue]);

  const validateJson = (text: string): boolean => {
    if (!isJsonValue) return true;
    try {
      JSON.parse(text);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleValueChange = (text: string) => {
    setValue(text);
    if (isJsonValue) {
      setIsValid(validateJson(text));
    }
  };

  const handleSave = () => {
    if (!key.trim()) {
      toast.error("Key cannot be empty");
      return;
    }
    
    if (isJsonValue && !isValid) {
      toast.error("Invalid JSON format");
      return;
    }
    
    onSave(key, value);
  };

  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(value);
      setValue(JSON.stringify(parsed, null, 2));
    } catch (e) {
      toast.error("Cannot prettify - not valid JSON");
    }
  };

  return (
    <div className={cn("p-4 bg-card rounded-md border border-border", className)}>
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-medium">
          {isEditing ? 'Edit Entry' : 'New Entry'}
        </h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="key">Key</Label>
          <Input
            id="key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter key"
            disabled={isEditing}
            className={isEditing ? "bg-muted" : ""}
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center">
            <Label htmlFor="value" className={!isValid ? "text-destructive" : ""}>
              Value {!isValid && '(Invalid JSON)'}
            </Label>
            {isJsonValue && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handlePrettify} 
                className="h-6 text-xs"
              >
                Prettify
              </Button>
            )}
          </div>
          <Textarea
            id="value"
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Enter value"
            className={cn("font-mono", !isValid && "border-destructive")}
            rows={5}
          />
        </div>
        
        <div className="flex justify-end gap-2">
          {onDelete && (
            <Button 
              variant="destructive" 
              onClick={onDelete} 
              size="sm"
            >
              <Trash className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
          <Button 
            variant="default" 
            onClick={handleSave}
            disabled={!isValid || !key.trim()}
          >
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default KeyValueEditor;
