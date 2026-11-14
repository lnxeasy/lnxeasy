import {sendJson} from '../../http/response.js'

export function regServicesRoutes(router, servicesService) {
    router.get('/api/services', async (req, res) => {
        const services = await servicesService.list()
        sendJson(res, 200, services)
    })
}
