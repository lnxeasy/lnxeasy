import {parseServices} from './services.parser.js'

const COMMAND = 'systemctl'
const ARGS = ['list-units', '--type=service', '--all', '--no-pager', '--plain', '--no-legend']

export class ServicesService {
    constructor(run) {
        this.run = run
    }

    async list() {
        const result = await this.run(COMMAND, ARGS)

        return parseServices(result.stdout)
    }
}
