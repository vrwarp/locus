import { updatePerson } from '../utils/pco';
import type { Student } from '../utils/pco';
import type { Command } from '../utils/commands';

/**
 * Set a batch of people to inactive in Planning Center, reversibly.
 *
 * Ghost archival used to be a bare `for` loop over `archivePerson` in App.tsx.
 * It was the only write in the product on neither undo path — not the command
 * stack, not the five-second toast — which made it both the least reversible
 * action available and the one with the largest blast radius.
 *
 * There is no batch endpoint and no transaction, so the inverse is the same loop
 * with `status: 'active'`. That means partial failure is possible in both
 * directions, and `archived` records which rows actually landed so the caller can
 * tell the operator the truth rather than assuming all-or-nothing.
 */
export class ArchiveCommand implements Command {
    private students: Student[];
    private auth: string;
    private sandboxMode: boolean;
    private onStateChange: (student: Student) => void;

    /** Records this command has actually written, in the order they were written. */
    public readonly archived: Student[] = [];

    constructor(
        students: Student[],
        auth: string,
        sandboxMode: boolean,
        onStateChange: (student: Student) => void
    ) {
        this.students = students;
        this.auth = auth;
        this.sandboxMode = sandboxMode;
        this.onStateChange = onStateChange;
    }

    get description() {
        return this.students.length === 1
            ? `Archived ${this.students[0].name}`
            : `Archived ${this.students.length} records`;
    }

    async execute(): Promise<void> {
        this.archived.length = 0;
        for (const student of this.students) {
            await updatePerson(student.id, { status: 'inactive' }, this.auth, this.sandboxMode);
            this.archived.push(student);
            this.onStateChange(student);
        }
    }

    async undo(): Promise<void> {
        // Only what we actually archived, and newest first so a failure part-way
        // through the reversal leaves the oldest writes — the ones the operator is
        // least likely to be watching — undone rather than stranded.
        for (const student of [...this.archived].reverse()) {
            await updatePerson(student.id, { status: 'active' }, this.auth, this.sandboxMode);
            this.onStateChange(student);
        }
        this.archived.length = 0;
    }

    async redo(): Promise<void> {
        await this.execute();
    }
}
