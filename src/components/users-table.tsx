'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { User } from '@prisma/client';
import {
  EllipsisVertical,
  Shield,
  ShieldPlus,
  UserRoundPen,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  ShieldUser,
  UserRoundPlus,
  Coins,
  HandCoins,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { deleteUser, setUserApproved } from '@/app/actions/user';
import { useTranslations } from 'next-intl';
import { Roles } from '@/lib/constants';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from './ui/alert-dialog';
import { toast } from 'sonner';
import { allocatePayments } from '@/app/actions/payment';

interface UserWithBalance extends User {
  balance: {
    creditCents: number;
    owedCents: number;
    netBalanceCents: number;
  };
}

interface Props {
  users: UserWithBalance[];
}

export function UsersTable(props: Props) {
  const [users, setUsers] = useState(props.users || []);
  const [userId, setUserId] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);

  const t = useTranslations('components.usersTable');

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const handleAllocateCredits = (id: number) => {
    allocatePayments(id)
      .then((res) => {
        toast.success(
          t('allocateCreditsToast.success', { credits: formatCurrency(res.allocated!) }),
        );
      })
      .catch((err) => {
        toast.error(t('allocateCreditsToast.error'));
      });
  };

  const handleUserApproval = (id: number, approved: boolean) => {
    setUserApproved(id, approved).then((res) => {
      setUsers(
        users.map((user) => ({
          ...user,
          approved: user.id === id && res ? approved : user.approved,
        })),
      );
    });
  };

  const prepareUserDeletion = (id: number) => {
    setUserId(id);
    setModalOpen(true);
  };

  const handleUserDeletion = () => {
    deleteUser(userId).then((res) => {
      setUsers(users.filter((user) => res === false || user.id !== userId));
      setModalOpen(false);
    });
  };

  const iconClassNames = 'mx-auto h-6 w-6';

  return (
    <>
      <Table>
        <TableCaption>{t('caption')}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">{t('headers.name')}</TableHead>
            <TableHead>{t('headers.email')}</TableHead>
            <TableHead className="text-right">{t('headers.balance')}</TableHead>
            <TableHead className="text-center">{t('headers.role')}</TableHead>
            <TableHead className="text-center">{t('headers.approved')}</TableHead>
            <TableHead className="text-center">{t('headers.mfaEnabled')}</TableHead>
            <TableHead className="text-right">{t('headers.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const { owedCents, creditCents, netBalanceCents } = user.balance;

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="text-right font-medium">
                  <span className={cn(netBalanceCents < 0 ? 'text-red-600' : 'text-green-600')}>
                    {formatCurrency(netBalanceCents)}
                  </span>
                </TableCell>
                <TableCell>
                  {user.role === Roles.Admin && <ShieldUser className={iconClassNames} />}
                  {user.role === Roles.Manager && <UserRoundPlus className={iconClassNames} />}
                </TableCell>
                <TableCell>
                  {user.approved ? (
                    <UserRoundCheck className={iconClassNames} />
                  ) : (
                    <UserRound className={cn(iconClassNames, 'text-gray-300')} />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {user.mfaEnabled ? (
                    <ShieldPlus className={iconClassNames} />
                  ) : (
                    <Shield className={cn(iconClassNames, 'text-gray-300')} />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant={'ghost'}>
                        <EllipsisVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link href={`/payment?userId=${user.id}`}>
                            <HandCoins /> {t('actions.recordPayment')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAllocateCredits(user.id)}
                          disabled={owedCents == 0 || creditCents == 0}
                        >
                          <Coins /> {t('actions.allocateCredits')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.approved ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleUserApproval(user.id, false)}
                          >
                            <UserRound /> {t('actions.unapprove')}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleUserApproval(user.id, true)}
                            className="text-green-600 focus:bg-green-600/10"
                          >
                            <UserRoundCheck className="text-green-600" /> {t('actions.approve')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem disabled>
                          <UserRoundPen /> {t('actions.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={user.role === Roles.Admin}
                          onClick={() => prepareUserDeletion(user.id)}
                        >
                          <UserRoundX /> {t('actions.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog open={isModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDelete.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setModalOpen(false)}>
              {t('confirmDelete.button.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleUserDeletion}>
              {t('confirmDelete.button.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
