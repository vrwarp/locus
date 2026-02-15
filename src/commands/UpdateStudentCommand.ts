import { Student, updatePerson, prepareUpdateAttributes } from '../utils/pco';
import { Command } from '../utils/commands';

export class UpdateStudentCommand implements Command {
    constructor(
        public original: Student,
        public updated: Student,
        private auth: string,
        private sandboxMode: boolean,
        private onStateChange: (student: Student) => void
    ) {}

    get description() {
        return `Update ${this.updated.name}`;
    }

    async execute() {
        const attributes = prepareUpdateAttributes(this.original, this.updated);
        if (Object.keys(attributes).length > 0) {
            await updatePerson(this.updated.id, attributes, this.auth, this.sandboxMode);
            this.onStateChange(this.updated);
        }
    }

    async undo() {
        // To undo, we update the person back to the ORIGINAL state.
        // We compare 'updated' (current state) to 'original' (target state).
        const attributes = prepareUpdateAttributes(this.updated, this.original);
         if (Object.keys(attributes).length > 0) {
            await updatePerson(this.original.id, attributes, this.auth, this.sandboxMode);
            this.onStateChange(this.original);
        }
    }
}
