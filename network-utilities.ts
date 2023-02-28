import {NetworkInterfaceInfo} from 'os'
import os from 'os'

export function enumerateNetworkConnections() {
    const connectionInfo: NetworkInterfaceInfo [] = []
    const interfaces = os.networkInterfaces()

    for (const [_, connections] of Object.entries(interfaces)) {
        if (connections && Array.isArray(connections)) {
            connections.forEach(connection => {
                connectionInfo.push(connection)
            })
        }
    }
    return connectionInfo
}

export function getBroadcastAddressList({ipAddress, netmask}: { ipAddress: string, netmask: string }): string {
    const netmaskArray = netmask.split('.')
    return ipAddress
        .split('.')
        .map((e, i) => (~netmaskArray[i] & 0xFF) | parseInt(e)).join('.')
}