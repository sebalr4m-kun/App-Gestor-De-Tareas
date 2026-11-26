import { filterTasks } from '../src/utils/taskFilters';
import type { Task } from '../src/types/task';

const demo: Task[] = [
  { id: 1, title: 'Validar login', description: '', createdAt: '2026-11-25T10:00:00Z', completed: false },
  { id: 2, title: 'Corregir navegación', description: '', createdAt: '2026-11-25T11:00:00Z', completed: true },
  { id: 3, title: 'Probar API lenta', description: '', createdAt: '2026-11-25T12:00:00Z', completed: false },
];

describe('filterTasks', () => {
  it('busca sin distinguir entre minúsculas y mayúsculas', () => {
    expect(filterTasks(demo, 'VALIDAR', 'todas')).toHaveLength(1);
  });
  it('ignora espacios antes y después de la búsqueda', () => {
    expect(filterTasks(demo, ' login ', 'todas')).toHaveLength(1);
  });
  it('filtra pendientes', () => {
    expect(filterTasks(demo, '', 'pendientes')).toHaveLength(2);
  });
});
