import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArchiveCommand } from './ArchiveCommand';
import { updatePerson } from '../utils/pco';
import type { Student } from '../utils/pco';

vi.mock('../utils/pco', () => ({ updatePerson: vi.fn() }));

const person = (id: string, name: string) => ({ id, name } as Student);

describe('ArchiveCommand', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets each person inactive and reports what it wrote', async () => {
    (updatePerson as any).mockResolvedValue({});
    const onStateChange = vi.fn();
    const command = new ArchiveCommand([person('1', 'A'), person('2', 'B')], 'auth', false, onStateChange);

    await command.execute();

    expect(updatePerson).toHaveBeenCalledWith('1', { status: 'inactive' }, 'auth', false);
    expect(command.archived.map(s => s.id)).toEqual(['1', '2']);
    expect(onStateChange).toHaveBeenCalledTimes(2);
  });

  it('reverses the archival on undo', async () => {
    (updatePerson as any).mockResolvedValue({});
    const command = new ArchiveCommand([person('1', 'A')], 'auth', false, vi.fn());

    await command.execute();
    await command.undo();

    expect(updatePerson).toHaveBeenLastCalledWith('1', { status: 'active' }, 'auth', false);
    expect(command.archived).toHaveLength(0);
  });

  it('undoes only the records that actually landed', async () => {
    // No batch endpoint and no transaction, so a mid-batch failure is possible.
    // Reversing a record that was never archived would be a second wrong write.
    (updatePerson as any)
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('PCO said no'));
    const command = new ArchiveCommand([person('1', 'A'), person('2', 'B')], 'auth', false, vi.fn());

    await expect(command.execute()).rejects.toThrow('PCO said no');
    expect(command.archived.map(s => s.id)).toEqual(['1']);

    (updatePerson as any).mockResolvedValue({});
    await command.undo();

    const reactivated = (updatePerson as any).mock.calls
      .filter((c: any[]) => c[1].status === 'active')
      .map((c: any[]) => c[0]);
    expect(reactivated).toEqual(['1']);
  });

  it('names the record when there is only one', () => {
    expect(new ArchiveCommand([person('1', 'Jean Vega')], 'auth', false, vi.fn()).description)
      .toBe('Archived Jean Vega');
  });
});
