import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseServices } from '../src/modules/services/services.parser.js'

// Lines copied from real `systemctl list-units --type=service --all
// --no-pager --plain --no-legend` output on an Ubuntu machine.
const REAL_SAMPLE = [
    'apt-daily-upgrade.service                loaded    inactive dead    Daily apt upgrade and clean activities',
    'auditd.service                           not-found inactive dead    auditd.service',
    'dbus.service                             loaded    inactive dead    D-Bus System Message Bus',
    'keyboard-setup.service                   loaded    active   exited  Set the console keyboard layout',
    // A long description, from the same real output.
    'getty-static.service                     loaded    inactive dead    getty on tty2-tty6 if dbus and logind are not available',
].join('\n')

// No unit was failed on the machine the samples came from, so this line is
// written by hand in the same format systemctl prints for a failed unit.
const FAILED_SAMPLE = 'backup.service loaded failed failed Daily backup of the server files'

test('parseServices turns systemctl lines into service objects', () => {
    const services = parseServices(REAL_SAMPLE)

    assert.equal(services.length, 5)
    assert.deepEqual(services[0], {
        unit: 'apt-daily-upgrade.service',
        load: 'loaded',
        active: 'inactive',
        sub: 'dead',
        description: 'Daily apt upgrade and clean activities'
    })
})

test('parseServices keeps a not-found unit and its unit name as the description', () => {
    const services = parseServices(REAL_SAMPLE)

    assert.deepEqual(services[1], {
        unit: 'auditd.service',
        load: 'not-found',
        active: 'inactive',
        sub: 'dead',
        description: 'auditd.service'
    })
})

test('parseServices keeps an active unit and a long description whole', () => {
    const services = parseServices(REAL_SAMPLE)

    assert.equal(services[3].active, 'active')
    assert.equal(services[3].sub, 'exited')
    assert.equal(services[4].description, 'getty on tty2-tty6 if dbus and logind are not available')
})

test('parseServices reads a failed unit', () => {
    const services = parseServices(FAILED_SAMPLE)

    assert.deepEqual(services, [{
        unit: 'backup.service',
        load: 'loaded',
        active: 'failed',
        sub: 'failed',
        description: 'Daily backup of the server files'
    }])
})

test('parseServices returns an empty list for empty input', () => {
    assert.deepEqual(parseServices(''), [])
    assert.deepEqual(parseServices('\n\n'), [])
})

test('parseServices skips blank lines between units', () => {
    const services = parseServices(FAILED_SAMPLE + '\n\n' + REAL_SAMPLE.split('\n')[0] + '\n')

    assert.equal(services.length, 2)
    assert.equal(services[0].unit, 'backup.service')
    assert.equal(services[1].unit, 'apt-daily-upgrade.service')
})

test('parseServices allows a line with no description', () => {
    const services = parseServices('cron.service loaded active running')

    assert.deepEqual(services, [{
        unit: 'cron.service',
        load: 'loaded',
        active: 'active',
        sub: 'running',
        description: ''
    }])
})

test('parseServices throws on a line that is not a unit row', () => {
    assert.throws(() => parseServices('just some words'), /Unexpected systemctl output/)
    assert.throws(() => parseServices('cron.service loaded active'), /Unexpected systemctl output/)
})
