'use client';

import * as React from 'react';
import { format, subMonths } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslations } from 'next-intl';

interface Props {
  defaultValue?: Date;
  onSelect?: (date: Date) => void;
}

export default function DatePicker(props: Props) {
  const { defaultValue, onSelect } = props;

  const [date, setDate] = React.useState<Date | undefined>(defaultValue);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const t = useTranslations('components.datePicker');

  React.useEffect(() => {
    if (date && onSelect) onSelect(date);
  });

  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className="data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal"
        >
          <CalendarIcon />
          {date ? format(date, 'PPP') : <span>{t('pickADate')}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          weekStartsOn={1}
          disabled={(date) => date > new Date() || date < subMonths(new Date(), 1)}
          mode="single"
          selected={date}
          onSelect={(d) => {
            setDate(d);
            setIsCalendarOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
