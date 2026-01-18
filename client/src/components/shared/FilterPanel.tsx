import { useState } from 'react';
import { Calendar, ChevronDown, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'multi-select' | 'date-range' | 'text';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: any;
}

interface FilterPanelProps {
  filters: FilterConfig[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  className?: string;
}

export function FilterPanel({ filters, values, onChange, className }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (filterId: string, value: any) => {
    onChange({ ...values, [filterId]: value });
  };

  const handleMultiSelectToggle = (filterId: string, optionValue: string) => {
    const currentValues = values[filterId] || [];
    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter((v: string) => v !== optionValue)
      : [...currentValues, optionValue];

    handleFilterChange(filterId, newValues);
  };

  const handleClearAll = () => {
    const clearedValues: FilterValues = {};
    filters.forEach(filter => {
      clearedValues[filter.id] = filter.type === 'multi-select' ? [] : '';
    });
    onChange(clearedValues);
  };

  const activeFilterCount = filters.filter(filter => {
    const value = values[filter.id];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== '';
  }).length;

  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'text':
        return (
          <div key={filter.id} className="space-y-2">
            <Label htmlFor={filter.id} className="text-sm font-medium">
              {filter.label}
            </Label>
            <Input
              id={filter.id}
              type="text"
              placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
              value={values[filter.id] || ''}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              className="h-9"
            />
          </div>
        );

      case 'select':
        return (
          <div key={filter.id} className="space-y-2">
            <Label className="text-sm font-medium">{filter.label}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-9">
                  <span className="truncate">
                    {values[filter.id]
                      ? filter.options?.find(opt => opt.value === values[filter.id])?.label
                      : filter.placeholder || 'Select...'}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuCheckboxItem
                  checked={!values[filter.id]}
                  onCheckedChange={() => handleFilterChange(filter.id, '')}
                >
                  All
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {filter.options?.map(option => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={values[filter.id] === option.value}
                    onCheckedChange={() => handleFilterChange(filter.id, option.value)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );

      case 'multi-select':
        const selectedCount = (values[filter.id] || []).length;
        return (
          <div key={filter.id} className="space-y-2">
            <Label className="text-sm font-medium">{filter.label}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-9">
                  <span className="truncate">
                    {selectedCount > 0
                      ? `${selectedCount} selected`
                      : filter.placeholder || 'Select...'}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Select multiple options
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filter.options?.map(option => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={(values[filter.id] || []).includes(option.value)}
                    onCheckedChange={() => handleMultiSelectToggle(filter.id, option.value)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedCount > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(values[filter.id] || []).map((value: string) => {
                  const option = filter.options?.find(opt => opt.value === value);
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="text-xs"
                    >
                      {option?.label || value}
                      <button
                        onClick={() => handleMultiSelectToggle(filter.id, value)}
                        className="ml-1 hover:bg-background/10 rounded-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'date-range':
        return (
          <div key={filter.id} className="space-y-2">
            <Label className="text-sm font-medium">{filter.label}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Input
                  type="date"
                  value={values[filter.id]?.start || ''}
                  onChange={(e) => handleFilterChange(filter.id, {
                    ...values[filter.id],
                    start: e.target.value
                  })}
                  className="h-9 pr-8"
                />
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <Input
                  type="date"
                  value={values[filter.id]?.end || ''}
                  onChange={(e) => handleFilterChange(filter.id, {
                    ...values[filter.id],
                    end: e.target.value
                  })}
                  className="h-9 pr-8"
                />
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("border rounded-lg bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-8 text-xs"
            >
              Clear all
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map(renderFilter)}
          </div>
        </div>
      )}
    </div>
  );
}
