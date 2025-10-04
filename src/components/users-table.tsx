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
} from 'lucide-react';
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

interface Props {
  users: User[];
}

export function UsersTable(props: Props) {
  const [users, setUsers] = useState(props.users || []);
  const [userId, setUserId] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);

  const t = useTranslations('components.usersTable');

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
            <TableHead className="text-center">{t('headers.role')}</TableHead>
            <TableHead className="text-center">{t('headers.approved')}</TableHead>
            <TableHead className="text-center">{t('headers.mfaEnabled')}</TableHead>
            <TableHead className="text-right">{t('headers.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
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
