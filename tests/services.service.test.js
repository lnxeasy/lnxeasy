import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ServicesService } from '../src/modules/services/services.service.js'

const SAMPLE_OUTPUT = [
    'cron.service                             loaded    active   running Cron daemon',
    'backup.service                           loaded    failed   failed  Daily backup of the server files',
].join('\n')

test('list runs systemctl with fixed arguments and parses the output', async () => {
    let seenCommand = null
    let seenArgs = null

    const run = async (command, args) => {
        seenCommand = command
        seenArgs = args
        return { stdout: SAMPLE_OUTPUT, stderr: '' }
    }

    const service = new ServicesService(run)
    const services = await service.list()

    assert.equal(seenCommand, 'systemctl')
    assert.deepEqual(seenArgs, ['list-units', '--type=service', '--all', '--no-pager', '--plain', '--no-legend'])
    assert.deepEqual(services, [
        { unit: 'cron.service', load: 'loaded', active: 'active', sub: 'running', description: 'Cron daemon' },
        { unit: 'backup.service', load: 'loaded', active: 'failed', sub: 'failed', description: 'Daily backup of the server files' },
    ])
})

test('list lets a failed command reach the caller', async () => {
    const run = async () => {
        throw new Error('systemctl failed')
    }

    const service = new ServicesService(run)

    await assert.rejects(() => service.list(), { message: 'systemctl failed' })
})
