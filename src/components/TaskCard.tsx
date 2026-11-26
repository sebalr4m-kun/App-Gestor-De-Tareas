import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Task } from '../types/task';

type TaskCardProps = {
  task: Task;
  busy?: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

export function TaskCard({ task, busy = false, onToggle, onDelete }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.card, busy && styles.cardBusy]}>
      <View style={styles.topLine}>
        <Pressable
          testID={`toggle-${task.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Cambiar estado de ${task.title}`}
          disabled={busy}
          style={[styles.check, task.completed && styles.checked]}
          onPress={onToggle}
        >
          <Text style={styles.checkText}>{task.completed ? '✓' : ''}</Text>
        </Pressable>
        <View style={styles.content}>
          <Text style={[styles.title, task.completed && styles.completed]}>{task.title}</Text>
          <View style={styles.row}>
            <Text style={styles.state}>{task.completed ? 'Completada' : 'Pendiente'}</Text>
            <Text style={styles.dividerText}>·</Text>
            <Text style={styles.dateText}>{new Date(task.createdAt).toLocaleString()}</Text>
          </View>
        </View>
        <Pressable
          testID={`expand-${task.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Ver detalle de ${task.title}`}
          onPress={() => setExpanded((current) => !current)}
          style={styles.expandButton}
        >
          <Text style={styles.expandText}>{expanded ? '−' : '+'}</Text>
        </Pressable>
      </View>
      {expanded ? (
        <View style={styles.details} testID={`details-${task.id}`}>
          <Text style={styles.description}>
            {task.description?.trim() ? task.description : 'Sin descripción adicional.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={onDelete}
            style={[styles.deleteButton, busy && styles.buttonDisabled]}
          >
            <Text style={styles.deleteText}>{busy ? 'Procesando...' : 'Eliminar tarea'}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 17, padding: 16, marginBottom: 11, borderWidth: 1, borderColor: '#E7EBF3' },
  cardBusy: { opacity: 0.65 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { height: 25, width: 25, borderRadius: 8, borderWidth: 2, borderColor: '#A9B2C6', justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: '#147D73', borderColor: '#147D73' },
  checkText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  content: { flex: 1 },
  title: { color: '#192846', fontSize: 15, fontWeight: '800', lineHeight: 21 },
  completed: { color: '#97A1B3', textDecorationLine: 'line-through' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  dividerText: { color: '#B0BAC9', fontSize: 11 },
  state: { color: '#147D73', fontSize: 11, fontWeight: '700' },
  dateText: { color: '#63728C', fontSize: 11 },
  expandButton: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#ECF2F7', justifyContent: 'center', alignItems: 'center' },
  expandText: { color: '#294665', fontWeight: '800', fontSize: 19 },
  details: { marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E9EEF4' },
  description: { fontSize: 13, color: '#53627E', lineHeight: 20 },
  deleteButton: { alignSelf: 'flex-start', marginTop: 13, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#FFF0F0', borderRadius: 9 },
  buttonDisabled: { opacity: 0.5 },
  deleteText: { color: '#B63D4E', fontSize: 12, fontWeight: '800' },
});
