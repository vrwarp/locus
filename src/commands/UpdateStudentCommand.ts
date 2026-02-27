import { updatePerson, prepareUpdateAttributes } from '../utils/pco';
import type { Student, PcoAttributes } from '../utils/pco';
import type { Command } from '../utils/commands';

export class UpdateStudentCommand implements Command {
    public original: Student;
    public updated: Student;
    private auth: string;
    private sandboxMode: boolean;
    private onStateChange: (student: Student) => void;

    constructor(
        original: Student,
        updated: Student,
        auth: string,
        sandboxMode: boolean,
        onStateChange: (student: Student) => void
    ) {
        this.original = original;
        this.updated = updated;
        this.auth = auth;
        this.sandboxMode = sandboxMode;
        this.onStateChange = onStateChange;
    }

    get description() {
        return `Update ${this.updated.name}`;
    }

    async execute() {
        const attributes: PcoAttributes = prepareUpdateAttributes(this.original, this.updated);
        if (Object.keys(attributes).length > 0) {
            await updatePerson(this.updated.id, attributes, this.auth, this.sandboxMode);
            this.onStateChange(this.updated);
        }
    }

    async undo() {
        // To undo, we update the person back to the ORIGINAL state.
        // We compare 'updated' (current state) to 'original' (target state).
        const attributes: PcoAttributes = prepareUpdateAttributes(this.updated, this.original);
         if (Object.keys(attributes).length > 0) {
            await updatePerson(this.original.id, attributes, this.auth, this.sandboxMode);
            this.onStateChange(this.original);
        }
    }
}
