import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { List, SquaresFour, MagnifyingGlass } from '@phosphor-icons/react';

export default function PageHeader({ 
  title, 
  subtitle, 
  icon: Icon, 
  action, 
  viewMode, 
  onViewModeChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar..."
}) {
  return (
    <div className="flex flex-col gap-1 mb-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onViewModeChange && (
            <div className="flex items-center bg-muted/50 p-1 rounded-lg border shadow-sm">
              <Button 
                variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8"
                onClick={() => onViewModeChange('table')}
              >
                <List size={16} />
              </Button>
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8"
                onClick={() => onViewModeChange('grid')}
              >
                <SquaresFour size={16} />
              </Button>
            </div>
          )}
          {action}
        </div>
      </div>

      {onSearchChange !== undefined && (
        <div className="relative mt-4 max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={searchPlaceholder}
            className="pl-9 h-10 bg-background shadow-sm"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
