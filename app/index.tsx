import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator, FlatList, Keyboard, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { TaskCard } from '../src/components/TaskCard';
import { StatusTabs } from '../src/components/StatusTabs';
import { ApiError, tasksService } from '../src/services/taskService';
import type { Task, TaskStatus } from '../src/types/task';
import { isValidTaskTitle } from '../src/utils/taskValidation';

export default function TaskManagerScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todas');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const sequence = useRef(0);
  const creating = useRef(false);
  const filters = useRef({ search: query, status });
  filters.current = { search: query, status };

  const loadTasks = useCallback(async (signal?: AbortSignal) => {
    const requestId = ++sequence.current;
    setLoading(true);
    setError(null);

    try {
      const records = await tasksService.list(filters.current, signal);
      if (requestId === sequence.current) {
        setTasks(records);
      }
    } catch (caught) {
      if (caught instanceof Error && caught.name === 'AbortError') {
        return;
      }
      if (requestId === sequence.current) {
        const msg =
Usa el código con precaución.
caught instanceof ApiError
? Error ${caught.status}: ${caught.message}
: 'No pudimos conectar con el servidor. Verificá tu red e intentá de nuevo.';
setError(msg);
}
} finally {
if (requestId === sequence.current) {
setLoading(false);
}
}
}, []);
useEffect(() => {
const controller = new AbortController();
const timer = setTimeout(() => {
void loadTasks(controller.signal);
}, 275);
return () => {
clearTimeout(timer);
controller.abort();
};
}, [query, status, loadTasks]);
async function addTask() {
if (creating.current || saving) return;
if (!isValidTaskTitle(newTitle)) {
setFeedback('Ingresá un título válido (1 a 200 bytes UTF-8).');
return;
}
const description = newDescription.trim();
if (new TextEncoder().encode(description).length > 10000) {
setFeedback('La descripción admite hasta 10000 bytes UTF-8.');
return;
}
creating.current = true;
setSaving(true);
setFeedback('');
try {
await tasksService.create({
title: newTitle.trim(),
description,
});
setNewTitle('');
setNewDescription('');
setFeedback('Tarea creada en el servidor.');
Keyboard.dismiss();
await loadTasks();
} catch (caught) {
const msg =
caught instanceof ApiError
? No se pudo crear (${caught.status}): ${caught.message}
: 'Error de red al crear la tarea. No reintentes sin verificar.';
setFeedback(msg);
} finally {
creating.current = false;
setSaving(false);
}
}
async function mutate(id: number, action: () => Promise, successMessage?: string) {
if (busy.has(id)) return;
setBusy((prev) => new Set(prev).add(id));
try {
await action();
if (successMessage) setFeedback(successMessage);
await loadTasks();
} catch (caught) {
if (caught instanceof ApiError && caught.status === 404) {
setFeedback('La tarea ya no existe en el servidor. Actualizando lista...');
await loadTasks();
} else {
setFeedback(
caught instanceof ApiError
? Error ${caught.status}: ${caught.message}
: 'Error de conexión al actualizar la tarea.'
);
}
} finally {
setBusy((prev) => {
const next = new Set(prev);
next.delete(id);
return next;
});
}
}
function toggleTask(id: number) {
const task = tasks.find((item) => item.id === id);
if (!task) return;
void mutate(id, async () => {
const updated = await tasksService.setCompleted(id, !task.completed);
setTasks((previous) =>
previous.map((item) => (item.id === id ? updated : item))
);
});
}
function deleteTask(id: number) {
void mutate(
id,
async () => {
await tasksService.remove(id);
},
'Tarea eliminada.'
);
}
const total = tasks.length;
const completed = tasks.filter((task) => task.completed).length;
return (
<SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
<FlatList
data={tasks}
keyExtractor={(item) => String(item.id)}
renderItem={({ item }) => (
<TaskCard
busy={busy.has(item.id)}
task={item}
onToggle={() => toggleTask(item.id)}
onDelete={() => deleteTask(item.id)}
/>
)}
keyboardShouldPersistTaps="handled"
contentContainerStyle={styles.listContainer}
ListHeaderComponent={
<>
<Pressable accessibilityRole="button" onPress={() => router.push('/guia')} style={styles.helpButton}>
<View style={[styles.stat, styles.statDark]}>
<Pressable
accessibilityRole="button"
testID="add-task-button"
disabled={saving}
style={[styles.addButton, saving && styles.addButtonDisabled]}
onPress={() => void addTask()}
>
{feedback ? {feedback} : null}
<Pressable accessibilityRole="button" style={styles.retryButton} onPress={() => void loadTasks()}>
{error ? {error} : null}
{loading ? (

) : null}
</>
}
ListEmptyComponent={!loading ? No hay tareas para mostrar con estos filtros. : null}
ListFooterComponent={EDI · Desarrollo de Software Multiplataforma · Integración API REST}
/>

);
}
const styles = StyleSheet.create({
screen: { flex: 1, backgroundColor: '#F5F7FB' },
listContainer: { paddingHorizontal: 19, paddingTop: 18, paddingBottom: 55, flexGrow: 1 },
eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
eyebrow: { fontSize: 10, letterSpacing: 1.5, fontWeight: '900', color: '#168879' },
helpButton: { backgroundColor: '#E5EFEC', paddingVertical: 8, paddingHorizontal: 11, borderRadius: 9 },
helpText: { fontWeight: '800', color: '#187A71', fontSize: 12 },
heading: { fontSize: 30, fontWeight: '900', color: '#172743', marginTop: 12 },
subtitle: { color: '#75829A', fontSize: 13, marginTop: 7, marginBottom: 21, lineHeight: 20 },
statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
stat: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 15, flex: 1, borderColor: '#E7EBF3', borderWidth: 1 },
statDark: { backgroundColor: '#192C4D', borderColor: '#192C4D' },
statLabel: { fontWeight: '800', color: '#8390A5', fontSize: 9, letterSpacing: 0.35 },
statLabelLight: { fontWeight: '800', color: '#B3C4DD', fontSize: 9, letterSpacing: 0.35 },
statNumber: { marginTop: 8, color: '#1B3150', fontWeight: '900', fontSize: 25 },
statNumberLight: { marginTop: 8, color: '#FFFFFF', fontWeight: '900', fontSize: 25 },
label: { fontSize: 11, color: '#384E6D', fontWeight: '900', letterSpacing: 1.1, marginBottom: 10 },
sectionHeading: { marginTop: 12 },
addRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
addInput: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E6F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, color: '#1D3151', fontSize: 13, minWidth: 0 },
descriptionInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E6F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#1D3151', fontSize: 13, marginBottom: 8, minHeight: 44 },
addButton: { backgroundColor: '#147D73', paddingHorizontal: 13, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
addButtonDisabled: { opacity: 0.6 },
addButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
feedback: { color: '#147D73', fontSize: 12, marginBottom: 8, fontWeight: '600' },
searchInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E6F0', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 13, color: '#1D3151', fontSize: 13, marginBottom: 12 },
actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 7, marginBottom: 13 },
retryButton: { paddingVertical: 11, paddingHorizontal: 11, backgroundColor: '#E5F2EF', borderRadius: 10, flex: 1, alignItems: 'center' },
retryLabel: { fontSize: 11, color: '#18776D', fontWeight: '800' },
error: { color: '#A53D49', backgroundColor: '#FFF0F0', padding: 11, borderRadius: 10, fontWeight: '700', marginBottom: 10, fontSize: 12 },
loading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
loadingLabel: { color: '#75829A', fontSize: 12 },
empty: { marginTop: 30, textAlign: 'center', color: '#8490A5', lineHeight: 20, fontSize: 13 },
footer: { textAlign: 'center', color: '#A4AFC1', fontSize: 10, paddingTop: 30 },
});
