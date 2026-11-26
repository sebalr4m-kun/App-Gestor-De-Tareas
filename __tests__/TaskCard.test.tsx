import { fireEvent, render } from '@testing-library/react-native';
import { TaskCard } from '../src/components/TaskCard';
import type { Task } from '../src/types/task';

const sampleTask: Task = {
  id: 1,
  title: 'Probar endpoint REST',
  description: 'Verificar respuesta JSON desde backend.',
  createdAt: '2026-11-25T20:00:00.000Z',
  completed: false,
};

describe('TaskCard', () => {
  it('renderiza el título y alterna estado', () => {
    const onToggle = jest.fn();
    const onDelete = jest.fn();
    const { getByText, getByTestId } = render(
      <TaskCard task={sampleTask} onToggle={onToggle} onDelete={onDelete} />
    );

    expect(getByText('Probar endpoint REST')).toBeTruthy();
    fireEvent.press(getByTestId('toggle-1'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('expande y muestra la descripción', () => {
    const { getByTestId, getByText } = render(
      <TaskCard task={sampleTask} onToggle={jest.fn()} onDelete={jest.fn()} />
    );

    fireEvent.press(getByTestId('expand-1'));
    expect(getByText('Verificar respuesta JSON desde backend.')).toBeTruthy();
  });
});
