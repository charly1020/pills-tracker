import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { PillForm } from '../../components/PillForm';
import { deletePill, getPill, insertPill, updatePill, type PillDraft } from '../../db/repository';
import { reconcileAlarms } from '../../alarm/service';
import { deletePhoto } from '../../photos/photos';

export default function PillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const [initial, setInitial] = useState<(PillDraft & { id: number }) | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    getPill(Number(id)).then((p) => {
      setInitial(p);
      setLoading(false);
    });
  }, [id, isNew]);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 48 }} />;

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Nueva pastilla' : 'Editar pastilla' }} />
      <PillForm
        initial={initial ?? undefined}
        onSave={async (draft) => {
          if (isNew) await insertPill(draft);
          else await updatePill(Number(id), draft);
          await reconcileAlarms();
          router.back();
        }}
        onDelete={
          isNew
            ? undefined
            : async () => {
                await deletePill(Number(id));
                deletePhoto(initial?.photoUri ?? null);
                await reconcileAlarms();
                router.back();
              }
        }
      />
    </>
  );
}
