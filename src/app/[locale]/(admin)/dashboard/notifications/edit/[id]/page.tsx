// src/app/[locale]/(admin)/dashboard/notifications/edit/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import NotificationForm from '../_components/NotificationForm';

export default function EditNotificationPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  return <NotificationForm notificationId={id} />;
}
