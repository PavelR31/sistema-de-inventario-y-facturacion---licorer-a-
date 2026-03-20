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
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4 flex-1">
        {Icon && (
          <div className="h-10 w-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center border border-primary/10 shrink-0">
            <Icon size={20} weight="duotone" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        {/* Integrated Search */}
        {onSearchChange !== undefined && (
          <div className="hidden md:flex relative max-w-sm flex-1 ml-4">
            <MagnifyingGlass className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder={searchPlaceholder}
              className="pl-9 h-10 bg-white border-slate-200 rounded-sm focus-visible:ring-primary/20 transition-all"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onSearchChange !== undefined && (
          <div className="flex md:hidden relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder={searchPlaceholder}
              className="pl-9 h-10 bg-white border-slate-200 rounded-sm"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}

        {onViewModeChange && (
          <div className="flex items-center gap-1 bg-white p-1 rounded-sm border border-slate-200 shadow-sm shrink-0">
            <Button 
              variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
              size="icon-sm" 
              className={cn("h-8 w-8 rounded-sm", viewMode === 'table' && "bg-slate-100 shadow-none")}
              onClick={() => onViewModeChange('table')}
            >
              <List size={16} weight={viewMode === 'table' ? 'bold' : 'regular'} />
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="icon-sm" 
              className={cn("h-8 w-8 rounded-sm", viewMode === 'grid' && "bg-slate-100 shadow-none")}
              onClick={() => onViewModeChange('grid')}
            >
              <SquaresFour size={16} weight={viewMode === 'grid' ? 'bold' : 'regular'} />
            </Button>
          </div>
        )}
        <div className="shrink-0">
          {action}
        </div>
      </div>
    </div>
  );
}
