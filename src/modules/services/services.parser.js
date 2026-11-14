export function parseServices(text) {
    const services = []
    const lines = text.split('\n')

    for (const line of lines) {
        if (line.trim() === '') {
            continue
        }

        services.push(parseServiceLine(line))
    }

    return services
}

function parseServiceLine(line) {
    const match = line.match(/^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)(?:\s+(.*))?$/)

    if (match === null) {
        throw new Error(`Unexpected systemctl output: ${line}`)
    }

    let description = match[5]
    if (description === undefined) {
        description = ''
    }

    return {
        unit: match[1],
        load: match[2],
        active: match[3],
        sub: match[4],
        description: description
    }
}
