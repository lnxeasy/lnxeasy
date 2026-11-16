import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Router } from '../src/http/router.js'
import { regServicesRoutes } from '../src/modules/services/services.routes.js'

function createFakeResponse() {
    const res = {
        headersSent: false,
        statusCode: null,
        headers: null,
        body: null,
    }

    res.writeHead = (statusCode, headers) => {
        res.statusCode = statusCode
        res.headers = headers
        res.headersSent = true
    }

    res.end = (body) => {
        res.body = body
    }

    return res
}

// A fake service: the routes file only needs an object with an async list().
function createFakeServicesService() {
    return {
        list: async () => {
            return [{ unit: 'cron.service', load: 'loaded', active: 'active', sub: 'running', description: 'Cron daemon' }]
        },
    }
}

test('regServicesRoutes registers GET /api/services', () => {
    const router = new Router()

    regServicesRoutes(router, createFakeServicesService())

    const handler = router.match('GET', '/api/services')
    assert.equal(typeof handler, 'function')
})

test('GET /api/services answers 200 with the list from the service', async () => {
    const router = new Router()
    regServicesRoutes(router, createFakeServicesService())
    const handler = router.match('GET', '/api/services')
    const res = createFakeResponse()

    await handler({}, res)

    assert.equal(res.statusCode, 200)
    assert.deepEqual(JSON.parse(res.body), {
        data: [{ unit: 'cron.service', load: 'loaded', active: 'active', sub: 'running', description: 'Cron daemon' }]
    })
})

test('the handler asks the service again on every request', async () => {
    let calls = 0
    const service = {
        list: async () => {
            calls = calls + 1
            return []
        },
    }
    const router = new Router()
    regServicesRoutes(router, service)
    const handler = router.match('GET', '/api/services')

    await handler({}, createFakeResponse())
    await handler({}, createFakeResponse())

    assert.equal(calls, 2)
})

test('the handler lets a service error reach the caller', async () => {
    const service = {
        list: async () => {
            throw new Error('systemctl failed')
        },
    }
    const router = new Router()
    regServicesRoutes(router, service)
    const handler = router.match('GET', '/api/services')
    const res = createFakeResponse()

    await assert.rejects(() => handler({}, res), { message: 'systemctl failed' })
    assert.equal(res.statusCode, null)
})
