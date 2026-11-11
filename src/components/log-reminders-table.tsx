'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Bell, BellOff, EllipsisVertical, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { humanDateFormat } from '@/lib/constants';
import { removeLogReminder, setLogReminderActive } from '@/app/actions/log-reminder';

export interface ReminderCampaign {
  id: number;
  date: string;
  label: string | null;
  active: boolean;
  total: number;
  done: number;
}

interface Props {
  campaigns: ReminderCampaign[];
}

export function LogRemindersTable(props: Props) {
  const t = useTranslations('pages.reminders.table');

  const [campaigns, setCampaigns] = useState(props.campaigns);
  const [pendingId, setPendingId] = useState(0);

  const handleActiveToggle = (id: number, active: boolean) => {
    setLogReminderActive(id, active).then((ok) => {
      if (!ok) return;
      setCampaigns((current) =>
        current.map((campaign) => (campaign.id === id ? { ...campaign, active } : campaign)),
      );
    });
  };

  const handleDeletion = () => {
    removeLogReminder(pendingId).then((ok) => {
      if (ok) {
        setCampaigns((current) => current.filter((campaign) => campaign.id !== pendingId));
      }
      setPendingId(0);
    });
  };

  if (!campaigns.length) {
    return <p className="text-muted-foreground text-sm">{t('empty')}</p>;
  }

  return (
    <>
      <Table>
        <TableCaption>{t('caption')}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>{t('headers.date')}</TableHead>
            <TableHead>{t('headers.progress')}</TableHead>
            <TableHead className="text-center">{t('headers.status')}</TableHead>
            <TableHead className="text-right">{t('headers.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">
                {format(new Date(`${campaign.date}T00:00:00`), humanDateFormat)}
                {campaign.label && (
                  <span className="text-muted-foreground block text-xs">{campaign.label}</span>
                )}
              </TableCell>
              <TableCell>{t('progress', { done: campaign.done, total: campaign.total })}</TableCell>
              <TableCell className="text-center">
                <Badge variant={campaign.active ? 'default' : 'secondary'}>
                  {campaign.active ? t('status.active') : t('status.stopped')}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="end">
                    <DropdownMenuGroup>
                      {campaign.active ? (
                        <DropdownMenuItem onClick={() => handleActiveToggle(campaign.id, false)}>
                          <BellOff /> {t('actions.stop')}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleActiveToggle(campaign.id, true)}>
                          <Bell /> {t('actions.resume')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setPendingId(campaign.id)}
                      >
                        <Trash2 /> {t('actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={pendingId > 0}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDelete.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingId(0)}>
              {t('confirmDelete.button.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeletion}>
              {t('confirmDelete.button.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
